
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const Booking = require("../models/Booking");
const Car = require("../models/Car");
const { removeFromCloudinary } = require("../utils/cloudinary");

// Get full kyc details of a specific owner
exports.getOwnerKycById = async (req, res) => {
  try {
    const owner = await User.findById(req.params.id).select("name email kyc documents");
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    res.json({
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        documents: owner.documents,
        kyc: owner.kyc, // includes status + document URLs
      },
    });
  } catch (err) {
    console.error("getOwnerKycById error:", err?.message || err);
    res.status(500).json({ message: err.message });
  }
};

// Get all pending owners
exports.getPendingOwners = async (req, res) => {
  try {
    const pendingOwners = await User.find({ role: "owner", "kyc.status": "pending" }).select(
      "name email kyc createdAt documents"
    );
    res.json(pendingOwners);
  } catch (err) {
    console.error("getPendingOwners error:", err?.message || err);
    res.status(500).json({ message: err.message });
  }
};

// Approve Owner
exports.approveOwner = async (req, res) => {
  try {
    const owner = await User.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    owner.kyc = owner.kyc || {};
    owner.kyc.status = "approved";
    await owner.save();

    // Send email
    await sendEmail(
      owner.email,
      "✅ Profile Approved - Car Rental",
      `<h2>Hello ${owner.name},</h2>
       <p>Your profile has been <strong>approved</strong> by the admin. 🎉</p>
       <p>You can now list your cars for rental.</p>
       <br/>
       <p>Best Regards,<br/>Car Rental Team</p>`
    );

    res.json({ message: "Owner approved successfully, email sent", owner });
  } catch (err) {
    console.error("approveOwner error:", err?.message || err);
    res.status(500).json({ message: err.message });
  }
};

// ❌ Reject Owner
exports.rejectOwner = async (req, res) => {
  try {
    const reason = req.body?.reason || "Not specified";
    const owner = await User.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    // Ensure objects exist
    owner.documents = owner.documents || {};
    owner.kyc = owner.kyc || {};

    
    try {
      if (owner.documents?.govId?.public_id || owner.documents?.govId?.url) {
        await removeFromCloudinary(owner.documents.govId.public_id ?? owner.documents.govId.url);
      }
    } catch (e) {
      console.warn("Failed to remove owner govId:", e?.message || e);
    }

    try {
      if (owner.documents?.drivingLicense?.public_id || owner.documents?.drivingLicense?.url) {
        await removeFromCloudinary(owner.documents.drivingLicense.public_id ?? owner.documents.drivingLicense.url);
      }
    } catch (e) {
      console.warn("Failed to remove owner drivingLicense:", e?.message || e);
    }

    try {
      if (owner.kyc?.ownershipProof?.public_id || owner.kyc?.ownershipProof?.url) {
        await removeFromCloudinary(owner.kyc.ownershipProof.public_id ?? owner.kyc.ownershipProof.url);
      }
    } catch (e) {
      console.warn("Failed to remove owner ownershipProof:", e?.message || e);
    }
    // Clear document references
    owner.documents.govId = undefined;
    owner.documents.drivingLicense = undefined;
    owner.kyc.ownershipProof = undefined;

    owner.kyc.status = "rejected";
    owner.kyc.rejectionReason = reason;

    await owner.save();

    // Send email with rejection reason
    await sendEmail(
      owner.email,
      "❌ Profile Rejected - Car Rental",
      `<h2>Hello ${owner.name},</h2>
       <p>We are sorry, but your profile has been <strong>rejected</strong> by the admin.</p>
       <p><strong>Reason:</strong> ${owner.kyc.rejectionReason}</p>
       <p>Please reupload all required documents and submit for approval again.</p>
       <br/>
       <p>Best Regards,<br/>Car Rental Team</p>`
    );

    res.json({ message: "Owner rejected, all documents deleted (if possible), email sent", owner });
  } catch (err) {
    console.error("rejectOwner error:", err?.message || err);
    res.status(500).json({ message: err.message });
  }
};

// get all approved owners
exports.getApprovedOwners = async (req, res) => {
  try {
    const approvedOwners = await User.find({ role: "owner", "kyc.status": "approved" }).select(
      "name email documents kyc createdAt"
    );
    res.json(approvedOwners);
  } catch (err) {
    console.error("getApprovedOwners error:", err?.message || err);
    res.status(500).json({ message: err.message });
  }
};

// get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" }).select("-password");
    res.json(customers);
  } catch (err) {
    console.error("getAllCustomers error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// get full customer details
exports.getCustomerDetails = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select("-password");
    if (!customer || customer.role !== "customer") {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    console.error("getCustomerDetails error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// get all bookings of a customer
exports.getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.params.id }).populate("car").populate("owner", "name email");
    res.json(bookings);
  } catch (err) {
    console.error("getCustomerBookings error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("car")
      .populate("customer", "name email phone")
      .populate("owner", "name email");

    res.json({ bookings });
  } catch (err) {
    console.error("getAllBookings error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// delete a customer account
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer || customer.role !== "customer") {
      return res.status(404).json({ message: "Customer not found" });
    }

    try {
      if (customer.profilePic?.public_id || customer.profilePic?.url) {
        await removeFromCloudinary(customer.profilePic.public_id ?? customer.profilePic.url);
      }
    } catch (e) {
      console.warn("Failed to remove customer profilePic:", e?.message || e);
    }

    try {
      if (customer.documents?.govId?.public_id || customer.documents?.govId?.url) {
        await removeFromCloudinary(customer.documents.govId.public_id ?? customer.documents.govId.url);
      }
    } catch (e) {
      console.warn("Failed to remove customer govId:", e?.message || e);
    }

    try {
      if (customer.documents?.drivingLicense?.public_id || customer.documents?.drivingLicense?.url) {
        await removeFromCloudinary(customer.documents.drivingLicense.public_id ?? customer.documents.drivingLicense.url);
      }
    } catch (e) {
      console.warn("Failed to remove customer drivingLicense:", e?.message || e);
    }

    // delete customer bookings
    await Booking.deleteMany({ customer: customer._id });

    // delete account
    await customer.deleteOne();

    res.json({ message: "Customer account deleted successfully" });
  } catch (err) {
    console.error("deleteCustomer error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// admin can make any user an admin
exports.makeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "admin";
    user.isApproved = true;
    await user.save();

    res.json({ message: "User promoted to admin", user });
  } catch (err) {
    console.error("makeAdmin error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
