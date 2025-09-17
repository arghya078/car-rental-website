
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const sendEmail = require("../utils/sendEmail");

// PayPal helper
const {
  createOrder,
  captureOrder,
  refundCapture,
} = require("../utils/paypalHelper");

// Extract string ID
function extractId(maybe) {
  if (!maybe) return null;
  if (typeof maybe === "string") return maybe;
  if (maybe._id) return String(maybe._id);
  if (maybe.id) return String(maybe.id);
  return null;
}

function normalizePaypalStatus(rawStatus) {
  if (!rawStatus) return "Pending";
  const s = String(rawStatus).toUpperCase();

  if (s === "COMPLETED") return "Succeeded";
  if (["PENDING", "CREATED", "APPROVED"].includes(s)) return "Pending";
  if (["DENIED", "DECLINED"].includes(s)) return "Failed";
  if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(s)) return "Refunded";
  if (["VOIDED", "CANCELLED", "CANCELED"].includes(s)) return "Cancelled";

  return rawStatus;
}

// initiate a payment for a booking
exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ message: "Missing bookingId" });

    const booking = await Booking.findById(bookingId).populate("car owner customer");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const requesterId = req.user ? String(req.user._id) : null;
    if (!requesterId || String(booking.customer?._id) !== requesterId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if ((booking.status || "").toLowerCase() !== "approved") {
      return res.status(400).json({ message: "Booking not approved yet" });
    }

    const amountMajor = Number(booking.totalPrice);
    if (Number.isNaN(amountMajor) || amountMajor <= 0) {
      return res.status(400).json({ message: "Invalid booking totalPrice" });
    }

    let order;
    try {
      order = await createOrder({
        amountMajor,
        currency: "USD",
        bookingId: String(booking._id),
        description: `Booking payment ${String(booking._id)}`,
        custom_id: String(booking._id),
      });
      console.log("✅ PayPal order created", { id: order.id, status: order.status });
    } catch (err) {
      console.error("❌ PayPal createOrder error:", err);
      return res.status(500).json({ message: "PayPal create order failed", error: err.message });
    }

    const paymentPayload = {
      booking: booking._id,
      customer: booking.customer,
      owner: booking.owner,
      amount: amountMajor,
      amountInCents: Math.round(amountMajor * 100),
      currency: "usd",
      provider: "paypal",
      providerPaymentId: order.id,
      status: normalizePaypalStatus(order.status),
      rawStatus: order.status,
      raw: order,
    };

    let payment = await Payment.findOne({ providerPaymentId: order.id });
    if (payment) {
      Object.assign(payment, paymentPayload);
      await payment.save();
    } else {
      payment = await Payment.create(paymentPayload);
    }

    return res.json({
      success: true,
      orderId: order.id,
      paymentId: payment._id,
      displayAmount: amountMajor,
      amountInCents: paymentPayload.amountInCents,
      currency: paymentPayload.currency,
    });
  } catch (err) {
    console.error("initiatePayment error:", err);
    return res.status(500).json({ message: "Payment initiation failed", error: err.message });
  }
};

// Capture a payment after approval
exports.capturePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "orderId required" });

    let capture;
    try {
      capture = await captureOrder(orderId);
      console.log("✅ capturePayment result:", JSON.stringify(capture, null, 2));
    } catch (e) {
      console.error("❌ capturePayment: captureOrder failed:", e);
      return res.status(500).json({ success: false, message: "PayPal capture failed", error: e.message });
    }

    const captureObj =
      capture.purchase_units?.[0]?.payments?.captures?.[0] || capture;
    const captureId = captureObj?.id || null;
    const rawStatus = captureObj?.status || capture.status;
    const status = normalizePaypalStatus(rawStatus);

    const amountMajor = Number(
      captureObj?.amount?.value || capture.purchase_units?.[0]?.amount?.value || 0
    );
    const amountInCents = Math.round(amountMajor * 100);

    const bookingId = capture.purchase_units?.[0]?.custom_id || null;
    if (!bookingId) {
      console.error("❌ capturePayment: Missing bookingId in PayPal capture payload");
    }

    let payment = await Payment.findOne({ providerPaymentId: orderId });
    if (!payment && bookingId) {
      payment = await Payment.findOne({ booking: bookingId });
    }

    if (payment) {
      payment.status = status;
      payment.amount = amountMajor;
      payment.amountInCents = amountInCents;
      payment.providerCaptureId = captureId;
      payment.raw = capture;
      await payment.save();
    }

    if (bookingId) {
      await Booking.findByIdAndUpdate(
        bookingId,
        {
          paymentStatus: status,
          status: status === "Succeeded" ? "Paid" : status,
        },
        { new: true }
      );
    }

    return res.json({ success: true, capture: captureObj, payment });
  } catch (err) {
    console.error("capturePayment error:", err);
    return res.status(500).json({ success: false, message: "Capture failed", error: err.message });
  }
};

// Confirm payment 
exports.confirmPayment = async (req, res) => {
  try {
    const event = req.body;
    if (!event || !event.event_type) {
      return res.status(200).json({ received: true });
    }

    const eventType = event.event_type;
    const resource = event.resource || {};
    const providerPaymentId =
      resource?.supplementary_data?.related_ids?.order_id ||
      resource?.invoice_id ||
      resource?.custom_id ||
      resource?.id ||
      null;
    const captureId = resource?.id || null;
    const rawStatus = resource?.status || resource?.state;
    const status = normalizePaypalStatus(rawStatus);

    const bookingId =
      resource?.custom_id || resource?.invoice_id || null;

    if (bookingId) {
      await Booking.findByIdAndUpdate(
        bookingId,
        {
          paymentStatus: status,
          status: status === "Succeeded" ? "Paid" : status,
        },
        { new: true }
      );
    }

    await Payment.findOneAndUpdate(
      { providerPaymentId },
      {
        providerPaymentId,
        providerCaptureId: captureId,
        status,
        raw: resource,
      },
      { upsert: true }
    );

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("confirmPayment error:", err);
    return res.status(500).json({ message: "Payment confirmation failed", error: err.message });
  }
};

// Cancel a payment 
exports.cancelPaymentIntent = async (req, res) => {
  try {
    const { paymentId, providerPaymentId } = req.body;
    const identifier = paymentId || providerPaymentId;
    if (!identifier) return res.status(400).json({ success: false, message: "paymentId or providerPaymentId required" });

    const payment = paymentId
      ? await Payment.findById(paymentId)
      : await Payment.findOne({ providerPaymentId });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    if (payment.status && /succeed/i.test(payment.status)) {
      return res.status(400).json({ success: false, message: "Cannot cancel a succeeded (paid) payment. Issue a refund instead." });
    }

    payment.status = "Cancelled";
    payment.raw = { ...(payment.raw || {}), cancelledAt: new Date() };
    await payment.save();

    return res.json({ success: true, payment });
  } catch (err) {
    console.error("cancelPaymentIntent error:", err);
    return res.status(500).json({ success: false, message: "Cancel failed", error: err.message });
  }
};

// Refund a payment
exports.refundPayment = async (req, res) => {
  try {
    const { paymentId, providerPaymentId, captureId, amountPaise } = req.body;
    const identifier = paymentId || providerPaymentId;
    if (!identifier) return res.status(400).json({ success: false, message: "paymentId or providerPaymentId required" });

    const payment = paymentId
      ? await Payment.findById(paymentId)
      : await Payment.findOne({ providerPaymentId });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    if (!/succeed/i.test(payment.status)) {
      return res.status(400).json({ success: false, message: "Only succeeded payments can be refunded" });
    }

    let usedCaptureId = captureId || payment.providerCaptureId;
    if (!usedCaptureId && payment.raw?.purchase_units?.[0]?.payments?.captures?.[0]) {
      usedCaptureId = payment.raw.purchase_units[0].payments.captures[0].id;
    }
    if (!usedCaptureId) {
      return res.status(400).json({ success: false, message: "No captureId available to refund." });
    }

    let refund;
    try {
      if (amountPaise) {
        refund = await refundCapture(usedCaptureId, { amountInCents: Number(amountPaise), currency: payment.currency || "usd" });
      } else {
        refund = await refundCapture(usedCaptureId);
      }
    } catch (e) {
      console.error("refundPayment: PayPal refund error:", e);
      return res.status(500).json({ success: false, message: "PayPal refund failed", error: e.message });
    }

    payment.status = "Refunded";
    payment.raw = { ...(payment.raw || {}), lastRefund: refund };
    await payment.save();

    if (payment.booking) {
      await Booking.findByIdAndUpdate(payment.booking, { status: "Refunded", paymentStatus: "Refunded" });
    }

    return res.json({ success: true, refund, payment });
  } catch (err) {
    console.error("refundPayment error:", err);
    return res.status(500).json({ success: false, message: "Refund failed", error: err.message });
  }
};

// Get earnings for owner
exports.getEarnings = async (req, res) => {
  try {
    const payments = await Payment.find({ owner: req.user._id, status: "Succeeded" });
    const totalEarnings = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return res.json({ totalEarnings, payments });
  } catch (err) {
    console.error("getEarnings error:", err);
    return res.status(500).json({ message: "Error fetching earnings", error: err.message });
  }
};
