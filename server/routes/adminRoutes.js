const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { isAdmin } = require("../middlewares/roleMiddleware");
const {
  getPendingOwners,
  approveOwner,
  rejectOwner,
  makeAdmin,
  getOwnerKycById,
  getApprovedOwners,
  getAllCustomers,
  getCustomerDetails,
  getCustomerBookings,
  deleteCustomer,
  getAllBookings

} = require("../controllers/adminController");

// Admin can view specific owner kyc docs
router.get("/owners/:id/kyc", protect, isAdmin, getOwnerKycById);

// Admin can view all pending owner requests
router.get("/owners/pending", protect, isAdmin, getPendingOwners);

// Admin can approve owner
router.put("/owners/:id/approve", protect, isAdmin, approveOwner);

// Admin can Reject owner
router.put("/owners/:id/reject", protect, isAdmin, rejectOwner);

//Admin can fetch all approved owners
router.get("/approved-owners", protect, isAdmin, getApprovedOwners);

// Get all customers
router.get("/customers", protect, isAdmin, getAllCustomers);

// Get full details of a customer
router.get("/customers/:id", protect, isAdmin, getCustomerDetails);

// Get all bookings of a customer
router.get("/customers/:id/bookings", protect, isAdmin, getCustomerBookings);

// Admin can Get all bookings
router.get("/bookings", protect, isAdmin, getAllBookings);

// Delete a customer account
router.delete("/customers/:id", protect, isAdmin, deleteCustomer);

// Make admin
router.put("/make-admin/:userId", protect, isAdmin, makeAdmin);

module.exports = router;
