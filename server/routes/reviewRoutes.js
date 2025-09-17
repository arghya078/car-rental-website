// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();

const {
  createReview,
  getReviews,
  deleteReview,
  getMyReview,
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// POST: create or update review (customer or owner)
router.post('/', protect, createReview);

// public reviews
router.get('/public', getReviews);

// get my review
router.get('/mine', protect, getMyReview);

// admin can get all reviews
router.get('/', protect, getReviews);

// admin can delete review
router.delete('/:id', protect, isAdmin, deleteReview);

module.exports = router;
