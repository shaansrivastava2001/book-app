import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Header from '../../common/Header';
import Ordered_Book from './Ordered_Book';

import OrderService from '../../../services/order.service';
import UserService from '../../../services/user.service';

const PAID_STATUSES = new Set(['captured', 'paid', 'authorized', 'success']);

const formatPaymentMethod = (order) => {
  if (!order?.paymentMethod) return 'Payment';
  const m = order.paymentMethod;
  if (m === 'card') {
    const network = order.paymentCardNetwork ? order.paymentCardNetwork.toUpperCase() : 'Card';
    return order.paymentCardLast4 ? `${network} •••• ${order.paymentCardLast4}` : network;
  }
  if (m === 'upi') return order.paymentVpa ? `UPI · ${order.paymentVpa}` : 'UPI';
  if (m === 'netbanking') return order.paymentBank ? `Netbanking · ${order.paymentBank}` : 'Netbanking';
  if (m === 'wallet') return order.paymentBank ? `Wallet · ${order.paymentBank}` : 'Wallet';
  return m.charAt(0).toUpperCase() + m.slice(1);
};

const Order_Details = () => {

    const order = useLocation().state.order;

    // State variable for books in the order
    const [books, setBooks] = useState();

    // Address for shipping. Prefer the embedded snapshot on the order — that's
    // the source of truth at the time the order was placed. Fall back to the
    // user's current default address only for legacy orders that predate the
    // shippingAddress field.
    const [address, setAddress] = useState(order.shippingAddress);

    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const response = await OrderService.getBooksInOrder(order._id);
            setBooks(response.data.books);

            if (!order.shippingAddress && order.userId) {
              const result = await UserService.getAddress(order.userId);
              setAddress(result.data.address);
            }
        })();
    }, [order._id, order.shippingAddress, order.userId]);

    const paymentStatus = (order.paymentStatus || '').toLowerCase();
    const isPaid = PAID_STATUSES.has(paymentStatus);
    const isFailed = paymentStatus === 'failed' || paymentStatus === 'refunded';

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
          <div className="right-heading">
            <span className="cartTotal">Order total: Rs. {order.total_price}</span>
          </div>
        </div>

        {books && books.length > 0 ? (
          <div className="booksTable">
            <table>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Author</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Price</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <Ordered_Book book={book} key={book._id} />
                ))}
              </tbody>
            </table>
          </div>
        ) : books && books.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 16px' }}>
            <p className="empty-state__subtitle" style={{ margin: 0 }}>
              {isFailed
                ? "No items recorded — the payment failed before this order was finalized, so the cart was preserved for the customer to retry."
                : "No items found for this order."}
            </p>
          </div>
        ) : null}

          <div className="statsContainer orderActions">
            <div className="card">
              <div className="card-body">
                {isPaid ? (
                  <>
                    <p className="card-text">
                      Payment <span style={{ color: '#1f8a4c', fontWeight: 'bold' }}>received</span> via {formatPaymentMethod(order)}.
                    </p>
                    {order.paymentId && (
                      <p className="card-text" style={{ fontSize: 12, marginTop: 4 }}>
                        Ref: <code>{order.paymentId}</code>
                      </p>
                    )}
                  </>
                ) : isFailed ? (
                  <>
                    <p className="card-text">
                      Payment <span className='text-danger' style={{ fontWeight: 'bold' }}>{paymentStatus}</span>
                      {order.paymentFailureReason ? ` — ${order.paymentFailureReason}` : ''}
                    </p>
                    <button className="btn">Send Payment Link</button>
                  </>
                ) : (
                  <>
                    <p className="card-text">
                      Payment for this order is still <span className='text-danger' style={{ fontWeight: 'bold' }}>Pending</span>
                    </p>
                    <button className="btn">Send Payment Link</button>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                {address ? (
                  <>
                    <p className="card-text">
                      <span style={{ fontWeight: 'bold' }}>Shipping Address:</span> <br/>
                      {address.house}, {address.locality} <br/> {address.city}, {address.state} ({address.pin})
                    </p>
                    <button className="btn">Send Pickup Request</button>
                  </>
                ) : (
                  <>
                    <p className="card-text">
                      <span style={{ fontWeight: 'bold' }}>Shipping Address:</span> <br/>
                      Address not provided
                    </p>
                    <button className="btn">Send Address Request</button>
                  </>
                )}
              </div>
            </div>
        </div>

      </div>

    </>
  )
}

export default Order_Details;