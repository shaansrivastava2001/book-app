const Razorpay = require("razorpay");
const crypto = require("crypto");

let cachedClient = null;
function getClient() {
  if (cachedClient) return cachedClient;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in backend/.env. " +
      "See README → Razorpay setup."
    );
  }
  cachedClient = new Razorpay({ key_id, key_secret });
  return cachedClient;
}

class PaymentService {
  /**
   * Create a Razorpay order for `amountInRupees`.
   * Razorpay's API expects amounts in paise (1 INR = 100 paise).
   * Use a `rzp_test_…` key during development — those only accept test cards.
   */
  static async createOrder(amountInRupees) {
    const client = getClient();
    return client.orders.create({
      amount: Math.round(Number(amountInRupees) * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1, // auto-capture on success
    });
  }

  /**
   * Verify the HMAC signature returned by Razorpay after a successful
   * checkout. The signature is HMAC-SHA256 of `${order_id}|${payment_id}`
   * using the API key secret. Without this check, a malicious client could
   * skip the payment modal and fake a successful response.
   */
  static verifySignature({ orderId, paymentId, signature }) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || !orderId || !paymentId || !signature) return false;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    return expected === signature;
  }

  /**
   * Pull the payment from Razorpay using the API. We use the values from this
   * call (not whatever the browser claims) when persisting payment metadata —
   * that way the client can't lie about method, last4, status, etc.
   */
  static async fetchPayment(paymentId) {
    const client = getClient();
    return client.payments.fetch(paymentId);
  }

  /**
   * Distill the full Razorpay payment object down to the safe-to-persist
   * fields used in the Order document. Importantly, we keep ONLY card.last4
   * — never the full card number, CVV, or expiry.
   */
  static toOrderMetadata(payment) {
    if (!payment) return {};
    const card = payment.card || {};
    return {
      paymentId: payment.id,
      paymentOrderId: payment.order_id,
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      paymentCardLast4: card.last4 || null,
      paymentCardNetwork: card.network || null,
      paymentBank: payment.bank || card.issuer || null,
      paymentVpa: payment.vpa || null,
      paidAt: payment.created_at ? new Date(payment.created_at * 1000) : null,
    };
  }
}

module.exports = PaymentService;
