const express = require("express");

const BooksController = require("../controllers/books.controller");
const tokenMiddleware = require('../middlewares/token.middleware');

const router = express.Router();

// Routes for CRUD of Books Model
router.post("/books/getBooks", tokenMiddleware, BooksController.getBooks);
router.post("/books/addBook", tokenMiddleware, BooksController.addBook);
router.get("/books/getBook/:id", tokenMiddleware, BooksController.findBookById);
router.put("/books/updateBook/:id", tokenMiddleware, BooksController.updateBook);
router.delete("/books/deleteBook/:id", BooksController.deleteBook);
router.post("/books/requestBook", tokenMiddleware, BooksController.requestBook);

module.exports = router;