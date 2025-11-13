const express = require("express");

const CartController = require("../controllers/cart.controller");
const tokenMiddleware = require('../middlewares/token.middleware');

const router = express.Router();

// Routes for cart

// Adds an item to the cart
router.post("/cart/addToCart", tokenMiddleware, CartController.addToCart);

// Gets the cart items for an user
router.post("/cart/getCartItems", tokenMiddleware, CartController.getCartItems);

// Clears the cart for the user
router.post("/cart/clearCart", tokenMiddleware, CartController.clearCart);

// Change the quantity of items in cart in case of increment and decrement
router.put("/cart/updateQuantity/:userId/:itemId", tokenMiddleware, CartController.changeQuantity);

// Change the quantities of books in the cart collection when user checks out
router.post("/cart/updateQuantitiesInCart/:userId", tokenMiddleware, CartController.updateQuantitiesInCart);

// Deletes and item from the cart
router.delete("/cart/deleteItem/:itemId/:userId", tokenMiddleware, CartController.deleteItem);

// Compare the quantity of item in cart and in books model
router.post("/cart/compareQuantity", tokenMiddleware, CartController.compareQuantity);

// Get quantities of book in cart and books model
router.get("/cart/getQuantities/:userId/:itemId/:bookId", tokenMiddleware, CartController.getQuantities)

// Checkout user in case of purchase
router.post("/cart/checkout", tokenMiddleware, CartController.checkout);

// Sends an email to the user/admin in case of checkout
router.post('/cart/sendEmail', tokenMiddleware, CartController.sendMails);

// Gets the count of cart items of an user
router.post('/cart/getCartCount', tokenMiddleware, CartController.countCartItems);

module.exports = router;
