import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../../styles/style.scss";
import Header from "../common/Header";
import OrderService from "../../services/order.service";

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

const formatAddress = (a) =>
  a ? `${a.house}, ${a.locality}, ${a.city}, ${a.state} (${a.pin})` : "—";

const PaymentLine = ({ order }) => {
  if (!order?.paymentMethod) return <span>—</span>;

  if (order.paymentMethod === "card") {
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

  if (order.paymentMethod === "upi") {
    return <span>UPI{order.paymentVpa ? ` · ${order.paymentVpa}` : ""}</span>;
  }
  if (order.paymentMethod === "netbanking") {
    return <span>Netbanking{order.paymentBank ? ` · ${order.paymentBank}` : ""}</span>;
  }
  if (order.paymentMethod === "wallet") {
    return <span>Wallet{order.paymentBank ? ` · ${order.paymentBank}` : ""}</span>;
  }

  return <span>{order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}</span>;
};

const StatusBadge = ({ status }) => {
  const v = (status || "").toLowerCase();
  const cls = v === "failed" || v === "refunded" ? "statusSold" : "statusAvailable";
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
  return <span className={cls}>{label}</span>;
};

const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-row__label">{label}</span>
    <span className="info-row__value">{value ?? "—"}</span>
  </div>
);

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState();
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await OrderService.getOrderById(id);
        setOrder(res.data.order);
        setBooks(res.data.books || []);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Could not load order.");
        setOrder(null);
      }
    })();
  }, [id]);

  if (error) {
    return (
      <>
        <Header />
        <div className="page-narrow">
          <div className="empty-state">
            <div className="empty-state__icon"><i className="fa-solid fa-circle-exclamation"></i></div>
            <h3 className="empty-state__title">Couldn't load order</h3>
            <p className="empty-state__subtitle">{error}</p>
            <div className="empty-state__actions">
              <button className="btn-primary" onClick={() => navigate(-1)}>Go back</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="page-narrow">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="page-header__text">
            <h2 className="page-title">Order details</h2>
            <p className="page-subtitle">{order?._id ? `#${order._id}` : "Loading…"}</p>
          </div>
        </div>

        <section className="form-card profile-card">
          <h3 className="section-title">Summary</h3>
          <div className="profile-info">
            <InfoRow label="Order placed" value={formatDateTime(order?.createdAt)} />
            <InfoRow label="Items" value={order?.quantity ?? "—"} />
            <InfoRow label="Total" value={order ? `Rs. ${order.total_price}` : "—"} />
            <InfoRow label="Order status" value={<StatusBadge status={order?.status} />} />
          </div>
        </section>

        <section className="form-card profile-card">
          <h3 className="section-title">Payment</h3>
          <div className="profile-info">
            <InfoRow label="Method" value={<PaymentLine order={order || {}} />} />
            <InfoRow label="Status" value={<StatusBadge status={order?.paymentStatus} />} />
            <InfoRow label="Paid at" value={formatDateTime(order?.paidAt)} />
            {order?.paymentId && <InfoRow label="Payment ID" value={<code style={{ fontSize: 12 }}>{order.paymentId}</code>} />}
            {order?.paymentFailureReason && (
              <InfoRow
                label="Failure reason"
                value={
                  <span style={{ color: "#b54848" }}>
                    {order.paymentFailureReason}
                    {order.paymentFailureCode && (
                      <span style={{ color: "#9aa2b1", marginLeft: 6, fontSize: 12 }}>
                        ({order.paymentFailureCode})
                      </span>
                    )}
                  </span>
                }
              />
            )}
          </div>
        </section>

        <section className="form-card profile-card">
          <h3 className="section-title">Shipping</h3>
          <div className="profile-info">
            <InfoRow label="Address" value={formatAddress(order?.shippingAddress)} />
          </div>
        </section>

        {books.length > 0 && (
          <section className="form-card profile-card">
            <h3 className="section-title">Books in this order</h3>
            <div className="booksTable">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b._id}>
                      <td>{b.title || "—"}</td>
                      <td>{b.quantity ?? 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default OrderDetail;
