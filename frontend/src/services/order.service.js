import axios from "axios";
import Cookies from "js-cookie";

const orderServiceUrl = `${process.env.REACT_APP_ORDER_MS_URL}/orders`;

/**
 * Utility class for handling book services
 */
class OrderService{

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
