# Book-App

The book app built using the MERN stack (MongoDB, Express.js, React.js, Node.js) is a comprehensive application that allows users to search for, view, and manage books. The backend is built using a **microservices architecture** with separate services for users, books, cart, and orders.

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

- **Node.js**: Install the latest stable version from https://nodejs.org
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
   PORT=4000
   USERS_PORT=4001
   BOOKS_PORT=4002
   CART_PORT=4003
   ORDERS_PORT=4004
   MONGO_URI=<your_mongodb_uri>
   EMAIL=<admin_email>
   PASSWORD=<app_password_from_google>
   SECRET_KEY=<your_jwt_secret_key>
   SESSION_SECRET=<your_session_secret>
   ```

4) Set up the admin user in the database:
   ```bash
   npm run setup
   ```

5) Start the microservices. You can run them in separate terminals:
   
   **Terminal 1 - Users Service:**
   ```bash
   node microservices/users-ms.js
   ```
   
   **Terminal 2 - Books Service:**
   ```bash
   node microservices/books-ms.js
   ```
   
   **Terminal 3 - Cart Service:**
   ```bash
   node microservices/cart-ms.js
   ```
   
   **Terminal 4 - Orders Service:**
   ```bash
   node microservices/orders-ms.js
   ```

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
   
   Update the `.env` file with your configuration:
   ```
   REACT_APP_API_URL=http://localhost:4000
   REACT_APP_GOOGLE_CLIENT_ID=<your_google_client_id>
   ```

4) Start the development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000` and automatically connect to the backend microservices.

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

2) You should see the Book App running successfully with all microservices operational.

## Troubleshooting

- **Environment variables not loading**: Make sure the `.env` file is created correctly without spaces around the `=` sign.
- **Microservices not connecting**: Ensure all microservices are running on their configured ports.
- **Database connection issues**: Verify your `MONGO_URI` is correct and your MongoDB instance is accessible.
- **CORS errors**: Check that the frontend `REACT_APP_API_URL` matches your backend port configuration.
