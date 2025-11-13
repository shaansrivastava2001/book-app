import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Header from '../../common/Header';
import Ordered_Book from './Ordered_Book';

import OrderService from '../../../services/order.service';
import UserService from '../../../services/user.service';

const Order_Details = () => {

    // State variable for books in the order
    const [books, setBooks] = useState();

    // State variable for the address of the user
    const [address, setAddress] = useState();
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        (async ()=>{
            const response = await getOrders();
            setBooks(response.data.books);

            const result = await UserService.getAddress(userId);
            setAddress(result.data.address);
          })();
          
    }, []);

    // Id of the user who placed order
    const userId = location.state.order.userId;

    // Get books in the order
    const getOrders = async () => {
        const orders = await OrderService.getBooksInOrder(location.state.order._id);
        return orders;
    };
    
  
    return (
    <>
    <Header></Header>
      <div className="container bookList orderedBooksList">
        
        <div className="cart-heading mt-2">
          <div className="left-heading">
            <button className="back-btn" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h3 className="my-3">Books ordered</h3>
          </div>
          <div className="right-heading" style={{ width: 600 }}>
            <span className="cartTotal">Order total: Rs. {location.state.total_price}</span>
          </div>
        </div>

        <div className="booksTable">
          <table>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Author</th>
                <th scope="col">Price</th>
                <th scope="col">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {
                books?.map((book)=>{
                  return(
                    <Ordered_Book book={book} key={book._id} />
                  )
                }) 
              }
            </tbody>
          </table>
          </div>

          <div className="row mt-4 statsContainer orderActions">
            <div className="col-sm-6">
              <div className="card">
                <div className="card-body">
                    <p className="card-text">
                      Payment for this order is still <span className='text-danger' style={{fontWeight: "bold"}}>Pending</span>
                    </p>
                    <button className="btn">
                      Send Payment Link
                    </button>
                </div>
              </div>
            </div>
            <div className="col-sm-6"  >
              <div className="card">
                <div className="card-body">
                  {
                      (address===undefined)?
                      <>
                        <p className="card-text">
                        <span style={{fontWeight:"bold"}}>Shipping Address:</span> <br/>
                            Address not provided
                        </p>
                        <button className="btn">
                          Send Address Request
                        </button>
                      </>
                      
                      : 

                      <>
                      <p className="card-text">
                        <span style={{fontWeight:"bold"}}>Shipping Address:</span> <br/>
                          {address?.house}, {address?.locality} <br/> {address?.city}, {address?.state} ({address?.pin})
                        </p>
                        <button className="btn">
                          Send Pickup Request
                        </button>
                      </>
                  }
                </div>
              </div>
            </div>
        </div>

      </div>

    </>
  )
}

export default Order_Details;