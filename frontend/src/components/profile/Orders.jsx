import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";

import "../../styles/style.scss";
import UserService from "../../services/user.service";
import Header from "../common/Header";

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

// Render the payment method in a compact, recognizable form. For cards we
// show "VISA •••• 4242"-style to make the last 4 digits the focal point.
const PaymentCell = ({ order }) => {
  const method = order.paymentMethod;
  if (!method) return <span style={{ color: "#9aa2b1" }}>—</span>;

  if (method === "card") {
    const network = order.paymentCardNetwork ? order.paymentCardNetwork.toUpperCase() : null;
    const last4 = order.paymentCardLast4;
    if (network && last4) {
      return (
        <span>
          <strong>{network}</strong>
          <span style={{ color: "#6b7384", margin: "0 6px" }}>••••</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{last4}</span>
        </span>
      );
    }
    if (network) return <span><strong>{network}</strong> <span style={{ color: "#6b7384" }}>card</span></span>;
    if (last4) return <span>Card <span style={{ color: "#6b7384" }}>••••</span> <span style={{ fontVariantNumeric: "tabular-nums" }}>{last4}</span></span>;
    return <span>Card</span>;
  }
  if (method === "upi")        return <span>UPI{order.paymentVpa ? ` · ${order.paymentVpa}` : ""}</span>;
  if (method === "netbanking") return <span>Netbanking{order.paymentBank ? ` · ${order.paymentBank}` : ""}</span>;
  if (method === "wallet")     return <span>Wallet{order.paymentBank ? ` · ${order.paymentBank}` : ""}</span>;
  return <span>{method.charAt(0).toUpperCase() + method.slice(1)}</span>;
};

const StatusBadge = ({ status }) => {
  const v = (status || "").toLowerCase();
  const cls = v === "failed" || v === "refunded" ? "statusSold" : "statusAvailable";
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
  return <span className={cls}>{label}</span>;
};

const Orders = () => {
  const [orders, setOrders] = useState();
  const navigate = useNavigate();
  const location = useLocation();

  const me = Cookies.get("userToken") ? JSON.parse(Cookies.get("userToken")) : null;
  const targetUserId = location.state?.userId || me?._id;
  const isMine = !location.state?.userId || location.state.userId === me?._id;

  useEffect(() => {
    if (!targetUserId) return;
    (async () => {
      try {
        const response = await UserService.fetchOrders(targetUserId);
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error(err);
        setOrders([]);
      }
    })();
  }, [targetUserId]);

  const isLoading = orders === undefined;

  return (
    <>
      <Header />
      <div className="container bookList">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="page-header__text">
            <h2 className="page-title">{isMine ? "Order history" : "Orders"}</h2>
            <p className="page-subtitle">
              {isMine
                ? "Every order you've placed, with payment method and status."
                : "Orders placed by this user."}
            </p>
          </div>
        </div>

        <div className="booksTable">
          <table>
            <thead>
              <tr>
                <th scope="col">Order date</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Payment</th>
                <th scope="col">Paid at</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center" style={{ padding: 32, color: "#6b7384" }}>Loading orders…</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center" style={{ padding: "48px 16px" }}>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: "#20242f" }}>
                      {isMine ? "You haven't placed any orders yet" : "No orders yet"}
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7384" }}>
                      {isMine
                        ? "Books you check out will show up here with payment info."
                        : "Their orders will appear here once placed."}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} onClick={() => navigate(`/order/${o._id}`)} style={{ cursor: "pointer" }}>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td>{o.quantity ?? "—"}</td>
                    <td>Rs. {o.total_price}</td>
                    <td><PaymentCell order={o} /></td>
                    <td>{formatDateTime(o.paidAt)}</td>
                    <td><StatusBadge status={o.paymentStatus || o.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Orders;
