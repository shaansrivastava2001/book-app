import axios from "axios";
import Cookies from "js-cookie";

const orderServiceUrl = `${process.env.REACT_APP_ORDER_MS_URL}/orders`;

/**
 * Utility class for handling book services
 */
class OrderService{

  /** Dashboard stats: { totalOrders } */
  async getStats() {
    return axios.get(`${orderServiceUrl}/stats`, { params: { token: Cookies.get('token') } });
  }

  /**
   * Razorpay test-mode payments
   * createPaymentOrder → returns { orderId, amount, currency, keyId } from the backend
   * verifyPayment      → backend verifies the HMAC signature returned by Razorpay
   */
  async createPaymentOrder(amount) {
    return axios.post(`${orderServiceUrl}/payment/createOrder`, { amount, token: Cookies.get('token') });
  }

  async verifyPayment({ orderId, paymentId, signature }) {
    return axios.post(`${orderServiceUrl}/payment/verify`, {
      orderId, paymentId, signature, token: Cookies.get('token'),
    });
  }

  /**
   * Fetch payment metadata (method, card last4, status, …) by payment id —
   * used on the FAILED path where there's no signature to verify but we
   * still want to record the attempt with the method the user tried.
   */
  async getPaymentDetails(paymentId) {
    return axios.post(`${orderServiceUrl}/payment/details`, {
      paymentId, token: Cookies.get('token'),
    });
  }

  /** Single order detail: { order, books }. Owner-or-admin gated. */
  async getOrderById(orderId) {
    return axios.get(`${orderServiceUrl}/byId/${orderId}`, {
      params: { token: Cookies.get('token') },
    });
  }

  /**
 * Get data of a book from backend
 * @param {ObjectId} id
 * @returns
 */
  async getBooksInOrder (id) {
    const url = `${orderServiceUrl}/getBooksInOrder/${id}`
    let response = await axios.get(url,{
      params: {
        token: Cookies.get('token')
      }
    });
    return response;
  }
}

export default new OrderService();
