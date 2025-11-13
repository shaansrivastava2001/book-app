const express = require("express");

const OrderController = require("../controllers/order.controller");
const tokenMiddleware = require('../middlewares/token.middleware');

const router = express.Router();

// Routes for order

// Gets list of orders of an user
router.get("/orders/getOrder/:id", tokenMiddleware, OrderController.getUserOrders);

// Adds an order to the order model
router.post("/orders/addOrder", tokenMiddleware, OrderController.addOrder);

// Gets all the order for admin
router.get("/orders/admin/getOrders", tokenMiddleware, OrderController.getOrders);

// Gets all the order for admin
router.get("/orders/getBooksInOrder/:id", tokenMiddleware, OrderController.getBooksInOrder);

module.exports = router;
