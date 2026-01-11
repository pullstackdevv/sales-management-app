import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import TableComponent from "../../components/ui/table/TableComponent";
import { Button, Badge, Modal, Textarea } from "flowbite-react";
import api from "@/api/axios";
import Swal from "sweetalert2";
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load reviews',
      });
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
    const result = await Swal.fire({
      title: 'Approve Review?',
      text: 'This review will be visible on the storefront',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await api.post(`/reviews/${reviewId}/approve`);
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Approved!',
            text: 'Review has been approved',
            timer: 2000,
            showConfirmButton: false
          });
          fetchReviews();
          fetchStatistics();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to approve review',
        });
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
      const response = await api.post(`/reviews/${selectedReview.id}/reject`, {
        rejection_reason: rejectionReason
      });
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Rejected!',
          text: 'Review has been rejected',
          timer: 2000,
          showConfirmButton: false
        });
        setShowRejectModal(false);
        fetchReviews();
        fetchStatistics();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to reject review',
      });
    }
  };

  const handleDelete = async (reviewId) => {
    const result = await Swal.fire({
      title: 'Delete Review?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await api.delete(`/reviews/${reviewId}`);
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Review has been deleted',
            timer: 2000,
            showConfirmButton: false
          });
          fetchReviews();
          fetchStatistics();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to delete review',
        });
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
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'success', label: 'Approved' },
      rejected: { color: 'failure', label: 'Rejected' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge color={config.color}>{config.label}</Badge>;
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
          <Button
            size="xs"
            color="light"
            onClick={() => openDetailModal(review)}
          >
            <Icon icon="mdi:eye" className="text-lg" />
          </Button>
          
          {review.status === 'pending' && hasPermission('reviews.approve') && (
            <>
              <Button
                size="xs"
                color="success"
                onClick={() => handleApprove(review.id)}
              >
                <Icon icon="mdi:check" className="text-lg" />
              </Button>
              <Button
                size="xs"
                color="failure"
                onClick={() => openRejectModal(review)}
              >
                <Icon icon="mdi:close" className="text-lg" />
              </Button>
            </>
          )}
          
          {hasPermission('reviews.delete') && (
            <Button
              size="xs"
              color="failure"
              onClick={() => handleDelete(review.id)}
            >
              <Icon icon="mdi:delete" className="text-lg" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
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
                <p className="text-2xl font-bold">{statistics.average_rating?.toFixed(1) || '0.0'}</p>
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
      <TableComponent
        columns={columns}
        data={reviews}
        loading={loading}
        error={error}
      />

      {/* Detail Modal */}
      <Modal show={showDetailModal} onClose={() => setShowDetailModal(false)} size="2xl">
        <Modal.Header>Review Detail</Modal.Header>
        <Modal.Body>
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
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <Modal.Header>Reject Review</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to reject this review?
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (Optional)
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={handleReject}>
            Reject Review
          </Button>
          <Button color="gray" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
