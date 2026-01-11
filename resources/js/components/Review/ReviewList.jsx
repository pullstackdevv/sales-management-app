import React from 'react';
import StarRating from './StarRating';
import { Icon } from '@iconify/react';

export default function ReviewList({ reviews, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icon icon="mdi:loading" className="text-4xl text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:comment-text-outline" className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada review untuk produk ini</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">
                  {review.customer?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>

            {/* Review Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {review.customer?.name || 'Anonymous'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              {review.review_text && (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {review.review_text}
                </p>
              )}

              {/* Verified Purchase Badge */}
              <div className="flex items-center gap-2 mt-3">
                <Icon icon="mdi:check-decagram" className="text-green-500" />
                <span className="text-xs text-gray-600">Verified Purchase</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
