import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import "../../styles/style.scss";
import Header from "../common/Header";
import OrderService from "../../services/order.service";

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await OrderService.getOrderById(id);
        setOrder(res.data.order);
      } catch (err) {
        console.warn("getOrderById failed", err);
      }
    })();
  }, [id]);

  return (
    <>
      <Header />
      <div className="page-narrow" style={{ textAlign: "center" }}>
        <div className="empty-state" style={{ paddingTop: 56 }}>
          <div
            className="empty-state__icon"
            style={{ background: "rgba(47, 168, 106, 0.12)", color: "#2fa86a", width: 72, height: 72, fontSize: 28 }}
          >
            <i className="fa-solid fa-check"></i>
          </div>
          <h2 className="empty-state__title" style={{ fontSize: 22 }}>Order placed!</h2>
          <p className="empty-state__subtitle">
            Thanks — your order has been confirmed and will be delivered shortly.
            We've sent a receipt to your email.
          </p>

          {order && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                background: "#f8f9fc",
                border: "1px solid #dfe3eb",
                borderRadius: 8,
                fontSize: 13,
                color: "#4d5566",
                textAlign: "left",
                width: "100%",
                maxWidth: 360,
              }}
            >
              <div><strong>Order ID:</strong> {order._id}</div>
              <div><strong>Total:</strong> Rs. {order.total_price}</div>
              {order.paymentStatus && <div><strong>Status:</strong> {order.paymentStatus}</div>}
            </div>
          )}

          <div className="empty-state__actions" style={{ marginTop: 20 }}>
            {id && (
              <Link to={`/order/${id}`}>
                <button className="btn-primary">View order</button>
              </Link>
            )}
            <Link to="/books" style={{ marginLeft: 8 }}>
              <button className="btn-link">Continue shopping</button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;
