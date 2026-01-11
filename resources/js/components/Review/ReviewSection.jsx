import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import { Icon } from '@iconify/react';
import api from '@/api/axios';

export default function ReviewSection({ productId, customerId, orderId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (customerId) {
      checkCanReview();
    }
  }, [productId, customerId]);

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

  const checkCanReview = async () => {
    try {
      const response = await api.post('/reviews/can-review', {
        product_id: productId,
        customer_id: customerId,
        order_id: orderId,
      });
      if (response.data.success) {
        setCanReview(response.data.data.can_review);
      }
    } catch (err) {
      console.error('Failed to check review eligibility:', err);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    fetchReviews();
    checkCanReview();
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900">
                  {stats.average_rating.toFixed(1)}
                </div>
                <StarRating rating={stats.average_rating} size="md" />
                <p className="text-sm text-gray-600 mt-2">
                  Based on {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
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
                      {star} <Icon icon="mdi:star" className="inline text-yellow-400" />
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

        {/* Write Review Button */}
        {customerId && canReview && !showReviewForm && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon icon="mdi:pencil" className="text-xl" />
              Write a Review
            </button>
          </div>
        )}

        {/* Login Prompt */}
        {!customerId && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
              <Icon icon="mdi:information" className="text-blue-600 text-2xl flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Please <a href="/login" className="text-blue-600 hover:underline font-medium">login</a> to write a review
              </p>
            </div>
          </div>
        )}

        {/* Already Reviewed */}
        {customerId && !canReview && !showReviewForm && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <Icon icon="mdi:check-circle" className="text-green-600 text-2xl flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Thank you for your review! It will be displayed after admin approval.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          customerId={customerId}
          orderId={orderId}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Customer Reviews ({stats?.total_reviews || 0})
        </h3>
        <ReviewList reviews={reviews} loading={loading} />
      </div>
    </div>
  );
}
