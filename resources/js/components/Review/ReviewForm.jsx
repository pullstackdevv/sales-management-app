import React, { useState } from 'react';
import StarRating from './StarRating';
import { Button, Textarea } from 'flowbite-react';
import { Icon } from '@iconify/react';
import api from '@/api/axios';
import Swal from 'sweetalert2';

export default function ReviewForm({ productId, customerId, orderId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Rating Required',
        text: 'Please select a rating before submitting',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/reviews', {
        product_id: productId,
        customer_id: customerId,
        order_id: orderId,
        rating: rating,
        review_text: reviewText,
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Review Submitted!',
          text: 'Your review has been submitted and will be displayed after admin approval.',
          timer: 3000,
          showConfirmButton: false
        });

        // Reset form
        setRating(0);
        setReviewText('');

        // Callback
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Submit',
        text: err.response?.data?.message || 'Failed to submit review. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating *
          </label>
          <StarRating
            rating={rating}
            size="lg"
            interactive={true}
            onChange={setRating}
          />
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {rating === 5 && '⭐ Excellent!'}
              {rating === 4 && '👍 Very Good!'}
              {rating === 3 && '😊 Good'}
              {rating === 2 && '😐 Fair'}
              {rating === 1 && '😞 Poor'}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review (Optional)
          </label>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={5}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {reviewText.length}/1000 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            color="blue"
            disabled={loading || rating === 0}
            className="flex-1"
          >
            {loading ? (
              <>
                <Icon icon="mdi:loading" className="mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Icon icon="mdi:send" className="mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Icon icon="mdi:information" className="text-blue-600 text-lg flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Your review will be checked by our team before being published. 
              Please be honest and constructive in your feedback.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
