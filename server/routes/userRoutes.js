const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/userController");

// User get his Profile 
router.get("/get-profile", protect, getProfile); 

// User can update his profile
router.put(
  "/update-profile",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "govId", maxCount: 1 },
  ]),
  updateProfile
); 

// User can delete his profile
router.delete("/delete-profile", protect, deleteProfile); // DELETE /api/users/delete-profile

module.exports = router;
