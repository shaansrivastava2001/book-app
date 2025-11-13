import { useEffect, useState, React, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../../styles/style.scss";

import CartService from "../../services/cart.service";

import Header from "../common/Header";
import CartItem from "./CartItem";

import Spinner from "react-bootstrap/Spinner";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

/**
 *
 * @returns {React.Component} Cart component
 */
const Cart = () => {
  // State variable for items in the cart of user
  const [items, setItems] = useState();

  // Total price of the cart
  const [totalPrice, setTotalPrice] = useState(0);

  // For loader after sending request for email
  const [loading, setLoading] = useState(false);

  // For confirmation box
  const [show, setShow] = useState(false);

  const childRef = useRef(null);
  
  const navigate = useNavigate();


  useEffect(() => {
    (async () => {
      const response = await CartService.getCartItems(url);
      setItems(response.data.items);
      setTotalPrice(response.data.totalPrice);
    })();
  }, []);


  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);


  const url = `${process.env.REACT_APP_CART_MS_URL}/cart/getCartItems`;

  // Calls the function in header component
  const handleCallChildFunction = () => {
    if (childRef.current) {
      childRef.current.changeCartCount();
    }
  };

  /**
   * Sending backend API request to clear the cart
   */
  const clearCart = () => {
    CartService.clearCart();
  };

  const checkout = async () => {
    setLoading(true);
    console.log(await CartService.checkout(totalPrice));
    setLoading(false);
    await CartService.addOrder(totalPrice);
    CartService.clearCart();
  };

  // Passed as a prop to update the total price
  const handleUpdateQuantity = (price) => {
    setTotalPrice(totalPrice + price);
  };

  return (
    <>
      <Header ref={childRef}></Header>
      <div className="container bookList">
        <div className="cart-heading mt-2">
          <div className="left-heading">
            <button className="back-btn" onClick={() => navigate(-1)}>
            <i class="fa-solid fa-arrow-left"></i>
            </button>
            <h3 className="my-3">Your Cart</h3>
          </div>
          <div className="right-heading" style={{ width: 600 }}>
            <span className="cartTotal">Cart total: Rs. {totalPrice}</span>
          </div>
        </div>
        {items?.length ? (
          <>
          {
            loading?
            null:
            <table>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Author</th>
                  <th scope="col">Price</th>
                  <th scope="col">Sale Price</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                    return (
                      <CartItem item={item} key={item.title} onUpdateQuantity={handleUpdateQuantity}
                        handleCallChildFunction = {handleCallChildFunction} />
                    );
                  })}
              </tbody>
          </table>
          }
            
            <div className="components cartBottom">
              {loading ? (
                <button className="btn btn-loader" disabled>
                  <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                  &nbsp;Placing order
                </button>
              ) : (
                <>
                  <button className="btn clearCart" onClick={clearCart}>
                    Clear Cart
                  </button>
                  <button className="checkout" onClick={handleShow}>
                    Proceed to checkout{" "}
                    <i className="fa-regular fa-credit-card"></i>
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <h4
              className="cartEmpty"
              style={{ marginLeft: "auto", textAlign: "center" }}
            >
              Your Books Cart is empty
            </h4>
            <h4
              className="cartEmpty py-3"
              style={{ marginLeft: "auto", textAlign: "center" }}
            >
              Continue shopping on the{" "}
              <Link to="/books" className="booksLink">
                Books Page
              </Link>
            </h4>
            <button className="btn addBooks" onClick={() => navigate("/books")}>
              Add books
            </button>
          </>
        )}
      </div>
      {loading ?  
      <Modal show={show} onHide={handleClose} className="checkoutConfirmBox">
      <Modal.Header closeButton className="closeButton">
        <Modal.Title>Hold on</Modal.Title>
      </Modal.Header>
      <Modal.Body>Placing you order</Modal.Body>
      <Modal.Footer className="modalFooter">
          <button className="btn btn-loader" disabled>
            <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
            &nbsp;Placing order
          </button>
      </Modal.Footer>
    </Modal>
      :
      <Modal show={show} onHide={handleClose} className="checkoutConfirmBox">
        <Modal.Header closeButton className="closeButton">
          <Modal.Title>Place Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>Confirm your order of <span>Rs. {totalPrice}</span></Modal.Body>
        <Modal.Footer className="modalFooter">
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={checkout} className="checkout">
            Checkout
          </Button>
        </Modal.Footer>
      </Modal>

      }
      
    </>
  );
};

export default Cart;
