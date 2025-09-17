const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["customer", "owner", "admin"],
      default: "customer",
    },

    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },

    // Documents (both customer & owner)
    documents: {
      govId: {
        url: { type: String },
        public_id: { type: String },
      },
      drivingLicense: {
        url: { type: String },
        public_id: { type: String },
      },
    },

    // KYC only for owners
    kyc: {
      ownershipProof: {
        url: { type: String },
        public_id: { type: String },
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      rejectionReason: { type: String },
    },

    // Profile
    profilePic: {
      url: { type: String },
      public_id: { type: String },
    },

    address: { type: String },
    phone: { type: String },

    // Forgot Password fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
