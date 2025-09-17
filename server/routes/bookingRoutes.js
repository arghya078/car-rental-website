// src/routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { isApprovedOwner, isAdmin } = require("../middlewares/roleMiddleware");
const {
  createBookingRequest,
  getOwnerRequests,               
  getOwnerBookings,               
  respondToBooking,
  proceedToPayment,
  cancelBookingRequest,
  getCustomerBookings,
  getOwnerBookingsWithPayments,   
  getAllBookingsForAdmin,
  getBookingById,
} = require("../controllers/bookingController");

// customer endpoints

// Customer sends booking request
router.post("/request", protect, createBookingRequest);

// Customer can cancel booking request (before approval)
router.post("/:bookingId/cancel", protect, cancelBookingRequest);

// Customer proceeds to payment (only if Approved)
router.post("/:bookingId/pay", protect, proceedToPayment);

//Owner endpoints

// Owner can fetch bookings pending request
router.get("/owner/requests", protect, isApprovedOwner, getOwnerRequests);

// Owner: fetch bookings
router.get("/owner", protect, isApprovedOwner, getOwnerBookings);

// Owner: fetch all bookings with payment status
router.get("/owner/all", protect, isApprovedOwner, getOwnerBookingsWithPayments);

// Owner: fetch all bookings
router.get("/owner/myBookings", protect, isApprovedOwner, getOwnerBookingsWithPayments);

// Owner responds (approve/reject)
router.put("/:bookingId/respond", protect, isApprovedOwner, respondToBooking);

// Customer/admin endpoints

// Customer: get their bookings
router.get("/customer/myBookings", protect, getCustomerBookings);

// Admin: monitor all bookings
router.get("/admin/allBookings", protect, isAdmin, getAllBookingsForAdmin);

// Canonical: Get booking by id
router.get("/:id", protect, getBookingById);

module.exports = router;
