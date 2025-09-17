
const Review = require('../models/Review');

// Create or update a review
exports.createReview = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const { rating, description } = req.body;

    if (typeof rating === 'undefined') {
      return res.status(400).json({ message: 'Rating is required' });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 10) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 10' });
    }

    const allowed = ['customer', 'owner'];
    if (!allowed.includes(user.role)) {
      return res.status(403).json({ message: 'Only customers or owners can post reviews' });
    }

    // find existing review by this user
    let review = await Review.findOne({ reviewerId: user._id });

    if (review) {
      
      review.rating = parsedRating;
      review.description = description ? String(description).trim().slice(0, 1000) : '';
      review.reviewerName = user.name || user.fullName || user.email || 'Unknown';
      review.reviewerRole = user.role;
      await review.save();
      return res.json({ message: 'Review updated', review });
    } else {
      // Create new review
      review = new Review({
        reviewerId: user._id,
        reviewerName: user.name || user.fullName || user.email || 'Unknown',
        reviewerRole: user.role,
        rating: parsedRating,
        description: description ? String(description).trim().slice(0, 1000) : ''
      });
      await review.save();
      return res.status(201).json({ message: 'Review posted', review });
    }
  } catch (err) {
    console.error('createReview error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get paginated list of all reviews
exports.getReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      Review.countDocuments(),
      Review.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      page,
      totalPages,
      limit,
      total,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    console.error('getReviews error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get user's review

exports.getMyReview = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const review = await Review.findOne({ reviewerId: user._id }).lean();

    if (!review) {
      return res.status(404).json({ message: 'No review found' });
    }

    return res.json({ review });
  } catch (err) {
    console.error('getMyReview error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete a review by ID
exports.deleteReview = async (req, res, next) => {
  try {
    const id = req.params.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.deleteOne();
    return res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
