import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/style.scss";
import BookService from "../../services/book.service";
import CartService from "../../services/cart.service";
import UserService from "../../services/user.service";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Cookies from 'js-cookie';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';


const Book = (props) => {

  // State variable for setting cart button disable and enable
  const [disabled, setDisabled] = useState(false);

  // User details
  const [user, setUser] = useState("");

  const [show, setShow] = useState(false);

  
  // Check if item can be added to cart or not when the component loads
  useEffect(() => {
    compareBook();
    (async ()=>{
      const response = await UserService.getUser(props.book.donatedById);
      setUser(response.data.message);
    })();
  },[disabled]);
  
  const navigate = useNavigate();
  
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  /**
   * Tooltip for add to cart button
   * @param {Object} props
   * @returns jsx element for the tooltip of cart button
   */
  const cartTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      Add to Cart
    </Tooltip>
  );

  /**
   * Tooltip for edit book button
   * @param {Object} props
   * @returns jsx element for the tooltip of edit button
   */
  const editTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      Edit Book
    </Tooltip>
  );

  /**
   * Tooltip for delete book button
   * @param {Object} props
   * @returns jsx element for the tooltip of delete button
   */
  const deleteTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      Delete Book
    </Tooltip>
  );

  /**
   * Tooltip for donated by table cell
   * @param {Object} props
   * @returns jsx element for the tooltip of user
   */
  const userTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {user.email}
    </Tooltip>
  );

  /**
   * Tooltip for quantity of book
   * @param {Object} props
   * @returns jsx element for the tooltip of quantity
   */
  const quantityTooltip = (p) => (
    <Tooltip id="button-tooltip" {...p}>
      In stock: {props.book.quantity}
    </Tooltip>
  );

  /**
   * Function to navigate to a route which shows a form for edit book
   * @param {Object} book
   */
  const editBook = (book) => {
    navigate(`/books/${book._id}`, {
      state: {
        name: book.title,
        author: book.author,
        description: book.description,
        price: book.price,
        quantity: book.quantity,
        sale_price: book.sale_price,
      },
    });
  };

  /**
   * Function to navigate to a route which shows details of user with given ID
   * @param {Object} user
   */
  const userDetails = (id) => {
    const username = user.username;
    navigate(`/profile/${username}`,{
      state: {id}
    });
  };

  /**
   * Function to navigate to a route which shows details of book with given ID
   * @param {Object} book
   */
  const getDetails = (book) => {
    navigate(`/book/${book.title}`,{
      state: {
        bookId: book._id
      }
    });
  };

  /**
   * Function that makes API call to add an item to cart
   * @param {Object} book
   */
  const addToCart = async (book) => {
    await CartService.addToCart(book);
    if (compareBook()) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
    
    props.handleCallChildFunction();
  };

  /**
   * Function for deleting a book
   */
  const deleteBook = () => {
    CartService.deleteBook(props.book._id);
  };

  /**
   * Check if item can be added to cart
   * @returns {Boolean} whether book quantity is greater than the book in cart
   */
  const compareBook = async () => {
    const result = await BookService.compareBook(
      JSON.parse(Cookies.get('userToken'))._id,
      props.book._id
    );


    // If quantity has not reached the maximum limit
    if(props.book.quantity <= 0){
      setDisabled(true);
    } 
    
    // If the quantity has reached maximum limit
    else {
      // If book is donated by current logged in user then disable the button
      if(props.book.donatedById == JSON.parse(Cookies.get('userToken'))._id){
        setDisabled(true);
      } else {
        if(result){
          setDisabled(false);
        } else {
          setDisabled(true);
        }
      }
    }

    return result;
  };

  return (
    <>
      <tr>
        <td onClick={() => {getDetails(props.book)}}>
          {props.book.title}
        </td>
        <td onClick={() => {getDetails(props.book)}}>
          {props.book.author}
        </td>
        <td onClick={() => {getDetails(props.book)}}>
          Rs. {props.book.price}
        </td>
        <td onClick={() => {getDetails(props.book)}}>
          Rs. {props.book.sale_price}
        </td>
        <td onClick={() => {userDetails(user._id)}}>
          <OverlayTrigger
            placement="top"
            delay={{ show: 150, hide: 10 }}
            overlay={userTooltip}
          >
            <div className="bookDonor">{user?.name}</div>
          </OverlayTrigger>
        </td>
        <td onClick={() => {getDetails(props.book)}}>
          <OverlayTrigger
            placement="left"
            delay={{ show: 150, hide: 10 }}
            overlay={quantityTooltip}
          >
            {props.book.quantity > 0 ? (
              <span className="statusAvailable">Available</span>
            ) : (
              <span className="statusSold">Sold</span>
            )}
          </OverlayTrigger>
        </td>

        {JSON.parse(Cookies.get('userToken')).role === "Admin" ? (
          <td>
            <OverlayTrigger
              placement="left"
              delay={{ show: 150, hide: 10 }}
              overlay={deleteTooltip}
            >
              <button
                className="btn btnAction mx-2"
                id={props.book._id}
                onClick={handleShow}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="left"
              delay={{ show: 150, hide: 10 }}
              overlay={editTooltip}
            >
              <button
                className="btn btnAction mx-2"
                onClick={() => {
                  editBook(props.book);
                }}
              >
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="left"
              delay={{ show: 150, hide: 10 }}
              overlay={cartTooltip}
            >
              <button
                className="btn btnAction mx-2"
                onClick={() => {
                  addToCart(props.book);
                }}
                disabled={disabled}
              >
                <i className="fa-solid fa-cart-shopping"></i>
              </button>
            </OverlayTrigger>
          </td>
        ) : (
          <td>
            <OverlayTrigger
              placement="left"
              delay={{ show: 150, hide: 10 }}
              overlay={cartTooltip}
            >
              <button
                className="btn btnAction mx-2"
                onClick={() => {
                  addToCart(props.book);
                }}
                disabled={disabled}
              >
                <i className="fa-solid fa-cart-shopping"></i>
              </button>
            </OverlayTrigger>
          </td>
        )}
      </tr>
    <Modal show={show} onHide={handleClose} className="checkoutConfirmBox">
        <Modal.Header closeButton className="closeButton">
          <Modal.Title>Delete Book</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this book?</Modal.Body>
        <Modal.Footer className="modalFooter">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteBook} className="delete">
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer autoClose="500" />
    </>
  );
};

export default Book;
