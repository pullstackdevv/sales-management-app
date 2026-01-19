import React from 'react';
import StarRating from './StarRating';
import { Icon } from '@iconify/react';

export default function ReviewList({ reviews, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icon icon="mdi:loading" className="text-4xl text-gray-600 animate-spin" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:comment-text-outline" className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada ulasan untuk produk ini</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="pb-6 border-b border-gray-100 last:border-b-0">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon icon="mdi:account" className="text-xl text-gray-500" />
              </div>
            </div>

            {/* Review Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <h4 className="font-medium text-gray-900 text-sm">
                  {review.customer?.name || 'Customer'}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              {review.review_text && (
                <p className="text-gray-700 text-sm leading-relaxed mt-2">
                  {review.review_text}
                </p>
              )}

              {/* Verified Purchase Badge */}
              <div className="flex items-center gap-1.5 mt-3">
                <Icon icon="mdi:check-decagram" className="text-sm text-green-600" />
                <span className="text-xs text-gray-600">Pembelian Terverifikasi</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
