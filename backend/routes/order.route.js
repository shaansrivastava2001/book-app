const express = require("express");

const OrderController = require("../controllers/order.controller");
const PaymentController = require("../controllers/payment.controller");
const tokenMiddleware = require('../middlewares/token.middleware');

const router = express.Router();

// Routes for order

// Dashboard stats (auth-required, no role gating)
router.get("/orders/stats", tokenMiddleware, OrderController.getStats);

// Single order detail (owner or admin)
router.get("/orders/byId/:id", tokenMiddleware, OrderController.getOrderById);

// Razorpay test-mode payment endpoints (token-protected)
router.post("/orders/payment/createOrder", tokenMiddleware, PaymentController.createOrder);
router.post("/orders/payment/verify",      tokenMiddleware, PaymentController.verifyPayment);
router.post("/orders/payment/details",     tokenMiddleware, PaymentController.getDetails);

// Gets list of orders of an user
router.get("/orders/getOrder/:id", tokenMiddleware, OrderController.getUserOrders);

// Adds an order to the order model
router.post("/orders/addOrder", tokenMiddleware, OrderController.addOrder);

// Gets all the order for admin
router.get("/orders/admin/getOrders", tokenMiddleware, OrderController.getOrders);

// Gets all the order for admin
router.get("/orders/getBooksInOrder/:id", tokenMiddleware, OrderController.getBooksInOrder);

module.exports = router;
