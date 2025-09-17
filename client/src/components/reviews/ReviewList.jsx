
import React from 'react';
import ReviewCard from './ReviewCard';

export default function ReviewList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return <div className="text-sm text-gray-600">No reviews found.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {reviews.map((r) => (
        <ReviewCard key={r._id} review={r} />
      ))}
    </div>
  );
}
