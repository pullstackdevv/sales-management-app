// resources/js/components/ui/card/VoucherCard.jsx
import React from 'react';
import { Icon } from '@iconify/react';
import { formatRupiah, formatDate } from '../../../data/voucherData';

const VoucherCard = ({ voucher, onEdit, onView, onDelete }) => {
  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    if (status === 'active') {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else if (status === 'expired') {
      return `${baseClasses} bg-red-100 text-red-800`;
    } else {
      return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeBadge = (type) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded";
    if (type === 'percentage') {
      return `${baseClasses} bg-blue-100 text-blue-800`;
    } else {
      return `${baseClasses} bg-purple-100 text-purple-800`;
    }
  };

  const usagePercentage = (voucher.used_count / voucher.usage_limit) * 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{voucher.name}</h3>
              <span className={getStatusBadge(voucher.status)}>
                {voucher.status === 'active' ? 'Aktif' : 'Expired'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Kode: <span className="font-mono font-medium">{voucher.code}</span></p>
            <p className="text-sm text-gray-500">{voucher.description}</p>
          </div>
          <div className="flex gap-1 ml-4">
            <button
              onClick={() => onView && onView(voucher)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Lihat detail"
            >
              <Icon icon="solar:eye-outline" className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit && onEdit(voucher)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Edit voucher"
            >
              <Icon icon="solar:pen-outline" className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete && onDelete(voucher)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Hapus voucher"
            >
              <Icon icon="solar:trash-bin-minimalistic-outline" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Discount Info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className={getTypeBadge(voucher.type)}>
              {voucher.type === 'percentage' ? 'Persentase' : 'Fixed'}
            </span>
            <div className="text-2xl font-bold text-gray-900">
              {voucher.type === 'percentage' ? `${voucher.value}%` : formatRupiah(voucher.value)}
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Min. Pembelian:</span>
            <span className="font-medium text-gray-900">{formatRupiah(voucher.min_purchase)}</span>
          </div>
          {voucher.max_discount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Max. Potongan:</span>
              <span className="font-medium text-gray-900">{formatRupiah(voucher.max_discount)}</span>
            </div>
          )}
        </div>

        {/* Usage Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Penggunaan:</span>
            <span className="font-medium text-gray-900">
              {voucher.used_count} / {voucher.usage_limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${usagePercentage >= 80 ? 'bg-red-500' : usagePercentage >= 60 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}></div>
          </div>
        </div>

        {/* Period */}
        <div className="text-xs text-gray-500">
          <div className="flex items-center gap-1 mb-1">
            <Icon icon="solar:calendar-outline" className="w-3 h-3" />
            <span>Berlaku: {formatDate(voucher.start_date)} - {formatDate(voucher.end_date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherCard;
