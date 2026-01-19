import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { ArrowLeft, Star } from 'lucide-react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import customerSession from '@/utils/customerSession';
import api from '@/api/axios';
import Swal from 'sweetalert2';

export default function WriteReview() {
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [orderId, setOrderId] = useState(null);
    const [productId, setProductId] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const orderIdParam = urlParams.get('order_id');
        const productIdParam = urlParams.get('product_id');

        if (!orderIdParam || !productIdParam) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Parameter tidak lengkap',
            }).then(() => {
                router.visit('/myorder');
            });
            return;
        }

        setOrderId(orderIdParam);
        setProductId(productIdParam);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            Swal.fire('Error', 'Silakan pilih rating', 'error');
            return;
        }

        if (!productId || !orderId) {
            Swal.fire('Error', 'Data tidak lengkap', 'error');
            return;
        }

        const customer = customerSession.get();
        if (!customer || !customer.customer_id) {
            Swal.fire('Error', 'Silakan login terlebih dahulu', 'error');
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post('/reviews', {
                product_id: parseInt(productId),
                customer_id: customer.customer_id,
                order_id: parseInt(orderId),
                rating: rating,
                review_text: reviewText.trim() || null,
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Ulasan Anda berhasil dikirim dan menunggu persetujuan admin',
                    showConfirmButton: false,
                    timer: 2000
                }).then(() => {
                    router.visit('/myorder');
                });
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            Swal.fire(
                'Error',
                err.response?.data?.message || 'Gagal mengirim ulasan',
                'error'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!productId || !orderId) {
        return (
            <MarketplaceLayout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <Icon icon="line-md:loading-loop" className="text-4xl text-blue-500" />
                </div>
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-2xl mx-auto px-4">
                    {/* Header */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.visit('/myorder')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Kembali ke Pesanan Saya
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Tulis Ulasan</h1>
                        <p className="text-gray-600 mt-1">
                            Berikan penilaian Anda untuk produk ini
                        </p>
                    </div>

                    {/* Review Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
                        {/* Rating */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Rating Produk <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-10 h-10 ${
                                                star <= (hoverRating || rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <p className="text-sm text-gray-600 mt-2">
                                    {rating === 5 && 'Sangat Puas'}
                                    {rating === 4 && 'Puas'}
                                    {rating === 3 && 'Cukup'}
                                    {rating === 2 && 'Kurang Puas'}
                                    {rating === 1 && 'Tidak Puas'}
                                </p>
                            )}
                        </div>

                        {/* Review Text */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ulasan (Opsional)
                            </label>
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Ceritakan pengalaman Anda dengan produk ini..."
                                rows={6}
                                maxLength={1000}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {reviewText.length}/1000 karakter
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.visit('/myorder')}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || rating === 0}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Icon icon="line-md:loading-loop" className="text-xl" />
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="mdi:send" className="text-xl" />
                                        Kirim Ulasan
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
