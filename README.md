# Pagevine

Pagevine is a community library built with the MERN stack (MongoDB, Express.js, React.js, Node.js) — neighbors donate the books they've finished, request the ones they want next, and pay for orders through Razorpay (test mode). The backend uses a **microservices architecture** with separate services for users, books, cart, and orders.

## Architecture Overview

The application consists of:
- **Frontend**: React.js running on `http://localhost:3000`
- **Backend Microservices**: Independent services running on separate ports:
  - **Users Service**: Handles user authentication and profiles (Port: `USERS_PORT`)
  - **Books Service**: Manages book listings and details (Port: `BOOKS_PORT`)
  - **Cart Service**: Manages shopping cart operations (Port: `CART_PORT`)
  - **Orders Service**: Handles order processing (Port: `ORDERS_PORT`)
- **Database**: MongoDB for data storage

## Prerequisites

Before you begin, make sure you have the following prerequisites installed on your machine:

- **Node.js**: v20 or newer (tested on v20 LTS through v25). Install from https://nodejs.org. The backend ships a small `patch-package` patch for `buffer-equal-constant-time` (a transitive dep of `jsonwebtoken`) so it runs on Node 22+ where `SlowBuffer` was removed; this is applied automatically by `npm install` via the `postinstall` hook.
- **Git**: Install the latest stable version from https://git-scm.com/downloads
- **MongoDB**: Set up a MongoDB instance (local or Atlas) from https://cloud.mongodb.com/

## Setup Instructions

### Step 1: Clone the Project

1) Open your terminal or command prompt.
2) Change to the directory where you want to clone the project.
3) Run the following command:
   ```bash
   git clone https://github.com/shaansrivastava2001/book-app.git
   cd book-App
   ```

### Step 2: Set up the Backend Microservices

1) Navigate to the backend folder:
   ```bash
   cd backend
   ```

2) Install dependencies:
   ```bash
   npm install
   ```

3) Create a `.env` file in the backend folder and copy the content from `sample.env`:
   ```bash
   cp sample.env .env
   ```
   
   Update the `.env` file with your configuration:
   ```
   USERS_PORT=4000
   ORDERS_PORT=4001
   CART_PORT=4002
   BOOKS_PORT=4003
   MONGO_URI=<your_mongodb_uri>
   EMAIL=<admin_email>
   PASSWORD=<app_password_from_google>
   SECRET_KEY=<your_jwt_secret_key>
   SESSION_SECRET=<your_session_secret>
   ```

   These match the defaults baked into each microservice entry file. If you set a single `PORT` instead, all services will try to bind to it — use the per-service vars above.

4) Set up the admin user in the database:
   ```bash
   npm run setup
   ```

5) Start the microservices. Pick one of the options below.

   > Note: `backend/server.js` is a shared Express app factory and is **not** a runnable entry point. Only the files in `backend/microservices/` start a server.

   **Option A — npm scripts (separate terminals):**
   ```bash
   npm run start:user    # Users service
   npm run start:book    # Books service
   npm run start:cart    # Cart service
   npm run start:order   # Orders service
   ```

   **Option B — plain node (separate terminals):**
   ```bash
   node microservices/users-ms.js
   node microservices/books-ms.js
   node microservices/cart-ms.js
   node microservices/orders-ms.js
   ```

   **Option C — VS Code (run all at once):**

   Open the **Run and Debug** panel (`Cmd+Shift+D` / `Ctrl+Shift+D`), select **All Microservices** from the dropdown, and press the green play button. This launches all four services together using the compound config in [`.vscode/launch.json`](.vscode/launch.json) and loads `backend/.env` automatically. Individual services (`Users MS`, `Books MS`, `Cart MS`, `Orders MS`) are also available in the same dropdown.

### Step 3: Set up the Frontend

1) Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2) Install dependencies:
   ```bash
   npm install
   ```

3) Create a `.env` file in the frontend folder and copy the content from `sample.env`:
   ```bash
   cp sample.env .env
   ```
   
   Update the `.env` file with your configuration. The frontend talks to each microservice directly, so set one URL per service (matching the ports configured for the backend):
   ```
   REACT_APP_USER_MS_URL=http://localhost:4000
   REACT_APP_ORDER_MS_URL=http://localhost:4001
   REACT_APP_CART_MS_URL=http://localhost:4002
   REACT_APP_BOOK_MS_URL=http://localhost:4003
   REACT_APP_GOOGLE_CLIENT_ID=<your_google_client_id>
   ```

4) Start the development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000` and automatically connect to the backend microservices.

#### Getting a Google OAuth Client ID (for "Sign in with Google")

The frontend uses Google's Identity Services for the "Continue with Google" button. You'll need a free OAuth 2.0 Client ID from Google Cloud Console — only the **Client ID** is required on the frontend; the **Client Secret** must NOT be placed in `frontend/.env` (anything in there is bundled into the JS that ships to every browser).

1) Open the credentials page: https://console.cloud.google.com/apis/credentials
   Sign in with the Google account you want to own this OAuth app.

2) **Create or select a project** at the top of the page (the project dropdown next to the Google Cloud logo). For a new project, click **New Project**, name it (e.g. `book-app`), and switch to it once it's created.

3) **Configure the OAuth consent screen** (required before creating credentials):
   - Left sidebar → **APIs & Services → OAuth consent screen**.
   - Pick **External** user type (unless you're on Google Workspace).
   - Fill in the required fields: app name (`Pagevine`), user support email, and developer contact email. The rest can stay blank for development.
   - On the **Scopes** step, leave defaults — `openid`, `profile`, `email` are added automatically.
   - On the **Test users** step, add your own Google account (the app stays in "Testing" mode until you publish it; only listed test users can sign in).
   - Save and exit.

4) **Create the OAuth Client ID:**
   - Back to **APIs & Services → Credentials**.
   - Click **+ Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: anything (e.g. `book-app-web`).
   - Under **Authorized JavaScript origins**, click **+ Add URI** and enter `http://localhost:3000` (this is the frontend dev server). For production, add the deployed origin too (e.g. `https://book.example.com`).
   - You can leave **Authorized redirect URIs** empty — the Google Identity Services credential popup flow doesn't redirect.
   - Click **Create**.

5) Copy the **Client ID** from the dialog (it ends with `.apps.googleusercontent.com`). Ignore the Client Secret — the frontend doesn't need it.

6) Paste the Client ID into `frontend/.env`:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=<paste your Client ID here>
   ```

7) **Restart `npm start`.** Create-React-App only reads `.env` at boot, so a hard reload isn't enough.

   The "Continue with Google" button on the Login screen should now load. If it doesn't render, double-check that `http://localhost:3000` is listed under **Authorized JavaScript origins** — Google silently refuses to render the button on unauthorized origins.

#### Getting Razorpay Test Keys (for checkout payment)

The cart's checkout flow opens a **Razorpay** modal in test mode — no real money is charged. Test keys (prefixed `rzp_test_…`) only accept Razorpay's test cards.

1) Sign up / log in at https://dashboard.razorpay.com (free, no card or KYC required to use test mode).

2) **Switch the dashboard to TEST MODE** using the toggle at the top-left (next to the Razorpay logo). All keys generated while in Test Mode are test keys.

3) **Generate API keys:**
   - Sidebar → **Account & Settings → API Keys**.
   - Click **Generate Test Key**.
   - Copy both values — `Key ID` (starts with `rzp_test_`) and `Key Secret`. The secret is shown only once; if you lose it, regenerate.

4) Put the keys in your env files:

   In `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=<your_test_key_secret>
   ```

   In `frontend/.env`:
   ```
   REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   ```
   (Same value as the backend's `KEY_ID`. The secret stays backend-only.)

5) Restart the orders microservice (backend reads env at boot) and the frontend dev server.

6) **To pay during testing**, Razorpay test accounts are **domestic-only by default** — the generic Visa `4111 1111 1111 1111` is flagged as international and will be rejected. Use the verified Indian test card below:

   **Test card (recommended):**

   | Field | Value |
   |---|---|
   | Card number | `5267 3181 8797 5449` |
   | Expiry | any future date (e.g. `12/30`) |
   | CVV | any 3 digits (e.g. `123`) |
   | Name on card | anything |
   | OTP | `123456` |

   **Other test methods that work without enabling international payments:**

   - **UPI** — pick "UPI" in the modal and enter UPI ID `success@razorpay` (or `failure@razorpay` to deliberately test the failure flow — the failed order will show up in your Order history with status "Failed" and the failure reason).
   - **Net banking** — pick any bank in the modal, then click **Success** on the simulator screen.

   Full list of test cards / UPI / netbanking flows: https://razorpay.com/docs/payments/payments/test-card-details/

   If you want to use international test cards too, enable international payments in the dashboard (Settings → Configuration → International), then `4111 1111 1111 1111` works.

### Step 4: Database Setup

1) Create a new database on MongoDB Atlas: https://cloud.mongodb.com/

2) Obtain the MongoDB URI and add it to your backend `.env` file:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database_name>
   ```

3) Run the setup script to create the admin user (from the backend directory):
   ```bash
   npm run setup
   ```

### Step 5: Access the Application

1) Open your web browser and navigate to `http://localhost:3000`

2) You should see Pagevine running successfully with all microservices operational.

## Troubleshooting

- **Environment variables not loading**: Make sure the `.env` file is created correctly without spaces around the `=` sign.
- **Microservices not connecting**: Ensure all microservices are running on their configured ports.
- **Database connection issues**: Verify your `MONGO_URI` is correct and your MongoDB instance is accessible.
- **CORS errors**: Check that the frontend `REACT_APP_API_URL` matches your backend port configuration.
