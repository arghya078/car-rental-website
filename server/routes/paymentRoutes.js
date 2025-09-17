// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { isApprovedOwner, isAdmin } = require("../middlewares/roleMiddleware");
const paymentController = require("../controllers/paymentController");

// Destructure controller functions for clarity
const {
  initiatePayment,
  capturePayment,
  getEarnings,
  cancelPaymentIntent,
  refundPayment,
} = paymentController;

// Initiate a Payment (customer or admin)
router.post("/initiate/:bookingId", protect, initiatePayment);

// Capture a Payment (customer or admin)
router.post("/capture", protect, capturePayment);

// Cancel a Payment
router.post("/cancel", protect, cancelPaymentIntent);

// Refund a Payment
router.post("/refund", protect, isAdmin, refundPayment);

// Get Earnings
router.get("/owner/earnings", protect, isApprovedOwner, getEarnings);

// Note: webhook route is handled in index.js using express.raw() to allow signature verification.

module.exports = router;
