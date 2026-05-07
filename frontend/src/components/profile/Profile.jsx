import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import "../../styles/style.scss";
import UserService from "../../services/user.service";
import Header from "../common/Header";

import Cookies from "js-cookie";

const pluralize = (n, singular, plural) => `${n ?? 0} ${(n === 1 ? singular : (plural || singular + "s"))}`;

const InfoRow = ({ label, value, action }) => (
  <div className="info-row">
    <span className="info-row__label">{label}</span>
    <span className="info-row__value">
      {value}
      {action}
    </span>
  </div>
);

const formatAddress = (a) => a
  ? `${a.house}, ${a.locality}, ${a.city}, ${a.state} (${a.pin})`
  : null;

const Profile = () => {
  const [user, setUser] = useState();
  const [donations, setDonations] = useState(0);
  const [orders, setOrders] = useState(0);
  const [addresses, setAddresses] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const id = location.state?.id;
  const me = JSON.parse(Cookies.get("userToken"));
  const isMe = me?._id === id;

  useEffect(() => {
    (async () => {
      const data = await UserService.getUserProfile(id);
      setUser(data.message);
      setDonations(data.donationsCount ?? 0);
      setOrders(data.ordersCount ?? 0);
      // Only the authenticated user can list their own addresses (the
      // endpoint is JWT-scoped). Skip for other users.
      if (isMe) {
        try {
          const res = await UserService.getAddresses();
          setAddresses(res.data.addresses || []);
        } catch (err) {
          console.warn("getAddresses failed", err);
        }
      }
    })();
  }, []);

  const addAddress = () => navigate(`/editAddress/${me._id}`);
  const goToDonations = () => navigate(`/users/donations/${user.username}`, { state: { userId: me._id } });
  const goToOrders = () => navigate(`/users/orders/${user.username}`, { state: { userId: me._id } });

  return (
    <>
      <Header />
      <div className="page-narrow profile-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="page-header__text">
            <h2 className="page-title">{isMe ? "Your profile" : `${user?.name || "User"}'s profile`}</h2>
            <p className="page-subtitle">Account details and activity.</p>
          </div>
        </div>

        <section className="form-card profile-card">
          <h3 className="section-title">Details</h3>
          <div className="profile-info">
            <InfoRow label="Name" value={user?.name || "—"} />
            <InfoRow label="Username" value={user?.username || "—"} />
            <InfoRow label="Email" value={user?.email || "—"} />
          </div>
        </section>

        {isMe && (
          <section className="form-card profile-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>Saved addresses</h3>
              <button type="button" className="btn-link" onClick={addAddress}>
                <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i> Add address
              </button>
            </div>
            {addresses.length === 0 ? (
              <p style={{ color: "#6b7384", fontSize: 14, margin: 0 }}>
                No addresses saved yet. Add one to speed up checkout.
              </p>
            ) : (
              <div className="profile-info">
                {addresses.map((a, i) => (
                  <InfoRow
                    key={a._id || i}
                    label={a.label || `Address ${i + 1}`}
                    value={<span>{formatAddress(a)}</span>}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <h3 className="section-title">Activity</h3>
        <div className="profile-stats">
          <article className="profile-stat">
            <div className="profile-stat__top">
              <span className="profile-stat__label">Donations</span>
              <span className="profile-stat__value">{pluralize(donations, "donation", "donations")}</span>
            </div>
            <p className="profile-stat__hint">
              {isMe
                ? "Your act of kindness and thoughtfulness is truly inspiring."
                : "Their contribution helps us expand the library."}
            </p>
            {isMe && donations > 0 && (
              <button type="button" className="btn-link profile-stat__action" onClick={goToDonations}>
                View donations <i className="fa-solid fa-arrow-right" style={{ fontSize: 11, marginLeft: 4 }}></i>
              </button>
            )}
          </article>

          <article className="profile-stat">
            <div className="profile-stat__top">
              <span className="profile-stat__label">Orders</span>
              <span className="profile-stat__value">{pluralize(orders, "order", "orders")}</span>
            </div>
            <p className="profile-stat__hint">
              {isMe
                ? "We're delighted you chose us to fulfill your needs."
                : "Books they've taken home from the library."}
            </p>
            {isMe && orders > 0 && (
              <button type="button" className="btn-link profile-stat__action" onClick={goToOrders}>
                View orders <i className="fa-solid fa-arrow-right" style={{ fontSize: 11, marginLeft: 4 }}></i>
              </button>
            )}
          </article>
        </div>
      </div>
    </>
  );
};

export default Profile;
