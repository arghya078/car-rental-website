const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { isApprovedOwner, isAdmin } = require("../middlewares/roleMiddleware");
const {
  addCar,
  getCarsForCustomers,
  getCarsForOwner,
  getCarsForAdmin,
  getCarById,
  updateCar,
  deleteCar,
  searchCars
} = require("../controllers/carController");
const upload = require("../middlewares/uploadMiddleware");

// Customer Routes
router.get("/customer/getAll", getCarsForCustomers); 

// Owners see only their cars
router.get("/owner/getAll", protect, isApprovedOwner, getCarsForOwner); 


//  CRUD for owners & Admin update and delete car
router.post("/add", protect, isApprovedOwner, upload.array("images", 3), addCar);
router.put("/update/:id", protect, upload.array("images", 3), updateCar);
router.delete("/delete/:id", protect, deleteCar);

// Admin can see all cars
router.get("/admin/getAll", protect, isAdmin, getCarsForAdmin);

// Common
router.get("/:id", getCarById);

// customer search
router.get("/customer/search", searchCars);


module.exports = router;
