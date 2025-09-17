
const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    providerRefundId: { type: String },
    amount: { type: Number, min: 0 },
    reason: { type: String },
    status: { type: String }, 
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true, min: 0 },
    amountInCents: { type: Number, min: 0 },

    currency: { type: String, default: "usd", lowercase: true },

    provider: { type: String, enum: ["paypal", "stripe", "other"], required: false },
    providerPaymentId: { type: String },

    providerCaptureId: { type: String },

    raw: { type: Object },
    rawStatus: { type: String },

    status: {
      type: String,
      enum: ["Pending", "Succeeded", "Failed", "Cancelled", "Refunded"],
      default: "Pending",
    },

    refunds: { type: [refundSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Backward compatibility
paymentSchema.virtual("amountInPaise")
  .get(function () {
    return this.amountInCents;
  })
  .set(function (val) {
    this.amountInCents = val;
  });

// Auto-fill amountInCents
paymentSchema.pre("save", function (next) {
  try {
    if ((this.amountInCents === undefined || this.amountInCents === null) && (this.amount !== undefined && this.amount !== null)) {
      // ensure minor units (cents) are integer
      this.amountInCents = Math.round(Number(this.amount) * 100);
    }
    if (this.currency) {
      this.currency = String(this.currency).toLowerCase();
    } else {
      this.currency = "usd";
    }
    return next();
  } catch (e) {
    return next(e);
  }
});

paymentSchema.index({ providerPaymentId: 1 });
paymentSchema.index({ booking: 1, createdAt: -1 });
paymentSchema.index({ providerCaptureId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
