import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewList from '../../components/reviews/ReviewList';
import Pagination from '../../components/ui/Pagination';
import { fetchReviews, fetchPublicReviews } from '../../features/reviews/reviewThunks';

export default function Reviews() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});
  const { list, totalPages, loading, error } = useSelector((s) => s.reviews || {});

  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadPage = useCallback(
    (p = 1) => {
      setCurrentPage(p);
      if (user) {
        dispatch(fetchReviews(p));
      } else {
        dispatch(fetchPublicReviews(p));
      }
    },
    [dispatch, user]
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage, refreshKey]);

  const handlePosted = () => {
    // refresh current page (use a refreshKey to guarantee useEffect runs)
    setRefreshKey((k) => k + 1);
    // also re-load explicitly to avoid a one-frame delay
    loadPage(currentPage);
  };

  const handleRetry = () => {
    loadPage(currentPage);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.03 } },
  };

  const skeletons = Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="w-full p-4 rounded-lg bg-white border border-gray-100 shadow-sm">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3 animate-pulse" />
      <div className="h-3 bg-gray-200 rounded w-1/4 mb-2 animate-pulse" />
      <div className="h-12 bg-gray-200 rounded w-full mt-2 animate-pulse" />
    </div>
  ));

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold"
        >
          Reviews
        </motion.h2>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-gray-600">
          {user ? 'Showing private & moderated reviews' : 'Showing public reviews'}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            {loading && (
              <div className="space-y-3">{skeletons}</div>
            )}

            {!loading && error && (
              <div className="p-4 rounded bg-red-50 border border-red-100 text-red-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Unable to load reviews</div>
                    <div className="text-sm mt-1">{typeof error === 'string' ? error : error.message || ''}</div>
                  </div>
                  <div>
                    <button onClick={handleRetry} className="px-3 py-1 bg-red-600 text-white text-sm rounded">
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-4">
                <AnimatePresence>
                  <ReviewList reviews={list} />
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <div className="mt-4">
            <Pagination page={currentPage} totalPages={totalPages} onChange={(p) => loadPage(p)} />
          </div>
        </div>

        <aside>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="sticky top-6">
            <ReviewForm onPosted={handlePosted} />

            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm text-sm">
              <div className="font-medium mb-2">Tips</div>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Be specific — mention what you liked or what could improve</li>
                <li>Ratings are from 1 (poor) to 10 (excellent)</li>
                <li>You can edit your review after posting</li>
              </ul>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}

Reviews.propTypes = {};
