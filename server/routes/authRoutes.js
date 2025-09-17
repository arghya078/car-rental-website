const express = require("express");
const router = express.Router();
const forgotLimiter = require("../utils/rateLimit");
const { 
  registerUser, 
  loginUser, 
  verifyOtp, 
  resendOtp,   
  logoutUser, 
  forgotPassword, 
  resetPasswordWithOtp
} = require("../controllers/authController");

// user registration
router.post("/register", registerUser);

// user login
router.post("/login", loginUser);

// user logout
router.post("/logout", logoutUser);

// user verification through OTP
router.post("/verify-otp", verifyOtp);  

// resend OTP
router.post("/resend-otp", resendOtp);   

// forgot password
router.post("/forgot-password", forgotLimiter, forgotPassword);

// verify reset OTP and reset password
router.post("/reset-password-with-otp", forgotLimiter, resetPasswordWithOtp);

module.exports = router;

