const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const schema = mongoose.Schema;
const ObjectId = schema.ObjectId;

const OrderSchema = new mongoose.Schema(
  {
    // Buyer
    name: { type: String, required: true },
    email: { type: String, required: true },
    userId: ObjectId,

    // Cart contents
    quantity: Number,
    total_price: Number,

    // Order workflow status (Placed, Shipped, Delivered, …)
    status: String,

    // ────────────────────────────────────────────────────────────────────
    // Payment metadata (Razorpay). We deliberately store ONLY the last
    // four digits of the card — never the full PAN, CVV, or expiry —
    // so we don't take on PCI scope.
    // ────────────────────────────────────────────────────────────────────
    paymentId: String,                 // rzp payment_id  (pay_…)
    paymentOrderId: String,            // rzp order_id    (order_…)
    paymentMethod: String,             // card | netbanking | upi | wallet | …
    paymentStatus: String,             // captured | authorized | failed | …
    paymentCardLast4: String,          // present only when method=card
    paymentCardNetwork: String,        // visa | mastercard | rupay | …
    paymentBank: String,               // present for netbanking / card issuer
    paymentVpa: String,                // UPI handle (without sensitive parts)
    paidAt: Date,                      // when Razorpay captured the payment

    // Recorded only when paymentStatus === "failed" — the human-readable
    // description from Razorpay's `payment.failed` event so the user can
    // see why their checkout didn't go through.
    paymentFailureReason: String,
    paymentFailureCode: String,        // e.g. "BAD_REQUEST_ERROR"

    // Shipping address — embedded snapshot at the time of order, not a
    // reference. Source-of-truth: even if the user later edits or deletes
    // the address from their profile, the order's shipping info is preserved.
    shippingAddress: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
