import React, { useEffect, useState } from "react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import { useAuth } from "../../contexts/AuthContext";
import { router, usePage } from "@inertiajs/react";
import api from "@/api/axios";

const formatCurrency = (value) => {
  if (value == null) return "-";
  return `Rp ${parseFloat(value).toLocaleString('id-ID')}`;
};

const statusLabel = (status) => {
  const map = {
    pending: "Belum Bayar",
    processing: "Diproses",
    paid: "Dibayar",
    shipped: "Dikirim",
    delivered: "Diterima",
    cancelled: "Dibatalkan",
  };
  return map[status] || status || "-";
};

export default function CustomerDetail() {
  const { customerId } = usePage().props;
  const { hasPermission } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${customerId}`);
      setCustomer(res.data?.data || null);
      setError(null);
    } catch (e) {
      setError("Gagal memuat data customer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const getDefaultAddress = () => {
    if (!customer?.addresses || customer.addresses.length === 0) return null;
    return customer.addresses.find(a => a.is_default) || customer.addresses[0];
  };

  const addressToString = (addr) => {
    if (!addr) return "-";
    const parts = [addr.address_detail, addr.district, addr.city, addr.province];
    return parts.filter(Boolean).join(", ");
  };

  const openOrderDetail = (orderId) => {
    router.visit(`/cms/order/detail/${orderId}`);
  };

  const openEditCustomer = () => {
    router.visit(`/cms/customer/edit/${customerId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Icon icon="line-md:loading-loop" className="text-4xl text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  const defaultAddress = getDefaultAddress();

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => window.history.back()}
            >
              <Icon icon="material-symbols:arrow-back" width={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Customer Detail</h1>
          </div>
          <div className="flex gap-2">
            {hasPermission('customers.edit') && (
              <button
                onClick={openEditCustomer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <Icon icon="solar:pen-outline" className="text-lg" />
                Edit Customer
              </button>
            )}
          </div>
        </div>

        {/* Customer Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="text-xl font-semibold mb-3">{customer?.name || '-'}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex">
                <div className="w-40 text-gray-500">Telp.</div>
                <div className="flex-1 text-gray-800">{customer?.phone || '-'}</div>
              </div>
              <div className="flex">
                <div className="w-40 text-gray-500">Email</div>
                <div className="flex-1 text-gray-800">{customer?.email || '-'}</div>
              </div>
              <div className="flex">
                <div className="w-40 text-gray-500">Kategori</div>
                <div className="flex-1 text-gray-800">{customer?.category || '-'}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex">
                <div className="w-40 text-gray-500">Alamat</div>
                <div className="flex-1 text-gray-800">{addressToString(defaultAddress)}</div>
              </div>
              <div className="flex">
                <div className="w-40 text-gray-500">Kode Pos</div>
                <div className="flex-1 text-gray-800">{defaultAddress?.postal_code || '-'}</div>
              </div>
              <div className="flex">
                <div className="w-40 text-gray-500">Status</div>
                <div className="flex-1">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="text-sm font-medium text-gray-700">Riwayat Order</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(customer?.orders) && customer.orders.length > 0 ? (
                  customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">#{order.order_number || order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{statusLabel(order.status)}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(order.total_price)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openOrderDetail(order.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Lihat Order"
                        >
                          <Icon icon="solar:eye-outline" className="text-xl" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-8 text-center text-gray-500" colSpan="5">Belum ada riwayat order</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

