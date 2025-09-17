
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    reviewerName: {
      type: String,
      required: true
    },
    reviewerRole: {
      type: String,
      required: true,
      enum: ['customer', 'owner', 'admin']
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    }
  },
  {
    timestamps: true 
  }
);

reviewSchema.index({ reviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
