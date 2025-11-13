require("dotenv").config();

const express = require("express");
const expressSession = require("express-session");
const path = require("path");
const cors = require("cors");

/**
 * createApp - returns an Express app with only the selected route groups mounted.
 *
 * @param {Array<string>} modules - optional array of module names to mount: 'users','books','cart','order'.
 *                                  If omitted, all modules are mounted.
 */
function createApp(modules) {
  const app = express();

  app.use(express.json());
  app.use(cors());

  // Middleware used for Express session for Google login
  app.use(
    expressSession({ secret: process.env.SESSION_SECRET || "secret", resave: false, saveUninitialized: false })
  );

  const mount = (name, file) => {
    if (!modules || modules.includes(name)) {
      app.use("/", require(path.join(__dirname, file)));
    }
  };

  mount("cart", "routes/cart.route.js");
  mount("users", "routes/users.route.js");
  mount("books", "routes/books.route.js");
  mount("order", "routes/order.route.js");

  return app;
}

module.exports = { createApp };
