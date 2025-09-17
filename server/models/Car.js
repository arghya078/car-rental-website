const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    type: {
      type: String,
      enum: ["SUV", "Sedan", "Hatchback", "Coupe", "Truck"],
      required: true,
    },
    seatingCapacity: {
      type: Number,
      enum: [2, 4, 5, 6, 7, 8, 9], 
      required: true,
    },
    rentalPricePerDay: { type: Number, required: true },
    pickupLocation: { type: String, required: true },
    description: { type: String },

    images: [
      {
        url: { type: String, required: true }, 
        public_id: { type: String, required: true }, 
        _id: false 
      },
    ],

    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);
