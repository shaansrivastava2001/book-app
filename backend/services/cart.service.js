const CartModel = require("../database/schema/cart.schema");
const BookModel = require("../database/schema/book.schema");
const BookService = require("./book.service");
const EmailService = require("./email/email.service");
const EmailStyle = require("../styles/email.style");
const BooksModel = require("../database/schema/book.schema");

/**
 * Class for Cart Services
 */
class CartService {
  /**
   * Function to return a single item from cart of a particular user
   * @param {ObjectId} userId
   * @param {String} title
   * @returns {Object} the item from the cart collection
   */
  static async returnItem(userId, bookId) {
    try {
      const item = await CartModel.findOne({ userId: userId, bookId: bookId });
      console.log(`CartService.returnItem - success userId=${userId} bookId=${bookId} found=${!!item}`);
      return item;
    } catch (error) {
      console.error(`CartService.returnItem - error userId=${userId} bookId=${bookId}`, error);
      throw error;
    }
  }

  /**
   * Function to update the quantity of item in the cart of the user
   * @param {Object} item - Object with details of the item
   * @returns {Object} the updated item
   */
  static async updateItemQuantity(item) {
    try {
      await CartModel.updateOne(
        { bookId: item.bookId, userId: item.userId },
        {
          $set: {
            quantity: item.quantity + 1,
          },
        }
      );
      console.log(`CartService.updateItemQuantity - success userId=${item.userId} bookId=${item.bookId}`);
      return item;
    } catch (error) {
      console.error(`CartService.updateItemQuantity - error userId=${item.userId} bookId=${item.bookId}`, error);
      throw error;
    }
  }

  /**
   * Function to add new item to the cart
   * @param {Object} body
   */
  static async addToCart(body) {
    console.log(`CartService.addToCart - start userId=${body.userId} bookId=${body.bookId}`);
    try {
      body.quantity = 1;
      const book = await BookModel.findOne({ _id: body.bookId });
      if (book.quantity > 0) {
        body.status = "Available";
        const cartItem = new CartModel(body);
        await cartItem.save();
        console.log(`CartService.addToCart - success userId=${body.userId} bookId=${body.bookId}`);
        return cartItem;
      }
      console.log(`CartService.addToCart - book out of stock bookId=${body.bookId}`);
      return null;
    } catch (error) {
      console.error(`CartService.addToCart - error userId=${body.userId} bookId=${body.bookId}`, error);
      throw error;
    }
  }

  /**
   * Function to return cart items of a user
   * @param {ObjectId} id
   * @returns {Array} cart items of a user
   */
  static async getCartItems(id) {
    try {
      const items = await CartModel.find({ userId: id });
      console.log(`CartService.getCartItems - success userId=${id} count=${items.length}`);
      return items;
    } catch (error) {
      console.error(`CartService.getCartItems - error userId=${id}`, error);
      throw error;
    }
  }

  /**
   * Returns the total price in cart of the user
   * @param {String} id
   * @returns {Number} total price
   */
  static async returnTotalPrice(id) {
    try {
      const items = await CartModel.find({ userId: id });
      let totalPrice = 0;
      items.forEach((item) => {
        totalPrice = totalPrice + item.sale_price * item.quantity;
      });
      console.log(`CartService.returnTotalPrice - success userId=${id} total=${totalPrice}`);
      return totalPrice;
    } catch (error) {
      console.error(`CartService.returnTotalPrice - error userId=${id}`, error);
      throw error;
    }
  }

  /**
   * Function to clear cart of a particular user
   * @param {ObjectId} id
   */
  static async clearCart(id) {
    try {
      await CartModel.deleteMany({ userId: id });
      console.log(`CartService.clearCart - success userId=${id}`);
    } catch (error) {
      console.error(`CartService.clearCart - error userId=${id}`, error);
      throw error;
    }
  }

  /**
   * Function to delete an item from the cart of a user
   * @param {ObjectId} userId
   * @param {ObjectId} itemId
   */
  static async deleteItem(userId, itemId) {
    try {
      await CartModel.deleteOne({ userId: userId, _id: itemId });
      console.log(`CartService.deleteItem - success userId=${userId} itemId=${itemId}`);
    } catch (error) {
      console.error(`CartService.deleteItem - error userId=${userId} itemId=${itemId}`, error);
      throw error;
    }
  }

  /**
   * Function that checks if the book is left for a user to add in cart or not
   * @param {String} userId
   * @param {String} bookId
   * @returns {Boolean} whether book is left or not
   */
  static async compareQuantity(userId, bookId) {
    try {
      const book = await BookModel.findOne({ _id: bookId });
      const cartItem = await CartModel.findOne({ userId: userId, bookId: bookId });

      let res;
      if (cartItem != null) {
        res = cartItem.quantity < book.quantity;
      } else {
        res = true;
      }

      return res;
    } catch (error) {
      console.error(`CartService.compareQuantity - error userId=${userId} bookId=${bookId}`, error);
      throw error;
    }
  }

  /**
   * Returns the quantities of book in cart model and book in books model
   * @param {String} userId
   * @param {String} itemId
   * @param {String} bookId
   * @returns {Array} of quantities
   */
  static async getQuantities(userId, itemId, bookId) {
    try {
      const cartItem = await CartModel.findOne({ userId: userId, _id: itemId });
      const book = await BookModel.findOne({ _id: bookId });
      if (cartItem && book) {
        console.log(`CartService.getQuantities - success userId=${userId} itemId=${itemId} bookId=${bookId}`);
        return [cartItem.quantity, book.quantity];
      } else {
        console.log(`CartService.getQuantities - not found`);
        return [null, null];
      }
    } catch (error) {
      console.error(`CartService.getQuantities - error userId=${userId} itemId=${itemId} bookId=${bookId}`, error);
      throw error;
    }
  }

  /**
   * Update the cart and books collection after checkout
   * @param {String} userId
   */
  static async checkout(userId) {
    try {
      const cartItems = await CartModel.find({ userId: userId, status: "Available" });

      for (const item of cartItems) {

        // Find the book in the books collection
        const originalBook = await BookModel.findOne({ _id: item.bookId });

        // Take out its quantity
        const originalBookQuantity = originalBook.quantity;

        // Update the quantity of book in the books collection
        await BookService.updateQuantities(item.bookId, item.quantity);

        // Now update the quantities of the book in everyone's cart
        await this.updateQuantities(item, userId, originalBookQuantity);
      }
      console.log(`CartService.checkout - success userId=${userId} processed=${cartItems.length}`);
    } catch (error) {
      console.error(`CartService.checkout - error userId=${userId}`, error);
      throw error;
    }
  }

  /**
   * Updates the quantities of book in everyone's cart
   * @param {Object} item 
   * @param {String} userId 
   * @param {Number} originalBookQuantity 
   */
  static async updateQuantities(item,userId,originalBookQuantity){

    // All the books in cart with bookId as item.bookId
    const booksInCart = await CartModel.find( {bookId: item.bookId} );

    // Updating the quantities of books in cart
    try {
      for (const book of booksInCart) {
        let cartItem = await CartModel.findOne({ _id: book._id });
        if (cartItem.userId !== userId) {

          // If someone purchased more amount of books than the amount present in someone's cart 
          // Example: If someone purchased 10 books, and a guy has just 5 books in his cart 

          if (originalBookQuantity - item.quantity === 0) {
            cartItem.status = "Sold out";
          } else if (originalBookQuantity - item.quantity < cartItem.quantity) {
            cartItem.quantity = originalBookQuantity - item.quantity;
          }

          await cartItem.save();
        }
      }
      console.log(`CartService.updateQuantities - success bookId=${item.bookId}`);
    } catch (error) {
      console.error(`CartService.updateQuantities - error bookId=${item.bookId}`, error);
      throw error;
    }
  }

  /**
   * Increment the quantity of item in the cart
   * @param {String} userId
   * @param {String} itemId
   */
  static async incrementQuantity(userId, itemId) {
    try {
      let cartItem = await CartModel.findOne({ _id: itemId, userId: userId });
      cartItem.quantity += 1;
      await cartItem.save();

      console.log(`CartService.incrementQuantity - success userId=${userId} itemId=${itemId} quantity=${cartItem.quantity}`);
      return cartItem;
    } catch (error) {
      console.error(`CartService.incrementQuantity - error userId=${userId} itemId=${itemId}`, error);
      throw error;
    }
  }

  /**
   * Decrement the quantity of item in the cart
   * @param {String} userId
   * @param {String} itemId
   */
  static async decrementQuantity(userId, itemId) {
    try {
      let cartItem = await CartModel.findOne({ _id: itemId, userId: userId });
      cartItem.quantity -= 1;
      await cartItem.save();

      console.log(`CartService.decrementQuantity - success userId=${userId} itemId=${itemId} quantity=${cartItem.quantity}`);
      return cartItem;
    } catch (error) {
      console.error(`CartService.decrementQuantity - error userId=${userId} itemId=${itemId}`, error);
      throw error;
    }
  }

  /**
   * Returns count of cart items for an user
   * @param {String} userId 
   * @returns {Integer} count of cart items of an user
   */
  static async countCartItems(userId){
    try {
      const count = await CartModel.count({ userId: userId });
      console.log(`CartService.countCartItems - success userId=${userId} count=${count}`);
      return count;
    } catch (error) {
      console.error(`CartService.countCartItems - error userId=${userId}`, error);
      throw error;
    }
  }

  /**
   * Sends email to admin and user on checkout by email service
   * @param {Object} body 
   * @returns a status message for email
   */
  static async sendMails(body) {
    try {
      const userEmail = body.email;
      const name = body.name;

      // Find the cart items of the user
      const cartItems = await CartModel.find(
        { userId: body.userId },
        { _id: 0, title: 1, author: 1, quantity: 1, sale_price: 1, status: 1 }
      );

      let tableData = [];

      // Creates the data array of objects with cart items
      cartItems.forEach((item) => {
        const obj = {
          Title: item.title,
          Author: item.author,
          Quantity: item.quantity,
          Price: item.sale_price,
        };

        if (item.status == "Available") {
          tableData.push(obj);
        }
      });

      const userSubject = "Your Purchase on the Book App";
      const adminSubject = "Someone made a purchase";

      let result;

      // Css styling for the html templates
      const style = EmailStyle.returnStyle();

      // Table template for the html content
      const tableTemplate = `
        ${tableData
          .map(
            (item) => `
        <tr>
        <td>${item.Title}</td>
        <td>${item.Author}</td>
        <td>${item.Quantity}</td>
        <td>${item.Price}</td>
        </tr>
        `
          )
          .join("")}
    `;

      const userEmailTemplate = `
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"
      integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
      ${style}
    </head>

    <body>
      <h3 class="header">
          Book App
      </h3>
      <div class="container">
          <h3>
              Hi ${name},
          </h3>
          <p>
            Your Order Placed
          </p>
          <div>
              <span class="cartTotal">Purchase Amount: Rs. ${body.totalPrice}</span>
          </div>
          <table class="table-responsive">
            <thead>
            <tr>
            <th scope="col">Title</th>
            <th scope="col">Author</th>
            <th scope="col">Quantity</th>
            <th scope="col">Price</th>
            </tr>
            </thead>
            <tbody>
            ${tableTemplate}
            </tbody>
          </table>
          <p>Thank you for the purchase. You will receive a payment link shortly.</p>
          <p class="mb-0">Yours Truly,</p>
          <p>Book App</p>
      </div>
      <footer class="footer">
          <div class="container">
              <span class="text-muted">© 2023 Book App. All rights reserved.</span>
          </div>
      </footer>
    </body>`;

      const userEmailObj = {
        userEmail: userEmail,
        subject: userSubject,
        html: userEmailTemplate,
        name: "Book App",
      };

      result = await EmailService.sendEmail(userEmailObj);

      const adminEmailTemplate = `
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
      ${style}
    </head>

    <body>
        <h3 class="header">
            Book App
        </h3>
        <div class="container">
            <h3>
                Hi admin,
            </h3>
            <p>
                ${name} (${userEmail}) placed an order of Rs. ${body.totalPrice}
            </p>
            <div>
                <span class="cartTotal">Purchase Amount: Rs. ${body.totalPrice}</span>
            </div>
            <table class="table-responsive">
            <thead>
            <tr>
            <th scope="col">Title</th>
            <th scope="col">Author</th>
            <th scope="col">Quantity</th>
            <th scope="col">Price</th>
            </tr>
            </thead>
            <tbody>
                ${tableTemplate}
            </tbody>
            </table>
            <p>Purchase Successful</p>
            <p class="mb-0">Yours Truly,</p>
            <p>Book App</p>
        </div>
        <footer class="footer">
            <div class="container">
                <span class="text-muted">© 2023 Book App. All rights reserved.</span>
            </div>
        </footer>
    </body>`;

      const adminEmailObj = {
        userEmail: process.env.EMAIL,
        subject: adminSubject,
        html: adminEmailTemplate,
        name: "Admin",
      };

      result = await EmailService.sendEmail(adminEmailObj);
      console.log(`CartService.sendMails - success userId=${body.userId}`);
      return result;
    } catch (error) {
      console.error(`CartService.sendMails - error userId=${body.userId}`, error);
      throw error;
    }
  }
}

module.exports = CartService;
