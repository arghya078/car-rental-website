const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Car = require("../models/Car");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const Payment = require("../models/Payment");

// Helper
const CAR_POP_FIELDS =
  "brand model year type seatingCapacity images rentalPricePerDay pickupLocation description isAvailable";
const USER_POP_FIELDS = "name email phone address profilePic role";


function normalizeDateToLocalMidnight(dateStr) {
  if (!dateStr) return null;
  try {
    const s = String(dateStr).trim();
    // YYYY-MM-DD pattern
    const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (dateOnlyMatch) {
      const [y, m, d] = s.split("-").map(Number);
      // new Date(year, monthIndex, day, 0, 0, 0, 0) => local midnight
      const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
      return isNaN(dt.getTime()) ? null : dt;
    }
    // fallback parse (handles ISO datetimes)
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (err) {
    return null;
  }
}

//  Create a new booking
exports.createBookingRequest = async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.body;
    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields (carId, startDate, endDate)" });
    }

    const car = await Car.findById(carId).populate("owner");
    if (!car) return res.status(404).json({ message: "Car not found" });

    // Normalize dates to local-midnight Dates
    const s = normalizeDateToLocalMidnight(startDate);
    const e = normalizeDateToLocalMidnight(endDate);

    if (!s || !e || isNaN(s.getTime()) || isNaN(e.getTime()) || s >= e) {
      // strict: require end date to be AFTER start date
      return res.status(400).json({ message: "Invalid date range — endDate must be after startDate" });
    }

    // check overlapping booking (Pending / Approved / Paid)
    // Note: store uses Date type; s and e are Date objects at local midnight -> safe to compare
    const existingBooking = await Booking.findOne({
      car: carId,
      status: { $in: ["Pending", "Approved", "Paid", "pending", "requested", "Requested"] },
      $or: [{ startDate: { $lte: e } }, { endDate: { $gte: s } }, { $and: [{ startDate: { $gte: s } }, { endDate: { $lte: e } }] }],
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Car already booked for selected dates" });
    }

    // compute days: difference in days (end - start). This treats start=2025-09-01 end=2025-09-02 as 1 day.
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const days = Math.ceil((e - s) / MS_PER_DAY);
    if (days < 1) return res.status(400).json({ message: "Invalid booking duration" });

    const taxRate = 0.18;
    const totalPrice = Number((days * car.rentalPricePerDay * (1 + taxRate)).toFixed(2));

    // Force booking currency to USD (backend uses USD for payments)
    const bookingCurrency = "usd";

    const booking = new Booking({
      car: carId,
      customer: req.user._id,
      startDate: s,
      endDate: e,
      totalPrice,
      currency: bookingCurrency,
      owner: car.owner._id,
      status: "Pending",
    });

    await booking.save();

    // Email to Owner (best-effort)
    try {
      if (car.owner && car.owner.email) {
        await sendEmail(
          car.owner.email,
          "New Booking Request",
          `You have a new booking request for ${car.brand} ${car.model} from ${s.toDateString()} to ${e.toDateString()}.`
        );
      }
    } catch (mailErr) {
      console.warn("Failed to send booking request email:", mailErr);
    }

    // Return populated booking so client has consistent shape
    const populatedBooking = await Booking.findById(booking._id)
      .populate("car", CAR_POP_FIELDS)
      .populate("customer", USER_POP_FIELDS)
      .populate("owner", USER_POP_FIELDS)
      .lean();

    return res.status(201).json({ message: "Booking request sent", booking: populatedBooking });
  } catch (err) {
    console.error("createBookingRequest error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get booking by id
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing booking id" });

    const booking = await Booking.findById(id)
      .populate("car", CAR_POP_FIELDS)
      .populate("customer", USER_POP_FIELDS)
      .populate("owner", USER_POP_FIELDS);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // attach payment status if exists - pick the latest payment for this booking
    let payment = null;
    try {
      payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 }).select("status");
    } catch (pErr) {
      console.warn("Failed to look up payment for booking:", pErr);
    }

    const bookingObj = booking.toObject();
    bookingObj.paymentStatus = payment ? payment.status : "Pending Payment";

    return res.json({ booking: bookingObj });
  } catch (err) {
    console.error("getBookingById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all requests for owner
exports.getOwnerRequests = async (req, res) => {
  try {
    const ownerId = req.user && req.user._id;
    if (!ownerId) return res.status(401).json({ message: "Unauthorized" });

    // Only pending/requested bookings
    const pendingStatuses = ["Pending", "pending", "Requested", "requested"];
    const bookings = await Booking.find({ owner: ownerId, status: { $in: pendingStatuses } })
      .sort({ createdAt: -1 })
      .populate("car", "brand model images rentalPricePerDay pickupLocation year seatingCapacity")
      .populate("customer", "name email phone")
      .lean();

    return res.json({ bookings });
  } catch (err) {
    console.error("getOwnerRequests error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all requests for owner with payments
exports.getOwnerBookingsWithPayments = async (req, res) => {
  try {
    const ownerId = req.user && req.user._id;
    if (!ownerId) return res.status(401).json({ message: "Unauthorized" });

    const bookings = await Booking.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .populate("car", "brand model images rentalPricePerDay pickupLocation year seatingCapacity")
      .populate("customer", "name email phone");

    const bookingsWithPayment = await Promise.all(
      bookings.map(async (b) => {
        let payment = null;
        try {
          payment = await Payment.findOne({ booking: b._id }).sort({ createdAt: -1 }).select("status");
        } catch (pErr) {
          console.warn("Payment lookup failed:", pErr);
        }
        return {
          ...b.toObject(),
          paymentStatus: payment ? payment.status : "Pending Payment",
        };
      })
    );

    return res.json({ bookings: bookingsWithPayment });
  } catch (err) {
    console.error("getOwnerBookingsWithPayments error:", err);
    return res.status(500).json({ message: "Error fetching owner bookings" });
  }
};

// Get all bookings for owner
exports.getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user && req.user._id;
    if (!ownerId) return res.status(401).json({ message: "Unauthorized" });

    const bookings = await Booking.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .populate("car", "brand model images rentalPricePerDay pickupLocation year seatingCapacity")
      .populate("customer", "name email phone")
      .lean();

    return res.json({ bookings });
  } catch (err) {
    console.error("getOwnerBookings error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Respond to a booking
exports.respondToBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId || req.params.id || req.params._id;
    const { action, reason } = req.body; // "approve" or "reject"

    if (!bookingId) return res.status(400).json({ message: "Missing booking id" });
    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    // perform atomic update: ensure the booking is owned by the requester and is in a Pending state
    const filter = {
      _id: bookingId,
      owner: req.user._id,
      status: { $in: ["Pending", "pending", "Requested", "requested"] },
    };

    let update = {};
    const now = new Date();

    if (action === "approve") {
      update = {
        $set: { status: "Approved", approvedAt: now },
        $unset: { responseReason: "" },
      };
    } else {
      update = {
        $set: { status: "Rejected", rejectedAt: now, responseReason: reason || null },
      };
    }

    // findOneAndUpdate is atomic for this single-document update
    const updated = await Booking.findOneAndUpdate(filter, update, { new: true });

    if (!updated) {
      // Could be not found, not owner, or not pending
      const maybeBooking = await Booking.findById(bookingId).select("owner status");
      if (!maybeBooking) return res.status(404).json({ message: "Booking not found" });
      if (String(maybeBooking.owner) !== String(req.user._id)) return res.status(403).json({ message: "Not authorized" });
      return res.status(409).json({ message: `Booking cannot be ${action}ed in its current status (${maybeBooking.status})` });
    }

    // populate before responding
    const populated = await Booking.findById(updated._id)
      .populate("car", CAR_POP_FIELDS)
      .populate("customer", USER_POP_FIELDS)
      .populate("owner", USER_POP_FIELDS)
      .lean();

    // Send email notifications (best-effort) using populated data
    try {
      if (action === "approve") {
        if (populated.customer && populated.customer.email) {
          await sendEmail(
            populated.customer.email,
            "Booking Approved",
            `✅ Your booking for ${populated.car.brand} (${populated.car.model}) has been approved from ${new Date(
              populated.startDate
            ).toDateString()} to ${new Date(populated.endDate).toDateString()}. Please proceed to payment to confirm your booking.`
          );
        }
      } else {
        if (populated.customer && populated.customer.email) {
          await sendEmail(
            populated.customer.email,
            "Booking Rejected",
            `❌ Your booking for ${populated.car.brand} (${populated.car.model}) has been rejected.${reason ? ` Reason: ${reason}` : ""}`
          );
        }
      }
    } catch (mailErr) {
      console.warn("Failed to send respondToBooking email:", mailErr);
    }

    return res.json({ message: `Booking ${action}ed`, booking: populated });
  } catch (err) {
    console.error("respondToBooking error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Proceed to payment
exports.proceedToPayment = async (req, res) => {
  try {
    const bookingId = req.params.bookingId || req.params.id;
    if (!bookingId) return res.status(400).json({ message: "Missing booking id" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    // make approval check case-insensitive
    if ((String(booking.status) || "").toLowerCase() !== "approved") {
      return res.status(400).json({ message: "Booking not approved yet" });
    }

    return res.json({
      message: "Proceed to payment gateway",
      amount: booking.totalPrice,
      currency: booking.currency || "usd",
      bookingId: booking._id,
    });
  } catch (err) {
    console.error("proceedToPayment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Cancel booking
exports.cancelBookingRequest = async (req, res) => {
  try {
    const bookingId = req.params.bookingId || req.params.id;
    if (!bookingId) return res.status(400).json({ message: "Missing booking id" });

    const booking = await Booking.findById(bookingId).populate("owner").populate("car");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!["Pending", "pending", "Requested", "requested"].includes(String(booking.status))) {
      return res.status(400).json({ message: "Cannot cancel booking once it is approved/rejected" });
    }

    booking.status = "Cancelled";
    booking.cancelledAt = new Date();
    await booking.save();

    try {
      if (booking.owner && booking.owner.email) {
        await sendEmail(
          booking.owner.email,
          "Booking Cancelled by Customer",
          `⚠️ The booking request for ${booking.car.brand} (${booking.car.model}) from ${new Date(
            booking.startDate
          ).toDateString()} to ${new Date(booking.endDate).toDateString()} has been cancelled by the customer.`
        );
      }
    } catch (mailErr) {
      console.warn("Failed to send cancellation email:", mailErr);
    }

    const populated = await Booking.findById(booking._id)
      .populate("car", CAR_POP_FIELDS)
      .populate("customer", USER_POP_FIELDS)
      .populate("owner", USER_POP_FIELDS)
      .lean();

    return res.json({ message: "Booking cancelled successfully", booking: populated });
  } catch (err) {
    console.error("cancelBookingRequest error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all bookings for customer
exports.getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate("car", "brand model images rentalPricePerDay pickupLocation year seatingCapacity")
      .populate("owner", "name email phone");

    const bookingsWithPayment = await Promise.all(
      bookings.map(async (b) => {
        let payment = null;
        try {
          payment = await Payment.findOne({ booking: b._id }).sort({ createdAt: -1 }).select("status");
        } catch (pErr) {
          console.warn("Payment lookup failed:", pErr);
        }
        return {
          ...b.toObject(),
          paymentStatus: payment ? payment.status : "Pending Payment",
        };
      })
    );

    return res.json(bookingsWithPayment);
  } catch (err) {
    console.error("getCustomerBookings error:", err);
    return res.status(500).json({ message: "Error fetching customer bookings" });
  }
};

// Get all bookings for admin
exports.getAllBookingsForAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("car", "brand model images rentalPricePerDay pickupLocation year seatingCapacity")
      .populate("customer", "name email phone")
      .populate("owner", "name email phone");

    const bookingsWithPayment = await Promise.all(
      bookings.map(async (b) => {
        let payment = null;
        try {
          payment = await Payment.findOne({ booking: b._id }).sort({ createdAt: -1 }).select("status");
        } catch (pErr) {
          console.warn("Payment lookup failed:", pErr);
        }
        return {
          ...b.toObject(),
          paymentStatus: payment ? payment.status : "Pending Payment",
        };
      })
    );

    return res.json({ bookings: bookingsWithPayment });
  } catch (err) {
    console.error("getAllBookingsForAdmin error:", err);
    return res.status(500).json({ message: "Error fetching admin bookings" });
  }
};
