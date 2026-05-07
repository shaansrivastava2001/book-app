import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../../styles/style.scss";
import UserService from "../../services/user.service";
import Header from "../common/Header";
import { INDIAN_STATES, lookupPincode } from "../../utils/india";

const Address = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    house: "",
    locality: "",
    city: "",
    state: "",
    pin: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [pinLookupLoading, setPinLookupLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [postOffices, setPostOffices] = useState([]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // When the user finishes typing a 6-digit PIN, look it up and auto-fill
  // city + state. The locality field gets a list of nearby post-office
  // names to choose from (datalist); user can still type their own.
  const onPinChange = async (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, pin: raw }));
    setPinError("");

    if (raw.length !== 6) {
      setPostOffices([]);
      return;
    }

    setPinLookupLoading(true);
    try {
      const result = await lookupPincode(raw);
      if (!result) {
        setPinError("PIN code not found");
        setPostOffices([]);
        return;
      }
      setForm((f) => ({
        ...f,
        city: result.city || f.city,
        state: result.state || f.state,
      }));
      setPostOffices(result.postOffices || []);
    } finally {
      setPinLookupLoading(false);
    }
  };

  const canSubmit =
    form.house.toString().trim() &&
    form.locality.toString().trim() &&
    form.city.toString().trim() &&
    form.state.toString().trim() &&
    form.pin.toString().trim() &&
    !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await UserService.addAddress(form);
      if (res) navigate(-1);
      else toast.error("Could not save address. Please try again.");
    } catch (err) {
      const msg = err?.response?.data?.message || "Could not save address.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-narrow">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="page-header__text">
            <h2 className="page-title">Add address</h2>
            <p className="page-subtitle">Save it once and pick it at checkout.</p>
          </div>
        </div>

        <form className="form-card" onSubmit={submit} autoComplete="off" noValidate>
          <div className="form-grid">
            {/* PIN first — entering it auto-fills city + state below */}
            <div className="field field--full">
              <label htmlFor="pin" className="field__label">PIN code</label>
              <input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="field__input"
                value={form.pin}
                onChange={onPinChange}
                placeholder="6-digit PIN — we'll fill in city &amp; state"
              />
              {pinLookupLoading && <span className="field__hint">Looking up PIN…</span>}
              {pinError && <span className="field__error">{pinError}</span>}
            </div>

            <div className="field">
              <label htmlFor="house" className="field__label">House no.</label>
              <input id="house" type="text" className="field__input" value={form.house} onChange={set("house")} placeholder="A‑12, Apt 4B" />
            </div>

            <div className="field">
              <label htmlFor="locality" className="field__label">Locality</label>
              <input
                id="locality"
                type="text"
                className="field__input"
                value={form.locality}
                onChange={set("locality")}
                placeholder="Street, area"
                list="locality-options"
              />
              {/* Suggestions sourced from post offices for this PIN */}
              <datalist id="locality-options">
                {postOffices.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>

            <div className="field">
              <label htmlFor="city" className="field__label">City</label>
              <input id="city" type="text" className="field__input" value={form.city} onChange={set("city")} placeholder="Mumbai" />
            </div>

            <div className="field">
              <label htmlFor="state" className="field__label">State</label>
              <select
                id="state"
                className="field__input field__select"
                value={form.state}
                onChange={set("state")}
              >
                <option value="">Select a state…</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-link" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              {submitting ? "Saving…" : "Save address"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </>
  );
};

export default Address;
