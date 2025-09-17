
const Car = require("../models/Car");
const { uploadToCloudinary, removeFromCloudinary } = require("../utils/cloudinary");
const fs = require("fs");
const path = require("path");
// maximum images per car
const MAX_IMAGES = 3; 

// helper
function safeParseJson(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return [];
  }
}
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ✅ Add a new car
exports.addCar = async (req, res) => {
  try {
    const {
      brand,
      model,
      year,
      type,
      rentalPricePerDay,
      pickupLocation,
      seatingCapacity,
      description, 
    } = req.body;

    if (!brand || !model || !year || !type || !rentalPricePerDay || !pickupLocation || !seatingCapacity) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    const isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable === "true" : true;

    // Upload images to Cloudinary
    const imageUrls = [];
    const files = Array.isArray(req.files) ? req.files : (req.files?.images || Object.values(req.files || {}).flat());

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const uploaded = await uploadToCloudinary(file.path, "car-rental/cars");
          imageUrls.push({
            url: uploaded?.url ?? null,
            public_id: uploaded?.public_id ?? null,
          });
        } catch (err) {
          console.error("Failed to upload car image:", err?.message || err);
          return res.status(500).json({ message: "Failed to upload one of the images", error: err?.message || err });
        } finally {
          // cleanup local file if used
          try {
            if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
          } catch (e) {
            // ignore cleanup errors
          }
        }
      }
    }

    const newCar = new Car({
      owner: req.user._id,
      brand,
      model,
      year: Number(year),
      type,
      rentalPricePerDay: Number(rentalPricePerDay),
      pickupLocation,
      seatingCapacity: Number(seatingCapacity),
      description: description || "",
      isAvailable,
      images: imageUrls,
    });

    await newCar.save();

    res.status(201).json({ message: "Car added successfully", car: newCar });
  } catch (err) {
    console.error("addCar error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err?.message || err });
  }
};

// Update car (Owner or Admin) 
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    // ownership or admin role
    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const removedImages = safeParseJson(req.body.removedImages); 
     // updated fields
    const fields = [
      "brand",
      "model",
      "year",
      "type",
      "rentalPricePerDay",
      "pickupLocation",
      "seatingCapacity",
      "description",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (["year", "rentalPricePerDay", "seatingCapacity"].includes(field)) {
          car[field] = Number(req.body[field]);
        } else {
          car[field] = req.body[field];
        }
      }
    });

    if (req.body.isAvailable !== undefined) {
      car.isAvailable = req.body.isAvailable === "true";
    }
    const currentImages = Array.isArray(car.images) ? car.images.slice() : [];
    const imagesToKeep = [];
    const imagesToDelete = [];

    for (const img of currentImages) {
      const publicId = img?.public_id ?? img?.publicId ?? img?.id ?? null;
      const url = img?.url ?? img;
      const candidates = [publicId, url].filter(Boolean).map(String);

      const shouldRemove = removedImages.some((r) => {
        if (!r) return false;
        const rs = String(r);
        if (candidates.includes(rs)) return true;
        if (url && rs === String(url)) return true;
        return false;
      });

      if (shouldRemove) {
        imagesToDelete.push({ img, publicId, url });
      } else {
        imagesToKeep.push(img);
      }
    }

    const warnings = [];

    // Delete matched images from Cloudinary
    for (const item of imagesToDelete) {
      const arg = item.publicId || item.public_id || item.url || (item.img && (item.img.public_id ?? item.img.url)) || null;
      if (!arg) continue;
      try {
        await removeFromCloudinary(arg);
      } catch (err) {
        warnings.push(`Failed to remove image ${arg}: ${err?.message || err}`);
        console.warn(`removeFromCloudinary failed for ${arg}:`, err);
      }
    }

    car.images = imagesToKeep;

    // add new images
    const allowedNew = Math.max(0, MAX_IMAGES - car.images.length);
    const files = Array.isArray(req.files) ? req.files : (req.files?.images || Object.values(req.files || {}).flat());
    const incomingFiles = Array.isArray(files) ? files : [];

    let filesToProcess = incomingFiles.slice(0, allowedNew);
    if (incomingFiles.length > allowedNew) {
      warnings.push(`Only ${allowedNew} of ${incomingFiles.length} uploaded files were accepted (max total images ${MAX_IMAGES}).`);
      
    }

    for (const file of filesToProcess) {
      try {
        const uploaded = await uploadToCloudinary(file.path, "car-rental/cars");
        car.images.push({
          url: uploaded?.url ?? null,
          public_id: uploaded?.public_id ?? null,
        });
      } catch (err) {
        warnings.push(`Failed to upload file ${file?.originalname || file?.filename || "unknown"}: ${err?.message || err}`);
        console.error("Failed to upload new car image:", err?.message || err);
      } finally {
        try {
          if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (e) {
          // ignore 
        }
      }
    }

    await car.save();

    const responsePayload = { message: "Car updated successfully", car };
    if (warnings.length) responsePayload.warnings = warnings;

    res.json(responsePayload);
  } catch (err) {
    console.error("updateCar error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err?.message || err });
  }
};

// Delete car (Owner or Admin)
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    // Check ownership or admin role
    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete images from Cloudinary 
    if (Array.isArray(car.images)) {
      for (const img of car.images) {
        try {
          if (img?.public_id || img?.url) {
            await removeFromCloudinary(img.public_id ?? img.url);
          }
        } catch (err) {
          console.warn("Failed to remove car image from Cloudinary:", err?.message || err);
          
        }
      }
    }

    await car.deleteOne();
    res.json({ message: "Car deleted successfully" });
  } catch (err) {
    console.error("deleteCar error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err?.message || err });
  }
};

// Get all cars for customers
exports.getCarsForCustomers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.availableOnly === "true") {
      filter.isAvailable = true;
    }

    const cars = await Car.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
        },
      },
      { $unwind: "$ownerDetails" },
      {
        $project: {
          brand: 1,
          model: 1,
          year: 1,
          type: 1,
          rentalPricePerDay: 1,
          pickupLocation: 1,
          seatingCapacity: 1,
          images: 1,
          isAvailable: 1,
          description: 1,
          "ownerDetails.name": 1,
          "ownerDetails.email": 1,
          "ownerDetails.phone": 1,
          "ownerDetails.address": 1,
        },
      },
    ]);

    res.json(cars);
  } catch (err) {
    console.error("getCarsForCustomers error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err?.message || err });
  }
};

// Owners can see all their cars
exports.getCarsForOwner = async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user._id });
    res.json(cars);
  } catch (err) {
    console.error("getCarsForOwner error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err?.message || err });
  }
};

// Admin: Get all cars
exports.getCarsForAdmin = async (req, res) => {
  try {
    const cars = await Car.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
        },
      },
      { $unwind: "$ownerDetails" },
      {
        $project: {
          brand: 1,
          model: 1,
          year: 1,
          type: 1,
          rentalPricePerDay: 1,
          pickupLocation: 1,
          seatingCapacity: 1,
          images: 1,
          isAvailable: 1,
          description: 1,
          "ownerDetails.name": 1,
          "ownerDetails.email": 1,
          "ownerDetails.role": 1,
        },
      },
    ]);

    res.json(cars);
  } catch (err) {
    console.error("getCarsForAdmin error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err?.message || err });
  }
};

// Get car by ID
exports.getCarById = async (req, res) => {
  try {
    // Populate owner with phone and address (and profilePic)
    const car = await Car.findById(req.params.id).populate("owner", "name email phone address profilePic");
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json(car);
  } catch (err) {
    console.error("getCarById error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err?.message || err });
  }
};

// Search & filter cars
exports.searchCars = async (req, res) => {
  try {
    let filter = { isAvailable: true };

    // free-text query 'q' -> search across multiple fields (brand, model, type, owner name)
    if (req.query.q && String(req.query.q).trim()) {
      const term = escapeRegex(String(req.query.q).trim());
      const re = new RegExp(term, "i");
      filter.$or = [
        { brand: re },
        { model: re },
        { type: re },
        // owner name is in referenced user collection; perform a lookup-based query later if needed
      ];
    } else {
      // legacy per-field filters (kept for backward compatibility)
      if (req.query.location) {
        filter.pickupLocation = { $regex: req.query.location, $options: "i" };
      }
      if (req.query.brand) {
        filter.brand = { $regex: req.query.brand, $options: "i" };
      }
      if (req.query.model) {
        filter.model = { $regex: req.query.model, $options: "i" };
      }
      if (req.query.type) {
        // allow partial/type-insensitive match too
        filter.type = { $regex: req.query.type, $options: "i" };
      }
    }

    // seatingCapacity 
    if (req.query.seatingCapacity) {
      const sc = Number(req.query.seatingCapacity);
      if (!Number.isNaN(sc)) filter.seatingCapacity = sc;
    }

    // price range
    if (req.query.minPrice || req.query.maxPrice) {
      filter.rentalPricePerDay = {};
      if (req.query.minPrice) {
        const mn = Number(req.query.minPrice);
        if (!Number.isNaN(mn)) filter.rentalPricePerDay.$gte = mn;
      }
      if (req.query.maxPrice) {
        const mx = Number(req.query.maxPrice);
        if (!Number.isNaN(mx)) filter.rentalPricePerDay.$lte = mx;
      }
      
      if (Object.keys(filter.rentalPricePerDay).length === 0) delete filter.rentalPricePerDay;
    }

    // Sorting
    let sort = {};
    if (req.query.sortBy) {
      const order = req.query.order === "desc" ? -1 : 1;
      sort[req.query.sortBy] = order;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (req.query.q && String(req.query.q).trim()) {
      const term = escapeRegex(String(req.query.q).trim());
      const re = new RegExp(term, "i");

      const matchedUsers = await require("../models/User").find({ name: re }).select("_id").limit(200);
      const ownerIds = matchedUsers.map((u) => u._id);

      // if ownerIds found
      if (ownerIds.length) {
        filter.$or.push({ owner: { $in: ownerIds } });
      }

      const cars = await Car.find(filter).sort(sort).skip(skip).limit(limit);
      const total = await Car.countDocuments(filter);

      return res.json({
        total,
        page,
        pages: Math.ceil(total / limit),
        results: cars.length,
        cars,
      });
    }

    // Default 
    const cars = await Car.find(filter).sort(sort).skip(skip).limit(limit);
    const total = await Car.countDocuments(filter);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      results: cars.length,
      cars,
    });
  } catch (err) {
    console.error("searchCars error:", err?.message || err);
    res.status(500).json({ message: "Server error", error: err?.message || err });
  }
};
