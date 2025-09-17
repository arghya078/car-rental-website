const User = require("../models/User");
const { generateJWT } = require("../utils/generateToken");
const { registerValidation, loginValidation } = require("../validations/authValidation");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// register User with OTP
const registerUser = async (req, res, next) => {
  try {
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    // OTP valid for 10 minutes
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    const user = await User.create({
      name,
      email,
      password,
      role,
      verificationToken: otp,
      verificationTokenExpires: otpExpires,
    });

    // Send OTP email
    await sendEmail(
      user.email,
      "Verify your email",
      `<p>Hi ${name},</p>
       <p>Your OTP for email verification is:</p>
       <h2>${otp}</h2>
       <p>This OTP is valid for 10 minutes.</p>`
    );

    res.status(201).json({
      message: "User registered successfully. Please check your email for the OTP.",
    });
  } catch (error) {
    next(error);
  }
};

// verify OTP
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      verificationToken: otp,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully. You can now login." });
  } catch (error) {
    next(error);
  }
};

// resend OTP
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    // generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    user.verificationToken = otp;
    user.verificationTokenExpires = otpExpires;
    await user.save();

    // send OTP email
    await sendEmail(
      user.email,
      "Resend OTP - Verify your email",
      `<p>Hi ${user.name},</p>
       <p>Your new OTP for email verification is:</p>
       <h2>${otp}</h2>
       <p>This OTP is valid for 10 minutes.</p>`
    );

    res.json({ message: "New OTP sent successfully" });
  } catch (error) {
    next(error);
  }
};

// login User
const loginUser = async (req, res, next) => {
  try {
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateJWT(user._id, user.role),
    });
  } catch (error) {
    next(error);
  }
};

// Logout User
const logoutUser = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// Forgot Password (sends OTP)
const forgotPassword = async (req, res, next) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    email = email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationToken = otp;
    user.verificationTokenExpires = otpExpires;
    await user.save();

    // send OTP to user email
    await sendEmail(
      user.email,
      "Your password reset OTP",
      `<p>Hi ${user.name || "User"},</p>
       <p>Your password reset OTP is:</p>
       <h2>${otp}</h2>
       <p>This OTP is valid for 10 minutes.</p>`
    );

    return res.json({ message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
};

// Reset Password with OTP
const resetPasswordWithOtp = async (req, res, next) => {
  try {
    let { email, otp, password, confirmPassword } = req.body;
    if (!email || !otp || !password || !confirmPassword) {
      return res.status(400).json({ message: "Email, OTP and passwords are required" });
    }

    email = email.toLowerCase();

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({
      email,
      verificationToken: otp,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    // Update password 
    user.password = password;

    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    try {
      await sendEmail(
        user.email,
        "Your password has been changed",
        `<p>Hi ${user.name || "User"},</p>
         <p>Your password has been changed successfully. If you did not perform this action, contact support immediately.</p>`
      );
    } catch (emailErr) {
      console.error("Password change confirmation email failed:", emailErr);
    }

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPasswordWithOtp
};
