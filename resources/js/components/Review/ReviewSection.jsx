import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import ReviewList from './ReviewList';
import { Icon } from '@iconify/react';
import api from '@/api/axios';

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${productId}/reviews`);
      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setStats(response.data.data.stats);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ulasan Pelanggan</h2>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900">
                  {stats.average_rating ? Number(stats.average_rating).toFixed(1) : '0.0'}
                </div>
                <StarRating rating={stats.average_rating || 0} size="md" />
                <p className="text-sm text-gray-600 mt-2">
                  Berdasarkan {stats.total_reviews || 0} ulasan
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.rating_distribution[star] || 0;
                const percentage = stats.total_reviews > 0 
                  ? (count / stats.total_reviews) * 100 
                  : 0;
                
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {star} <Icon icon="mdi:star" className="inline text-yellow-400 text-sm" />
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Semua Ulasan ({stats?.total_reviews || 0})
        </h3>
        <ReviewList reviews={reviews} loading={loading} />
      </div>
    </div>
  );
}
