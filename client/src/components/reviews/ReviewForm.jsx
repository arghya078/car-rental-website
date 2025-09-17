import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import RatingBoxes from './RatingBoxes';
import { useSelector, useDispatch } from 'react-redux';
import { postReviewThunk, getMyReviewThunk } from '../../features/reviews/reviewThunks';
import { clearPostState } from '../../features/reviews/reviewSlice';
import { useNavigate } from 'react-router-dom';

export default function ReviewForm({ onPosted }) {
  const { user } = useSelector((s) => s.auth || {});
  const {
    postLoading,
    postError,
    postSuccess,
    myReview,
    myReviewLoading,
    myReviewError,
  } = useSelector((s) => s.reviews || {});
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const lastSavedRef = useRef(null);

  const rawMyReview = (() => {
    if (!myReview) return null;
    if (typeof myReview === 'object' && myReview.review) return myReview.review;
    return myReview;
  })();

  const normalizedMyReview = (() => {
    if (!rawMyReview || !user) return null;

    const rid = rawMyReview.reviewerId;
    let ridStr = '';

    try {
      if (!rid) {
        ridStr = '';
      } else if (typeof rid === 'string') {
        ridStr = rid;
      } else if (rid._id) {
        ridStr = String(rid._id);
      } else if (rid.toString) {
        ridStr = String(rid.toString());
      } else {
        ridStr = String(rid);
      }
    } catch (e) {
      console.warn('normalizeMyReview id error:', e);
      ridStr = String(rid || '');
    }

    const userIdStr = String(user._id ?? user.id ?? '');

    return ridStr === userIdStr ? rawMyReview : null;
  })();

  useEffect(() => {
    if (user) dispatch(getMyReviewThunk());
  }, [user, dispatch]);

  useEffect(() => {
    if (normalizedMyReview) {
      setRating(normalizedMyReview.rating || 0);
      setDescription(normalizedMyReview.description || '');
      lastSavedRef.current = normalizedMyReview;
    } else {
      setRating(0);
      setDescription('');
      lastSavedRef.current = null;
    }
  }, [normalizedMyReview]);

  useEffect(() => {
    if (postSuccess) {
      dispatch(getMyReviewThunk());
      onPosted && onPosted();

      const t = setTimeout(() => dispatch(clearPostState()), 1400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postSuccess]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!rating || rating < 1 || rating > 10) {
      alert('Please select a rating between 1 and 10');
      return;
    }
    dispatch(postReviewThunk({ rating, description }));
  };

  const handleCancel = () => {
    const r = lastSavedRef.current;
    if (r) {
      setRating(r.rating || 0);
      setDescription(r.description || '');
    } else {
      setRating(0);
      setDescription('');
    }
  };

  const allowedRoles = ['customer', 'owner'];
  const canPost = user && allowedRoles.includes(user.role);

  const hasReview = Boolean(normalizedMyReview && (normalizedMyReview._id || normalizedMyReview.id));

  const createdAt = normalizedMyReview?.createdAt ? new Date(normalizedMyReview.createdAt) : null;
  const updatedAt = normalizedMyReview?.updatedAt ? new Date(normalizedMyReview.updatedAt) : null;
  const wasEdited = createdAt && updatedAt && updatedAt.getTime() !== createdAt.getTime();

  const charLeft = 1000 - (description?.length || 0);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.995 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18 }}
      className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-gray-50"
    >
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="guest"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="text-center"
          >
            <h3 className="text-lg font-semibold mb-2">Leave a review</h3>
            <p className="text-sm text-gray-600 mb-4">Sign in to view ratings and post your review.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate('/signin')}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white shadow-sm hover:brightness-95"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2 rounded-md border shadow-sm hover:bg-gray-50"
              >
                Sign up
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ when: 'beforeChildren', staggerChildren: 0.03 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{hasReview ? 'Edit your review' : 'Leave a review'}</h3>

              <div className="flex items-center gap-3">
                {postLoading && <div className="text-sm text-gray-500">Saving...</div>}
                {postSuccess && <div className="text-sm text-green-600">Saved</div>}
                {postError && <div className="text-sm text-red-600">{postError.message || postError}</div>}
              </div>
            </div>

            {user && !canPost && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-700">
                Only customers or owners can post reviews.
              </motion.div>
            )}

            {hasReview && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-gray-50 border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{normalizedMyReview.reviewerName}</div>
                    <div className="text-xs text-gray-500">{normalizedMyReview.reviewerRole}</div>
                  </div>
                  <div className="text-lg font-semibold">{normalizedMyReview.rating}/10</div>
                </div>

                {normalizedMyReview.description && <p className="mt-2 text-sm text-gray-700">{normalizedMyReview.description}</p>}

                <div className="mt-2 text-xs text-gray-500">
                  {createdAt && <span>Posted: {createdAt.toLocaleString()}</span>}
                  {wasEdited && <span className="ml-3">Edited: {updatedAt.toLocaleString()}</span>}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <RatingBoxes value={rating} onChange={setRating} disabled={!canPost || postLoading} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
              <textarea
                rows={4}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-3 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Share your feedback..."
                disabled={!canPost || postLoading}
              />
              <div className="mt-1 text-xs text-gray-400 flex items-center justify-between">
                <div>{charLeft} characters left</div>
                <div>
                  {myReviewLoading && <span className="text-gray-500">Loading your review...</span>}
                </div>
              </div>
            </motion.div>

            <motion.div className="flex items-center gap-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <button
                type="submit"
                disabled={!canPost || postLoading}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50 shadow-sm hover:brightness-95"
              >
                {postLoading ? 'Saving...' : hasReview ? 'Update review' : 'Post review'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={postLoading}
                className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <div className="flex-1" />

              <div className="text-sm text-gray-500">
                {postError && <span className="text-red-600">{postError.message || postError}</span>}
                {myReviewError && <span className="text-red-600">{myReviewError.message || myReviewError}</span>}
              </div>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

ReviewForm.propTypes = {
  onPosted: PropTypes.func,
};
