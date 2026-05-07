const OrderService = require("../services/order.service");
const CartService = require("../services/cart.service");

/**
 * Controller class for Orders related operations.
 */
class OrderController {
  /**
   * Retrieves the list of orders from the database.
   * @param {Object} req
   * @param {Object} res
   * @returns {Response} status code with a message if orders list is found or not
   * */

  static async getUserOrders (req,res){
    try {
        const orders = await OrderService.getUserOrders(req.params.id);
        if (!orders) {
          return res.status(401).json({ message: "No orders found" });
        } else {
          return res.status(200).json({ orders: orders });
        }
      } catch (error) {
        console.log(error);
        return res.status(401).json({error: error})
      }
  }

 /**
   * Retrieves the list of orders from the database.
   * @param {Object} req
   * @param {Object} res
   * @returns {Response} status code with a message if orders list is found or not
   * */

 static async getOrders (req,res){
    const page = Number(req.query.page) || 1;

    // Number fo documents per page
    const limit = Number(req.query.limit) || 5;

    // Formula for pagination, skip is the number of documents to skip from the collection
    const skip = (page - 1) * limit;

    try {
      const orders = await OrderService.getOrders(skip,limit,req.query.searchQuery);
      const ordersCount = await OrderService.countOrders(req.query.searchQuery);
      if (!orders) {
        return res.status(401).json({ message: "No orders found" });
      } else {
        return res.status(200).json({ orders: orders, ordersCount: ordersCount });
      }
    } catch (error) {
      console.log(error);
      return res.status(401).json({error: error})
    }
}

  /**
   * Adds an order to the order collection
   * @param {Object} req 
   * @param {Response} res 
   * @returns {Object} an object of the new order
   */
  static async addOrder (req,res){
    try{
      const quantity = await CartService.countCartItems(req.body.userId);
      req.body.quantity = quantity;
      // The Order schema now supports payment metadata (paymentId, paymentMethod,
      // paymentCardLast4, paymentStatus, paidAt, …); whatever the frontend passes
      // through after verifyPayment lands here and gets saved on the order doc.
      const newOrder = await OrderService.addOrder(req.body);
      return res.status(201).json({ newOrder });
    }
    catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Not able to add order" });
    }
  }

  /**
   * Returns the count of orders by user
   * @param {Object} req 
   * @param {Object} res 
   * @returns {Integer} the count of orders by the user
   */
  static async ordersCount (req,res){
    try {
      let ordersCount = await OrderService.ordersCount(req.body.userId);
      return res.status(201).json({ ordersCount });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Not able to find count of orders" });
    }
  }

  /**
   * Get books that were ordered at a time
   * @param {Object} req 
   * @param {Object} res 
   * @returns {Array} list of books
   */
  static async getBooksInOrder(req,res) {
    try {
      let books = await OrderService.getBooksInOrder(req.params.id);
      return res.status(201).json({ books });
    } catch (error) {
      console.log(error);
      return res.status(500).json({message: "Not able to find books in the order"});
    }
  }

  /**
   * GET /orders/byId/:id — single order detail (owner or admin only).
   */
  static async getOrderById(req, res) {
    try {
      const result = await OrderService.getOrderById(req.params.id);
      if (!result) return res.status(404).json({ message: "Order not found" });

      const { order, books } = result;
      const callerId = req.user?._id?.toString();
      const ownerId = order.userId?.toString();
      const isAdmin = ["Admin", "Super Admin"].includes(req.user?.role);
      if (!isAdmin && callerId !== ownerId) {
        return res.status(403).json({ message: "Not your order" });
      }

      return res.status(200).json({ order, books });
    } catch (error) {
      console.error("getOrderById - error", error);
      return res.status(500).json({ message: "Failed to load order" });
    }
  }

  /**
   * Dashboard stats for orders.
   */
  static async getStats(_req, res) {
    try {
      const stats = await OrderService.getStats();
      return res.status(200).json(stats);
    } catch (error) {
      console.error("getStats - error", error);
      return res.status(500).json({ message: "Failed to load stats" });
    }
  }
};

module.exports = OrderController;
