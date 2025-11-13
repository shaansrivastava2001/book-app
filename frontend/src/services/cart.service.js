import axios from "axios";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const cartServiceUrl = `${process.env.REACT_APP_CART_MS_URL}/cart`;
const userServiceUrl = `${process.env.REACT_APP_USER_MS_URL}/users`;
const bookServiceUrl = `${process.env.REACT_APP_BOOK_MS_URL}/books`;

/**
 * Utility class for handling Cart Services
 */
class CartService{
/**
 * Function to show notification in case of adding an item to cart
 */
  showToast() {
    toast.success("Added to cart");
  };

/**
 * Function to show error notification in case of failure in addition to cart
 */
  showerrorToast() {
    toast.warning("Failed to add to cart");
  };

/**
 * Get cart items of an user
 * @param {String} url 
 * @returns response from backend
 */
  async getCartItems (url){
    const response = await axios
      .post(url, {
        id: JSON.parse(Cookies.get('userToken'))._id,
        token: Cookies.get('token')
      });

      return response;
  }

/**
 * 
 * @returns {Number} count of cart items for an user
 */
  async getCartCount (){
    const response = await axios.post(`${cartServiceUrl}/getCartCount`,{
      userId: JSON.parse(Cookies.get('userToken'))._id,
      token: Cookies.get('token')
    });
    return response.data.cartCount;
  }

/**
 * Post book details to cart collection
 * @param {Object} book
 */
  async addToCart (book)  {
    const res = await axios
      .post(`${cartServiceUrl}/addToCart`, {
        title: book.title,
        price: book.price,
        author: book.author,
        bookId: book._id,
        sale_price: book.sale_price,
        userId: JSON.parse(Cookies.get('userToken'))._id,
        userEmail: JSON.parse(Cookies.get('userToken')).email,
        token: Cookies.get('token')
      });

      if(res){
        this.showToast();
      } else {
        this.showerrorToast();
      };
  };

/**
 * Deletes an item from the list of books
 * @param {ObjectId} id
 */
  async deleteBook (id)  {
    await axios.delete(`${bookServiceUrl}/deleteBook/${id}`, {
      data: {
        token: Cookies.get('token')
      }
    });
    window.location.reload();
  };

/**
 * Clear cart API called at backend
 */
  async clearCart () {
    axios.post(`${cartServiceUrl}/clearCart`, {
      userId: JSON.parse(Cookies.get('userToken'))._id,
      userEmail: JSON.parse(Cookies.get('userToken')).email,
      token: Cookies.get('token')
    });
    window.location.reload();
  };

/**
 * Removes a single item from cart
 * @param {ObjectId} itemId
 * @param {ObjectId} userId
 */
  async removeItem (itemId, userId) {
    axios.delete(`${cartServiceUrl}/deleteItem/${itemId}/${userId}`,{
      data: {
        token: Cookies.get('token')
      }
    });
    window.location.reload();
  };

/**
 * Service for checking out
 * @returns result after the checkout
 */
  async checkout (totalPrice) {
    try {
      let user = JSON.parse(Cookies.get('userToken'));
      await axios.post(`${cartServiceUrl}/sendEmail`, {
        email: user.email,
        userId: user._id,
        totalPrice: totalPrice,
        name: user.name,
        token: Cookies.get('token')
      });
      let qtyResult;
      qtyResult = await axios.post(
        `${cartServiceUrl}/checkout`,
        {
          userId: user._id,
          token: Cookies.get('token')
        }
      );

      return qtyResult;
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Updating the quantities of the items in everyone's cart
   * @returns Result after updating the quantities in the cart
   */
  async updateQuantitiesInCart () {
    try {
      let userId = JSON.parse(Cookies.get('userToken'))._id;
      let result = await axios.post(
        `${cartServiceUrl}/updateQuantitiesInCart/${userId}`,
        { token: Cookies.get('token') }
      );
      return result;
    } catch (error) {
      console.log(error);
    }
  }

/**
 * Increments the quantity at the backend
 * @param {String} itemId
 */
  async increment (itemId)  {
    try {
      let userId = JSON.parse(Cookies.get('userToken'))._id;
      let result = await axios.put(
        `${cartServiceUrl}/updateQuantity/${userId}/${itemId}`,
        { action: "increment", token: Cookies.get('token') }
      );
      return result;
    } catch (error) {
      console.log(error);
    }
  };

/**
 * Increments the quantity at the backend
 * @param {String} itemId
 */
  async decrement (itemId) {
    try {
      let userId = JSON.parse(Cookies.get('userToken'))._id;
      let result = await axios.put(
        `${cartServiceUrl}/updateQuantity/${userId}/${itemId}`,
        { action: "decrement", token: Cookies.get('token') }
      );
      return result;
    } catch (error) {
      console.log(error);
    }
  };

/**
 * Get the quantities of book in cart and books model from backend
 * @param {String} itemId
 * @param {String} bookId
 */
  async getQuantities (itemId, bookId) {
    try {
      let result;
      result = await axios.get(
        `${cartServiceUrl}/getQuantities/${
          JSON.parse(Cookies.get('userToken'))._id
        }/${itemId}/${bookId}`, {
          params: {
            token: Cookies.get('token')
          }
        });
      return result;
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Adds order to the backend database
   * @param {Integer} total_price 
   */
  async addOrder (total_price) {
    const res = await axios
      .post(`${userServiceUrl}/orders/addOrder`, {
        name: JSON.parse(Cookies.get('userToken')).name,
        userId: JSON.parse(Cookies.get('userToken'))._id,
        email: JSON.parse(Cookies.get('userToken')).email,
        total_price: total_price,
        token: Cookies.get('token')
      })

      if(res){
        console.log("Order added to backend");
      } else {
        console.log("Order adding failed");
      }
  }

};

export default new CartService();
