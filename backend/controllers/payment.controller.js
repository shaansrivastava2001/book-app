const PaymentService = require("../services/payment.service");

class PaymentController {
  /**
   * POST /orders/payment/createOrder
   * Body: { amount: <rupees> }
   * Returns: { orderId, amount, currency, keyId }
   */
  static async createOrder(req, res) {
    try {
      const amount = Number(req.body.amount);
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid `amount` (in rupees) is required" });
      }
      const order = await PaymentService.createOrder(amount);
      return res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      console.error("payment.createOrder - error", err);
      const msg = err.message?.includes("RAZORPAY")
        ? err.message
        : "Failed to create payment order";
      return res.status(500).json({ message: msg });
    }
  }

  /**
   * POST /orders/payment/verify
   * Body: { orderId, paymentId, signature }   (the three fields Razorpay returns
   *                                             to the success handler in the modal)
   * Returns: { verified: true } on success, 400 on signature mismatch.
   */
  /**
   * POST /orders/payment/details
   * Body: { paymentId }
   * Fetches a Razorpay payment by id and returns the safe metadata. Used on
   * the failed-payment path (no signature exists yet) so the failed order
   * record can include the method the user tried, masked card last4, etc.
   */
  static async getDetails(req, res) {
    try {
      const { paymentId } = req.body;
      if (!paymentId) return res.status(400).json({ message: "paymentId is required" });
      const payment = await PaymentService.fetchPayment(paymentId);
      if (!payment) return res.status(404).json({ message: "Payment not found" });
      return res.status(200).json({ payment: PaymentService.toOrderMetadata(payment) });
    } catch (err) {
      console.error("payment.getDetails - error", err);
      return res.status(500).json({ message: "Failed to load payment details" });
    }
  }

  static async verifyPayment(req, res) {
    try {
      const { orderId, paymentId, signature } = req.body;
      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({ message: "orderId, paymentId, and signature are required" });
      }
      const ok = PaymentService.verifySignature({ orderId, paymentId, signature });
      if (!ok) return res.status(400).json({ message: "Payment signature invalid" });

      // Pull payment details from Razorpay's API (server-side, so the client
      // can't fake last4, method, status, etc.) and return safe-to-persist
      // fields the frontend will hand to addOrder.
      const payment = await PaymentService.fetchPayment(paymentId);
      const metadata = PaymentService.toOrderMetadata(payment);

      return res.status(200).json({ verified: true, payment: metadata });
    } catch (err) {
      console.error("payment.verifyPayment - error", err);
      return res.status(500).json({ message: "Failed to verify payment" });
    }
  }
}

module.exports = PaymentController;
