import React, { useEffect, useState } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import api from "@/api/axios";
import { showSuccess, showError, showConfirm } from '@/utils/sweetalert';
import { useAuth } from "../../contexts/AuthContext";

export default function ReviewManagement() {
  const { hasPermission } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statistics, setStatistics] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    rating: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15,
  });

  useEffect(() => {
    fetchReviews();
    fetchStatistics();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await api.get(`/reviews?${params.toString()}`);
      if (response.data.success) {
        setReviews(response.data.data.data || []);
      }
    } catch (err) {
      setError(err.message);
      showError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/reviews/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleApprove = async (reviewId) => {
    const confirmed = await showConfirm(
      'Approve Review?',
      'This review will be visible on the storefront',
      'Yes, Approve',
      'Cancel'
    );

    if (confirmed) {
      try {
        console.log('Approving review:', reviewId);
        const response = await api.post(`/reviews/${reviewId}/approve`);
        console.log('Approve response:', response.data);
        if (response.data.success) {
          showSuccess('Review has been approved');
          fetchReviews();
          fetchStatistics();
        }
      } catch (err) {
        console.error('Approve error:', err);
        console.error('Error response:', err.response);
        showError(err.response?.data?.message || 'Failed to approve review');
      }
    }
  };

  const openRejectModal = (review) => {
    setSelectedReview(review);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedReview) return;

    try {
      console.log('Rejecting review:', selectedReview.id, 'Reason:', rejectionReason);
      const response = await api.post(`/reviews/${selectedReview.id}/reject`, {
        rejection_reason: rejectionReason
      });
      console.log('Reject response:', response.data);
      
      if (response.data.success) {
        showSuccess('Review has been rejected');
        setShowRejectModal(false);
        fetchReviews();
        fetchStatistics();
      }
    } catch (err) {
      console.error('Reject error:', err);
      console.error('Error response:', err.response);
      showError(err.response?.data?.message || 'Failed to reject review');
    }
  };

  const handleDelete = async (reviewId) => {
    const confirmed = await showConfirm(
      'Delete Review?',
      'This action cannot be undone',
      'Yes, Delete',
      'Cancel'
    );

    if (confirmed) {
      try {
        console.log('Deleting review:', reviewId);
        const response = await api.delete(`/reviews/${reviewId}`);
        console.log('Delete response:', response.data);
        if (response.data.success) {
          showSuccess('Review has been deleted');
          fetchReviews();
          fetchStatistics();
        }
      } catch (err) {
        console.error('Delete error:', err);
        console.error('Error response:', err.response);
        showError(err.response?.data?.message || 'Failed to delete review');
      }
    }
  };

  const openDetailModal = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            icon="mdi:star"
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}</span>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (review) => <span className="font-mono text-sm">#{review.id}</span>
    },
    {
      key: 'product',
      label: 'Product',
      render: (review) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{review.product?.name || '-'}</p>
          <p className="text-xs text-gray-500">SKU: {review.product?.sku || '-'}</p>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (review) => (
        <div>
          <p className="font-medium">{review.customer?.name || '-'}</p>
          <p className="text-xs text-gray-500">{review.customer?.email || '-'}</p>
        </div>
      )
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (review) => renderStars(review.rating)
    },
    {
      key: 'review_text',
      label: 'Review',
      render: (review) => (
        <div className="max-w-md">
          <p className="text-sm line-clamp-2">{review.review_text || '-'}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (review) => getStatusBadge(review.status)
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (review) => (
        <span className="text-sm">
          {new Date(review.created_at).toLocaleDateString('id-ID')}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (review) => (
        <div className="flex gap-2">
          <button
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            onClick={() => openDetailModal(review)}
            title="View Details"
          >
            <Icon icon="mdi:eye" className="text-lg" />
          </button>
          
          {review.status === 'pending' && hasPermission('reviews.approve') && (
            <>
              <button
                className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-100 rounded transition-colors"
                onClick={() => handleApprove(review.id)}
                title="Approve"
              >
                <Icon icon="mdi:check" className="text-lg" />
              </button>
              <button
                className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-colors"
                onClick={() => openRejectModal(review)}
                title="Reject"
              >
                <Icon icon="mdi:close" className="text-lg" />
              </button>
            </>
          )}
          
          {hasPermission('reviews.delete') && (
            <button
              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-colors"
              onClick={() => handleDelete(review.id)}
              title="Delete"
            >
              <Icon icon="mdi:delete" className="text-lg" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Management</h1>
          <p className="text-gray-600">Manage product reviews and ratings</p>
        </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold">{statistics.total_reviews}</p>
              </div>
              <Icon icon="mdi:star" className="text-3xl text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pending_reviews}</p>
              </div>
              <Icon icon="mdi:clock-outline" className="text-3xl text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{statistics.approved_reviews}</p>
              </div>
              <Icon icon="mdi:check-circle" className="text-3xl text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{statistics.rejected_reviews}</p>
              </div>
              <Icon icon="mdi:close-circle" className="text-3xl text-red-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {statistics.average_rating ? Number(statistics.average_rating).toFixed(1) : '0.0'}
                </p>
              </div>
              <Icon icon="mdi:star-half-full" className="text-3xl text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg border-gray-300"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="w-full rounded-lg border-gray-300"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
              className="w-full rounded-lg border-gray-300"
            >
              <option value="created_at">Date</option>
              <option value="rating">Rating</option>
              <option value="status">Status</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search review text..."
              className="w-full rounded-lg border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Icon icon="mdi:loading" className="text-4xl text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Icon icon="mdi:alert-circle" className="text-6xl text-red-300 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="mdi:comment-text-outline" className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    {columns.map((column, index) => (
                      <td key={index} className="px-6 py-4 whitespace-nowrap">
                        {column.render ? column.render(review) : review[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Review Detail</h3>
                  <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-500">
                    <Icon icon="mdi:close" className="text-2xl" />
                  </button>
                </div>
                {selectedReview && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                      <p className="text-gray-900">{selectedReview.product?.name}</p>
                      <p className="text-sm text-gray-500">SKU: {selectedReview.product?.sku}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                      <p className="text-gray-900">{selectedReview.customer?.name}</p>
                      <p className="text-sm text-gray-500">{selectedReview.customer?.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      {renderStars(selectedReview.rating)}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedReview.review_text || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      {getStatusBadge(selectedReview.status)}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Date</label>
                      <p className="text-gray-900">
                        {new Date(selectedReview.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    
                    {selectedReview.approved_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {selectedReview.status === 'approved' ? 'Approved' : 'Rejected'} Date
                        </label>
                        <p className="text-gray-900">
                          {new Date(selectedReview.approved_at).toLocaleString('id-ID')}
                        </p>
                        {selectedReview.approver && (
                          <p className="text-sm text-gray-500">By: {selectedReview.approver.name}</p>
                        )}
                      </div>
                    )}
                    
                    {selectedReview.rejection_reason && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                        <p className="text-gray-900">{selectedReview.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRejectModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Reject Review</h3>
                  <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-500">
                    <Icon icon="mdi:close" className="text-2xl" />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Are you sure you want to reject this review?
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (Optional)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleReject}
                >
                  Reject Review
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
