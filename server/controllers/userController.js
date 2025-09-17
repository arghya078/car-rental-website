
const User = require("../models/User");
const { uploadToCloudinary, removeFromCloudinary } = require("../utils/cloudinary");
const { updateProfileValidation } = require("../validations/userValidation");

// Get Profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hide KYC for non-owners
    if (user.role !== "owner") {
      user.kyc = undefined;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update Profile
const updateProfile = async (req, res, next) => {
  try {
    const { error } = updateProfileValidation(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, address, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields
    if (name) user.name = name;
    if (address) user.address = address;
    if (phone) user.phone = phone;

    
    user.documents = user.documents || {};

    
    if (req.files?.profilePic?.length) {
      const file = req.files.profilePic[0];
      const result = await uploadToCloudinary(file.path, "car-rental/profile-pics");

      // delete previous
      if (user.profilePic?.public_id || user.profilePic?.url) {
        try {
          await removeFromCloudinary(user.profilePic.public_id ?? user.profilePic.url);
        } catch (e) {
          console.warn("Failed to delete old profilePic:", e?.message || e);
        }
      }

      user.profilePic = { url: result?.url ?? null, public_id: result?.public_id ?? null };
    }

    // drivingLicense
    if (req.files?.drivingLicense?.length) {
      const file = req.files.drivingLicense[0];
      const result = await uploadToCloudinary(file.path, "car-rental/driving-licenses");

      if (user.documents?.drivingLicense?.public_id || user.documents?.drivingLicense?.url) {
        try {
          await removeFromCloudinary(user.documents.drivingLicense.public_id ?? user.documents.drivingLicense.url);
        } catch (e) {
          console.warn("Failed to delete old drivingLicense:", e?.message || e);
        }
      }

      user.documents.drivingLicense = { url: result?.url ?? null, public_id: result?.public_id ?? null };
    }

    // govId
    if (req.files?.govId?.length) {
      const file = req.files.govId[0];
      const result = await uploadToCloudinary(file.path, "car-rental/gov-ids");

      if (user.documents?.govId?.public_id || user.documents?.govId?.url) {
        try {
          await removeFromCloudinary(user.documents.govId.public_id ?? user.documents.govId.url);
        } catch (e) {
          console.warn("Failed to delete old govId:", e?.message || e);
        }
      }

      user.documents.govId = { url: result?.url ?? null, public_id: result?.public_id ?? null };
    }

    await user.save();

    const safeUser = (await User.findById(user._id).select("-password")).toObject();
    if (safeUser.role !== "owner") safeUser.kyc = undefined;

    res.json({ message: "Profile updated successfully", user: safeUser });
  } catch (error) {
    next(error);
  }
};

// Delete Profile
const deleteProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // delete cloudinary files
    try {
      if (user.profilePic?.public_id || user.profilePic?.url) {
        await removeFromCloudinary(user.profilePic.public_id ?? user.profilePic.url);
      }
    } catch (e) {
      console.warn("Error removing profilePic:", e?.message || e);
    }

    try {
      if (user.documents?.drivingLicense?.public_id || user.documents?.drivingLicense?.url) {
        await removeFromCloudinary(user.documents.drivingLicense.public_id ?? user.documents.drivingLicense.url);
      }
    } catch (e) {
      console.warn("Error removing drivingLicense:", e?.message || e);
    }

    try {
      if (user.documents?.govId?.public_id || user.documents?.govId?.url) {
        await removeFromCloudinary(user.documents.govId.public_id ?? user.documents.govId.url);
      }
    } catch (e) {
      console.warn("Error removing govId:", e?.message || e);
    }

    try {
      if (user.kyc?.ownershipProof?.public_id || user.kyc?.ownershipProof?.url) {
        await removeFromCloudinary(user.kyc.ownershipProof.public_id ?? user.kyc.ownershipProof.url);
      }
    } catch (e) {
      console.warn("Error removing ownershipProof:", e?.message || e);
    }

    await User.findByIdAndDelete(user._id);

    res.json({ message: "Profile and related files deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
};
