// middleware to check roles
const User = require("../models/User");

// Only Admin can access
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied: Admin only" });
  }
};

// Only Owner (approved by Admin) can access
exports.isApprovedOwner = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "owner") {
      return res.status(403).json({ message: "Access denied: Owner only" });
    }

    const owner = await User.findById(req.user._id);

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    if (owner.kyc.status !== "approved") {
      return res.status(403).json({ message: "KYC not approved yet by Admin" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
