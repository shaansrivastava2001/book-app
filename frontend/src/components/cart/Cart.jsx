import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../../styles/style.scss";

import CartService from "../../services/cart.service";
import OrderService from "../../services/order.service";
import UserService from "../../services/user.service";
import { getUser } from "../../utils/auth";
import { INDIAN_STATES, lookupPincode } from "../../utils/india";

import Header from "../common/Header";
import CartItem from "./CartItem";

import Spinner from "react-bootstrap/Spinner";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

const EMPTY_ADDR = { house: "", locality: "", city: "", state: "", pin: "" };

const formatAddress = (a) =>
  a ? `${a.house}, ${a.locality}, ${a.city}, ${a.state} (${a.pin})` : "";

const Cart = () => {
  const [items, setItems] = useState();
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  // Address-step state for the checkout modal
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newAddr, setNewAddr] = useState(EMPTY_ADDR);
  const [savingAddr, setSavingAddr] = useState(false);
  const [pinPostOffices, setPinPostOffices] = useState([]);
  const [pinLookupLoading, setPinLookupLoading] = useState(false);

  // When the user types a 6-digit PIN in the inline new-address form, hit
  // postalpincode.in to auto-fill city + state and populate locality
  // suggestions from the local post offices.
  const onNewAddrPinChange = async (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
    setNewAddr((a) => ({ ...a, pin: raw }));
    if (raw.length !== 6) {
      setPinPostOffices([]);
      return;
    }
    setPinLookupLoading(true);
    try {
      const result = await lookupPincode(raw);
      if (result) {
        setNewAddr((a) => ({
          ...a,
          city: result.city || a.city,
          state: result.state || a.state,
        }));
        setPinPostOffices(result.postOffices || []);
      } else {
        setPinPostOffices([]);
      }
    } finally {
      setPinLookupLoading(false);
    }
  };

  const childRef = useRef(null);
  const navigate = useNavigate();

  const url = `${process.env.REACT_APP_CART_MS_URL}/cart/getCartItems`;

  useEffect(() => {
    (async () => {
      const response = await CartService.getCartItems(url);
      setItems(response.data.items);
      setTotalPrice(response.data.totalPrice);
    })();
  }, []);

  const handleClose = () => setShow(false);

  // When the modal opens, lazily load the user's saved addresses so they can
  // pick one. If none exist, default to "Add new" so the form is shown upfront.
  const handleShow = async () => {
    setShow(true);
    setNewAddr(EMPTY_ADDR);
    setAddingNew(false);
    try {
      const res = await UserService.getAddresses();
      const list = res.data.addresses || [];
      setAddresses(list);
      if (list.length > 0) {
        setSelectedAddressId(String(list[0]._id || 0));
        setAddingNew(false);
      } else {
        setSelectedAddressId(null);
        setAddingNew(true);
      }
    } catch (err) {
      console.warn("getAddresses failed", err);
      setAddresses([]);
      setAddingNew(true);
    }
  };

  const handleCallChildFunction = () => {
    if (childRef.current) childRef.current.changeCartCount();
  };

  // Resolve the address the user chose at checkout — either a saved entry or
  // the inline "new address" form values.
  const resolveShippingAddress = () => {
    if (addingNew) {
      const a = newAddr;
      const filled = a.house.trim() && a.locality.trim() && a.city.trim() && a.state.trim() && a.pin.toString().trim();
      return filled ? { ...a } : null;
    }
    return addresses.find((a) => String(a._id) === String(selectedAddressId)) || null;
  };

  const canPay = !loading && Boolean(resolveShippingAddress());

  // Save a new address before checkout so it's persisted to the user's
  // addresses array (and shows up next time).
  const saveNewAddressIfNeeded = async () => {
    if (!addingNew) return null;
    const addr = resolveShippingAddress();
    if (!addr) return null;
    setSavingAddr(true);
    try {
      const res = await UserService.addAddress(addr);
      return res?.data?.address || addr;
    } catch (err) {
      console.warn("addAddress failed", err);
      return addr;
    } finally {
      setSavingAddr(false);
    }
  };

  // Finalize: stock email, app-level order record (with payment metadata
  // and shipping address), clear cart, then HARD-REDIRECT to the success page.
  // Using window.location.assign instead of react-router navigate sidesteps a
  // race where post-navigate setState calls on the about-to-unmount Cart can
  // confuse the router and bounce the user back to /books/cart.
  const finalizeOrder = async (paymentMetadata, shippingAddress) => {
    try { await CartService.checkout(totalPrice); } catch (e) { console.warn("checkout (email/stock) failed", e); }

    const orderRes = await CartService.addOrder(totalPrice, paymentMetadata, shippingAddress);
    const placedOrderId = orderRes?.data?.newOrder?._id;
    console.log("addOrder response:", orderRes?.data, "placedOrderId:", placedOrderId);

    try { await CartService.clearCart(); } catch (e) { console.warn("clearCart failed", e); }

    const target = placedOrderId
      ? `/order/success/${placedOrderId}`
      : (() => {
          const me = getUser();
          return me?.username ? `/users/orders/${me.username}` : "/home";
        })();

    // Full-page navigation. Component unmounts cleanly; no post-navigate
    // state updates happen on this Cart instance.
    window.location.assign(target);
  };

  const checkout = async () => {
    if (!window.Razorpay) {
      toast.error("Payment SDK not loaded. Refresh the page and try again.");
      return;
    }

    // Make sure an address is chosen / filled before kicking off payment.
    const shippingAddress = resolveShippingAddress();
    if (!shippingAddress) {
      toast.error("Please select or add a shipping address.");
      return;
    }

    setLoading(true);
    try {
      // If the user typed a new address inline, save it to their profile too
      // (so it's available for next time). The persisted address (with _id)
      // is what gets attached to the order.
      const persistedAddress = (await saveNewAddressIfNeeded()) || shippingAddress;

      // 1. Ask the backend to create a Razorpay test-mode order. The backend
      //    talks to Razorpay's API using the secret; the frontend never sees it.
      const { data } = await OrderService.createPaymentOrder(totalPrice);
      const { orderId, amount, currency, keyId } = data;

      if (!keyId) {
        toast.error("Payment is not configured. Set RAZORPAY_KEY_ID on the backend.");
        return;
      }

      const me = getUser();

      // 2. Open Razorpay's modal. User pays with a test card, then Razorpay
      //    calls our `handler` with payment_id + order_id + signature.
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "Pagevine",
        description: "Cart checkout",
        prefill: {
          name: me?.name || me?.username || "",
          email: me?.email || "",
        },
        theme: { color: "#7160c2" },
        handler: async (response) => {
          try {
            // 3. Verify the signature server-side. Without this, anyone could
            //    fake a successful response. The backend additionally fetches
            //    the payment from Razorpay and returns the safe metadata
            //    (method, last4, status, paidAt) so we can persist it on the
            //    order without trusting the browser for those fields.
            const verifyRes = await OrderService.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            const payment = verifyRes?.data?.payment || {};
            // 4. Verified — finalize the order with the payment metadata
            //    AND the chosen shipping address (snapshotted on the order).
            await finalizeOrder(payment, persistedAddress);
          } catch (err) {
            console.error("verify/finalize failed", err);
            const msg = err?.response?.data?.message || "Payment verification failed.";
            toast.error(msg);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          // User dismissed the modal without paying — drop loading state, leave cart intact.
          ondismiss: () => {
            setLoading(false);
            toast.info("Payment cancelled");
          },
        },
      });

      rzp.on("payment.failed", async (resp) => {
        console.error("payment.failed", resp);
        const error = resp?.error || {};
        toast.error(error.description || "Payment failed");

        // Fetch the payment from Razorpay so we know the actual method/card
        // the user attempted. `error.source` is the failure source (business
        // /customer/gateway), NOT the payment method.
        let detail = {};
        const paymentId = error.metadata?.payment_id;
        if (paymentId) {
          try {
            const res = await OrderService.getPaymentDetails(paymentId);
            detail = res?.data?.payment || {};
          } catch (e) {
            console.warn("Could not fetch failed payment details", e);
          }
        }

        // Record the failed attempt in the user's order history. Cart stays
        // intact so the user can retry. The backend's addOrder service skips
        // creating PurchasedBooks records when status === "Failed".
        try {
          const failedOrderRes = await CartService.addOrder(
            totalPrice,
            {
              ...detail,                               // method, last4, network, bank, vpa, paidAt
              status: "Failed",
              paymentStatus: "failed",
              paymentFailureReason: error.description || error.reason || "Payment failed",
              paymentFailureCode: error.code || null,
              paymentOrderId: error.metadata?.order_id || detail.paymentOrderId || null,
              paymentId: paymentId || detail.paymentId || null,
            },
            persistedAddress,
          );
          const failedId = failedOrderRes?.data?.newOrder?._id;
          if (failedId) {
            window.location.assign(`/order/${failedId}`);
            return;
          }
        } catch (e) {
          console.warn("Could not record failed order", e);
        }
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error("checkout init failed", err);
      const msg = err?.response?.data?.message || "Could not start payment. Please try again.";
      toast.error(msg);
      setLoading(false);
    }
  };

  const handleUpdateQuantity = (price) => setTotalPrice(totalPrice + price);

  const isEmpty = !items || items.length === 0;

  return (
    <>
      <Header ref={childRef} />
      <div className="container bookList">
        <div className="page-header" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div className="page-header__text">
              <h2 className="page-title">Your cart</h2>
              <p className="page-subtitle">{isEmpty ? "Add a book to start your order." : `${items.length} ${items.length === 1 ? "item" : "items"} ready to checkout.`}</p>
            </div>
          </div>
          {!isEmpty && (
            <div className="cart-total-chip">
              <span className="cart-total-chip__label">Total</span>
              <span className="cart-total-chip__value">Rs. {totalPrice}</span>
            </div>
          )}
        </div>

        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <i className="fa-solid fa-cart-shopping"></i>
            </div>
            <h3 className="empty-state__title">Your cart is empty</h3>
            <p className="empty-state__subtitle">
              Browse the library and add a book to your cart to get started.
            </p>
            <div className="empty-state__actions">
              <Link to="/books">
                <button className="btn-primary">Browse books</button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {loading ? null : (
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
                  {items.map((item) => (
                    <CartItem
                      item={item}
                      key={item.title}
                      onUpdateQuantity={handleUpdateQuantity}
                      handleCallChildFunction={handleCallChildFunction}
                    />
                  ))}
                </tbody>
              </table>
            )}

            <div className="cartBottom">
              {loading ? (
                <button className="btn btn-loader" disabled>
                  <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                  &nbsp;Placing order
                </button>
              ) : (
                <>
                  <button className="btn-link" onClick={() => CartService.clearCart()}>Clear cart</button>
                  <button className="btn-primary" onClick={handleShow}>
                    <i className="fa-regular fa-credit-card" style={{ marginRight: 6 }}></i>
                    Proceed to checkout
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {loading ? (
        <Modal show={show} onHide={handleClose} className="checkoutConfirmBox">
          <Modal.Header closeButton className="closeButton">
            <Modal.Title>Hold on</Modal.Title>
          </Modal.Header>
          <Modal.Body>Placing your order</Modal.Body>
          <Modal.Footer className="modalFooter">
            <button className="btn btn-loader" disabled>
              <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
              &nbsp;Placing order
            </button>
          </Modal.Footer>
        </Modal>
      ) : (
        <Modal show={show} onHide={handleClose} className="checkoutConfirmBox">
          <Modal.Header closeButton className="closeButton">
            <Modal.Title>Place order</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ marginBottom: 16, fontSize: 14, color: "#4d5566" }}>
              Total to pay: <strong>Rs. {totalPrice}</strong>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "#6b7384", marginBottom: 8 }}>
              Ship to
            </div>

            {/* Saved addresses (radio list) */}
            {addresses.map((a, i) => {
              const id = String(a._id || i);
              const checked = !addingNew && String(selectedAddressId) === id;
              return (
                <label
                  key={id}
                  htmlFor={`addr-${id}`}
                  style={{
                    display: "block",
                    padding: 12,
                    border: `1px solid ${checked ? "#7160c2" : "#dfe3eb"}`,
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: "pointer",
                    background: checked ? "#f3f0fb" : "#fff",
                  }}
                >
                  <input
                    id={`addr-${id}`}
                    type="radio"
                    name="shippingAddress"
                    value={id}
                    checked={checked}
                    onChange={() => { setSelectedAddressId(id); setAddingNew(false); }}
                    style={{ marginRight: 8 }}
                  />
                  <span style={{ fontSize: 14, color: "#20242f" }}>{formatAddress(a)}</span>
                </label>
              );
            })}

            {/* Toggle / inline new-address form */}
            <label
              htmlFor="addr-new"
              style={{
                display: "block",
                padding: 12,
                border: `1px solid ${addingNew ? "#7160c2" : "#dfe3eb"}`,
                borderRadius: 8,
                marginBottom: 8,
                cursor: "pointer",
                background: addingNew ? "#f3f0fb" : "#fff",
              }}
            >
              <input
                id="addr-new"
                type="radio"
                name="shippingAddress"
                checked={addingNew}
                onChange={() => { setAddingNew(true); setSelectedAddressId(null); }}
                style={{ marginRight: 8 }}
              />
              <span style={{ fontSize: 14, fontWeight: 500 }}>+ Add a new address</span>
            </label>

            {addingNew && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                {/* PIN first — auto-fills city + state */}
                <input
                  className="field__input"
                  placeholder="6-digit PIN — auto-fills city &amp; state"
                  inputMode="numeric"
                  maxLength={6}
                  value={newAddr.pin}
                  onChange={onNewAddrPinChange}
                  style={{ gridColumn: "1 / -1" }}
                />
                {pinLookupLoading && (
                  <span style={{ gridColumn: "1 / -1", fontSize: 12, color: "#6b7384", marginTop: -4 }}>
                    Looking up PIN…
                  </span>
                )}

                <input className="field__input" placeholder="House no." value={newAddr.house}    onChange={(e) => setNewAddr({ ...newAddr, house: e.target.value })} />
                <input
                  className="field__input"
                  placeholder="Locality"
                  value={newAddr.locality}
                  onChange={(e) => setNewAddr({ ...newAddr, locality: e.target.value })}
                  list="cart-locality-options"
                />
                <datalist id="cart-locality-options">
                  {pinPostOffices.map((p) => <option key={p} value={p} />)}
                </datalist>

                <input className="field__input" placeholder="City"      value={newAddr.city}     onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                <select
                  className="field__input field__select"
                  value={newAddr.state}
                  onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                >
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="modalFooter">
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={checkout} className="checkout" disabled={!canPay || savingAddr}>
              <i className="fa-regular fa-credit-card" style={{ marginRight: 6 }}></i>
              Pay Rs. {totalPrice}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      <ToastContainer />
    </>
  );
};

export default Cart;
