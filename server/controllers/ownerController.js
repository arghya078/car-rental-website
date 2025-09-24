const User = require("../models/User");
const {
  uploadBufferToCloudinary,
  removeFromCloudinary,
} = require("../utils/cloudinary");

async function uploadAndReplace(multerFile, oldFileRecord, folder = "car-rental/kyc") {
  if (!multerFile || !multerFile.buffer) {
    throw new Error("No file buffer to upload");
  }

  // remove old file by public id or url
  try {
    const oldPublicId = oldFileRecord?.public_id ?? oldFileRecord?.publicId ?? null;
    const oldUrl = oldFileRecord?.url ?? null;
    if (oldPublicId) {
      await removeFromCloudinary(oldPublicId).catch((e) => {
        console.warn("removeFromCloudinary(oldPublicId) failed:", e?.message || e);
      });
    } else if (oldUrl) {
      await removeFromCloudinary(oldUrl).catch((e) => {
        console.warn("removeFromCloudinary(oldUrl) failed:", e?.message || e);
      });
    }
  } catch (err) {
    console.warn("Failed to remove old cloudinary file:", err?.message || err);
  }

  // upload new file from buffer
  const result = await uploadBufferToCloudinary(multerFile.buffer, folder);
  return { url: result?.url ?? null, public_id: result?.public_id ?? null };
}

exports.submitKyc = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const files = req.files || {};

    user.documents = user.documents || {};
    user.kyc = user.kyc || {};

    // Gov ID
    if (files["govId"] && files["govId"][0]) {
      try {
        const newRec = await uploadAndReplace(
          files["govId"][0],
          user.documents?.govId,
          "car-rental/kyc/gov-ids"
        );
        user.documents.govId = newRec;
      } catch (e) {
        console.warn("govId upload/replace failed:", e?.message || e);
      }
    }

    // Driving license
    if (files["drivingLicense"] && files["drivingLicense"][0]) {
      try {
        const newRec = await uploadAndReplace(
          files["drivingLicense"][0],
          user.documents?.drivingLicense,
          "car-rental/kyc/driving-licenses"
        );
        user.documents.drivingLicense = newRec;
      } catch (e) {
        console.warn("drivingLicense upload/replace failed:", e?.message || e);
      }
    }

    // Ownership proof (owner-specific)
    if (files["ownershipProof"] && files["ownershipProof"][0]) {
      // make user an owner if not already
      if (user.role !== "owner") user.role = "owner";

      try {
        const newRec = await uploadAndReplace(
          files["ownershipProof"][0],
          user.kyc?.ownershipProof,
          "car-rental/kyc/ownership"
        );
        user.kyc.ownershipProof = newRec;

        // set/reset kyc status
        user.kyc.status = user.kyc?.status === "approved" ? "approved" : "pending";
        if (user.kyc.status === "pending") user.kyc.rejectionReason = undefined;
      } catch (e) {
        console.warn("ownershipProof upload/replace failed:", e?.message || e);
      }
    }

    await user.save();

    res.json({
      message:
        user.role === "owner"
          ? user.kyc.status === "pending"
            ? "Owner KYC submitted successfully. Awaiting admin approval."
            : "Owner KYC already approved, no need to resubmit."
          : "Customer documents uploaded successfully.",
      user,
    });
  } catch (error) {
    console.error("submitKyc error:", error?.message || error);
    res.status(500).json({ message: error?.message || "Server error" });
  }
};
