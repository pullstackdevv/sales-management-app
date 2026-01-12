import React, { useState } from 'react';
import StarRating from './StarRating';
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
        title: 'Rating Diperlukan',
        text: 'Silakan pilih rating sebelum mengirim ulasan',
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
          title: 'Ulasan Terkirim!',
          text: 'Ulasan Anda akan ditampilkan setelah disetujui admin.',
          timer: 3000,
          showConfirmButton: false
        });

        setRating(0);
        setReviewText('');

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: err.response?.data?.message || 'Gagal mengirim ulasan. Silakan coba lagi.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tulis Ulasan</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating Anda *
          </label>
          <StarRating
            rating={rating}
            size="lg"
            interactive={true}
            onChange={setRating}
          />
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {rating === 5 && '⭐ Sangat Bagus!'}
              {rating === 4 && '👍 Bagus!'}
              {rating === 3 && '😊 Cukup Baik'}
              {rating === 2 && '😐 Kurang'}
              {rating === 1 && '😞 Buruk'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ulasan Anda (Opsional)
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Bagikan pengalaman Anda dengan produk ini..."
            rows={5}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {reviewText.length}/1000 karakter
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || rating === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            loading || rating === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-800 text-white hover:bg-gray-900'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Icon icon="mdi:loading" className="animate-spin" />
              Mengirim...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Icon icon="mdi:send" />
              Kirim Ulasan
            </span>
          )}
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Icon icon="mdi:information" className="text-blue-600 text-lg flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Ulasan Anda akan ditinjau oleh tim kami sebelum dipublikasikan. 
              Mohon berikan ulasan yang jujur dan membangun.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
