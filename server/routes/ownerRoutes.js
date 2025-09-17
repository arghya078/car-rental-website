const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { submitKyc } = require("../controllers/ownerController");

// Owner Upload KYC Docs
router.post(
  "/kyc",
  protect,
  upload.fields([
    { name: "govId", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "ownershipProof", maxCount: 1 },
  ]),
  submitKyc
);

module.exports = router;
