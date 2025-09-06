import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { CheckCircle, Clock, XCircle, RefreshCw, ArrowLeft, CreditCard } from 'lucide-react';
import api from '@/api/axios';

export default function PaymentStatusCheckout({ orderNumber }) {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch payment status
  const fetchPaymentStatus = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const response = await api.get(`/payment/xendit/status/${orderNumber}`);

      if (response.data.status === 'success') {
        setPaymentData(response.data);
        setError(null);
      } else {
        setError('Gagal mengambil status pembayaran');
      }
    } catch (err) {
      console.error('Error fetching payment status:', err);
      setError('Terjadi kesalahan saat mengambil status pembayaran');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  // Auto refresh for pending payments
  useEffect(() => {
    fetchPaymentStatus();

    const interval = setInterval(() => {
      if (paymentData?.payment_status === 'pending') {
        fetchPaymentStatus(true);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [orderNumber, paymentData?.payment_status]);

  // Get status display info
  const getStatusInfo = () => {
    if (!paymentData) return null;

    const status = paymentData.payment_status;
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: 'Pembayaran Sedang Diproses',
          subtitle: 'Menunggu konfirmasi pembayaran',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
      case 'success':
      case 'paid':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'Pembayaran Berhasil',
          subtitle: 'Terima kasih! Pembayaran Anda telah dikonfirmasi',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'failed':
      case 'expired':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Pembayaran Gagal',
          subtitle: 'Pembayaran tidak dapat diproses',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      default:
        return {
          icon: <Clock className="w-16 h-16 text-gray-500" />,
          title: 'Status Tidak Diketahui',
          subtitle: 'Silakan hubungi customer service',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const handleBackToHome = () => {
    router.visit(route('marketplace.home'));
  };

  const handleRefresh = () => {
    fetchPaymentStatus(true);
  };

  if (loading) {
    return (
      <MarketplaceLayout>
        <Head title="Status Pembayaran" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat status pembayaran...</p>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  if (error) {
    return (
      <MarketplaceLayout>
        <Head title="Status Pembayaran" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <MarketplaceLayout>
      <Head title="Status Pembayaran" />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToHome}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kembali ke Beranda
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Status Pembayaran</h1>
          </div>

          {/* Status Card */}
          {statusInfo && (
            <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-8 mb-6`}>
              <div className="text-center">
                <div className="mb-4">
                  {statusInfo.icon}
                </div>
                <h2 className={`text-2xl font-bold ${statusInfo.textColor} mb-2`}>
                  {statusInfo.title}
                </h2>
                <p className={`${statusInfo.textColor} mb-4`}>
                  {statusInfo.subtitle}
                </p>
                
                {/* Auto refresh indicator for pending */}
                {paymentData.payment_status === 'pending' && (
                  <div className="flex items-center justify-center text-sm text-yellow-600">
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Memperbarui status...' : 'Status akan diperbarui otomatis'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Details */}
          {paymentData?.order && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Detail Pesanan
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nomor Pesanan</span>
                  <span className="font-medium">{paymentData.order.order_number}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pembayaran</span>
                  <span className="font-medium text-lg">
                    Rp {parseFloat(paymentData.order.total_price).toLocaleString('id-ID')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status Pembayaran</span>
                  <span className={`font-medium capitalize ${
                    paymentData.payment_status === 'pending' ? 'text-yellow-600' :
                    paymentData.payment_status === 'success' || paymentData.payment_status === 'paid' ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {paymentData.payment_status === 'pending' ? 'Menunggu' :
                     paymentData.payment_status === 'success' || paymentData.payment_status === 'paid' ? 'Berhasil' :
                     'Gagal'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status Xendit</span>
                  <span className="font-medium">{paymentData.xendit_status}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Pesanan</span>
                  <span className="font-medium">
                    {new Date(paymentData.order.ordered_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Memperbarui...' : 'Perbarui Status'}
            </button>
            
            <button
              onClick={handleBackToHome}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}