require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { connectDB } = require("./config/db");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");

// Controllers
const paymentController = require("./controllers/paymentController");

// Routes 
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const carRoutes = require("./routes/carRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");


const app = express();

// Connect DB
connectDB();

const missingEnv = [];
if (!process.env.PAYPAL_CLIENT_ID) missingEnv.push("PAYPAL_CLIENT_ID");
if (!process.env.PAYPAL_CLIENT_SECRET) missingEnv.push("PAYPAL_CLIENT_SECRET");
if (!process.env.PAYPAL_MODE) {
  
  console.info("PAYPAL_MODE not set, defaulting to 'sandbox'.");
}

if (missingEnv.length > 0) {
  console.warn(
    "WARNING: Missing required PayPal environment variables:",
    missingEnv.join(", "),
    "\nYou can continue in sandbox (no merchant actions will work without credentials)."
  );
}
// Payment webhook
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentController.confirmPayment
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: true,  
    credentials: true,
  })
);


app.use(helmet());
app.use(morgan("dev"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);


app.get("/", (req, res) => {
  res.send("Car Rental API is running...");
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

// server
const PORT = 8000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  if (process.env.PAYPAL_MODE) {
    console.log(`PayPal mode: ${process.env.PAYPAL_MODE}`);
  }
});

// shutdown
let shuttingDown = false;
const shutdown = (err) => {
  if (shuttingDown) return;
  shuttingDown = true;

  if (err) {
    console.error("Shutdown triggered by error:", err && err.stack ? err.stack : err);
  } else {
    console.log("Shutdown initiated.");
  }

  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(err ? 1 : 0);
  });

  // Force exit 
  setTimeout(() => {
    console.error("Forcing shutdown after timeout.");
    process.exit(1);
  }, 10_000).unref();
};

// Safety
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  shutdown(reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err && err.stack ? err.stack : err);
  shutdown(err);
});

process.on("SIGTERM", () => {
  console.info("SIGTERM received. Shutting down gracefully.");
  shutdown();
});

module.exports = app;
