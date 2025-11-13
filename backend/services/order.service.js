const OrderModel = require("../database/schema/order.schema");
const CartModel = require("../database/schema/cart.schema");
const PurchasedBooksModel = require("../database/schema/purchased_books.schema");

/**
 * Class for order service
 */
class OrderService {
  /**
   * Gets orders placed by an user
   * @returns {Array} 
   */

  static async getUserOrders(userId) {
    try {
      const orders = await OrderModel.find({ userId: userId });
      console.log(`OrderService.getUserOrders - success userId=${userId} count=${orders.length}`);
      return orders;
    } catch (error) {
      console.error(`OrderService.getUserOrders - error userId=${userId}`, error);
      throw error;
    }
  }


  /**
   * Returns orders list according to the applied filter
   * @param {Integer} skip 
   * @param {Integer} limit 
   * @param {String} searchQuery 
   * @returns {Array} array of orders as per filter
   */
  static async getOrders(skip, limit, searchQuery) {
    try {
      const orders = await OrderModel.find({
        $or: [{ name: { $regex: searchQuery, $options: "i" } }],
      })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

      console.log(`OrderService.getOrders - success count=${orders.length}`);
      return orders;
    } catch (error) {
      console.error(`OrderService.getOrders - error`, error);
      throw error;
    }
  }

  /**
   * Adds a book to the purchased books collection
   * @param {Object} book 
   * @param {String} orderId 
   * @returns added book to the purchased books model
   */
  static async addBook(book,orderId){
    try {
      let purchased_book = {
        title: book.title,
        bookId: book.bookId,
        author: book.author,
        quantity: book.quantity,
        sale_price: book.sale_price,
        userId: book.userId,
        userEmail: book.userEmail,
        orderId,
      };
      const purchasedBook = new PurchasedBooksModel(purchased_book);

      await purchasedBook.save();
      console.log(`OrderService.addBook - success purchasedBookId=${purchasedBook._id}`);
      return purchasedBook;
    } catch (error) {
      console.error(`OrderService.addBook - error bookId=${book.bookId} orderId=${orderId}`, error);
      throw error;
    }
  }
  
  /**
   * Adds an order to the order collection
   * @param {Object} body 
   * @returns {Object} added new order
   */
  static async addOrder(body){
    try {
      body.status = "Placed";
      const newOrder = new OrderModel(body);

      await newOrder.save();

      const cartItems = await CartModel.find({ userId: body.userId });
      // Use for..of to await properly
      for (const item of cartItems) {
        // Update the quantity of each book in the books collection
        await this.addBook(item, newOrder._id);
      }

      console.log(`OrderService.addOrder - success orderId=${newOrder._id} items=${cartItems.length}`);
      return newOrder;
    } catch (error) {
      console.error(`OrderService.addOrder - error userId=${body.userId}`, error);
      throw error;
    }
  }

  /**
   * Returns the count of orders of an user
   * @param {String} userId 
   * @returns {Integer} the count of orders placed by the user
   */
  static async ordersCount(userId){
    try {
      const count = await OrderModel.countDocuments({ userId });
      console.log(`OrderService.ordersCount - success userId=${userId} count=${count}`);
      return count;
    } catch (error) {
      console.error(`OrderService.ordersCount - error userId=${userId}`, error);
      throw error;
    }
  }

  // Count all the orders in the orders model
  static async countOrders(searchQuery) {
    try {
      let count;
      if (searchQuery == "") {
        count = await OrderModel.countDocuments();
      } else {
        count = await OrderModel.countDocuments({
          $or: [{ name: { $regex: searchQuery, $options: "i" } }],
        });
      }
      console.log(`OrderService.countOrders - success count=${count}`);
      return count;
    } catch (error) {
      console.error(`OrderService.countOrders - error`, error);
      throw error;
    }
  }

  static async getBooksInOrder(id) {
    try {
      const books = await PurchasedBooksModel.find({ orderId: id });
      console.log(`OrderService.getBooksInOrder - success orderId=${id} count=${books.length}`);
      return books;
    } catch (error) {
      console.error(`OrderService.getBooksInOrder - error orderId=${id}`, error);
      throw error;
    }
  }

}

module.exports = OrderService;
