
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    totalPrice: { type: Number, required: true, min: 0 },

    currency: { type: String, default: "usd", lowercase: true },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled", "Paid", "Refunded"],
      default: "Pending",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending Payment", "Succeeded", "Failed", "Cancelled", "Refunded"],
      default: "Pending Payment",
    },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    cancelledAt: { type: Date },
    responseReason: { type: String },
  },
  { timestamps: true }
);

// Validate startDate & endDate
bookingSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate).getTime();
    const end = new Date(this.endDate).getTime();
    if (isNaN(start) || isNaN(end)) {
      return next(new Error("Invalid startDate or endDate"));
    }
    if (end <= start) {
      return next(new Error("endDate must be after startDate"));
    }
  }
  return next();
});

// Check for overlapping dates
bookingSchema.pre("save", async function (next) {
  try {
    // If no startDate, endDate, or car, skip
    if (!this.car || !this.startDate || !this.endDate) return next();

    // If no changes to startDate, endDate, or car, skip
    if (!this.isNew && !this.isModified("startDate") && !this.isModified("endDate") && !this.isModified("car")) {
      return next();
    }

    const overlapping = await mongoose.model("Booking").findOne({
      _id: { $ne: this._id },
      car: this.car,
      status: { $in: ["Pending", "Approved", "Paid"] },
      $or: [
        { startDate: { $lte: this.endDate }, endDate: { $gte: this.startDate } }, // any overlap
      ],
    }).select("_id status startDate endDate");

    if (overlapping) {
      const err = new Error("Selected dates conflict with an existing booking for this car.");
      err.code = "OVERLAP_CONFLICT";
      return next(err);
    }

    return next();
  } catch (e) {
    return next(e);
  }
});


bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ car: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
