import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteReviewThunk } from '../../features/reviews/reviewThunks';

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch (e) {
    console.warn('formatDate error:', e);
    return iso;
  }
}

const ratingColor = (r) => {
  if (!r && r !== 0) return 'bg-gray-100 text-gray-700';
  if (r <= 3) return 'bg-red-600 text-white';
  if (r <= 7) return 'bg-yellow-400 text-black';
  return 'bg-emerald-600 text-white';
};

export default function ReviewCard({ review }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});
  const { deleteLoading } = useSelector((s) => s.reviews || {});

  const isAdmin = user && user.role === 'admin';
  const isGuest = !user;

  const handleDelete = () => {
    if (!window.confirm('Delete this review? This action cannot be undone.')) return;
    dispatch(deleteReviewThunk(review._id));
  };

  return (
    <AnimatePresence>
      <motion.article
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        whileHover={{ translateY: -6, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        role="article"
        aria-label={`Review by ${review.reviewerName}`}
      >
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-700">
              {review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : '?'}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-800">{review.reviewerName}</div>
                  {review.reviewerRole && (
                    <div className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">{review.reviewerRole}</div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</div>
              </div>

              <div className="text-right">
                {isGuest ? (
                  <div className="text-xs text-gray-400 italic">Sign in to see rating</div>
                ) : (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold ${ratingColor(review.rating)}`}>
                    <span className="text-sm">{review.rating}</span>
                    <span className="text-xs/90">/10</span>
                  </div>
                )}
              </div>
            </div>

            {review.description && (
              <p className="mt-3 text-gray-700 leading-relaxed text-sm">{review.description}</p>
            )}

            {isAdmin && (
              <div className="mt-4 flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  aria-disabled={deleteLoading}
                  className="text-sm text-red-600 hover:underline"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete review'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(review._id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                  title="Copy review id"
                >
                  Copy ID
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.article>
    </AnimatePresence>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    reviewerName: PropTypes.string,
    reviewerRole: PropTypes.string,
    createdAt: PropTypes.string,
    rating: PropTypes.number,
    description: PropTypes.string,
  }).isRequired,
};
