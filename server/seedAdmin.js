// seedAdmin.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      return process.exit();
    }

    const admin = new User({
      name: "Anima",
      email: "aniama@gmail.com",
      password: "admin@123", // will be hashed if you use pre-save hook
      role: "admin",
      isVerified: true
    });

    await admin.save();
    console.log("✅ Admin created:", admin.email);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAdmin();
