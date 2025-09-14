import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link, router, usePage } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function AddEditUser({ user = null }) {
  const { props } = usePage();
  const { mode, userId } = props;
  const isEdit = mode === 'edit' || !!user;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit && !user);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    password_confirmation: '',
    role: user?.role || '',
    permissions: {
      order_cancellation: user?.permissions?.order_cancellation || false,
      edit_stock_product: user?.permissions?.edit_stock_product || false,
      delete_product: user?.permissions?.delete_product || false,
      price_setting_sell: user?.permissions?.price_setting_sell || false,
      price_setting_buy: user?.permissions?.price_setting_buy || false,
      excel_product_upload: user?.permissions?.excel_product_upload || false,
      edit_customer: user?.permissions?.edit_customer || false,
      delete_customer: user?.permissions?.delete_customer || false,
      supplier_payment_input: user?.permissions?.supplier_payment_input || false,
      edit_order: user?.permissions?.edit_order || false,
      admin_edit_order_restriction: user?.permissions?.admin_edit_order_restriction || false,
      admin_cancel_order: user?.permissions?.admin_cancel_order || false,
      admin_change_payment_status: user?.permissions?.admin_change_payment_status || false,
      net_sales_view: user?.permissions?.net_sales_view || false,
      expense_menu: user?.permissions?.expense_menu || false,
      analyzer_view: user?.permissions?.analyzer_view || false,
      expense_edit_delete: user?.permissions?.expense_edit_delete || false,
      customer_private_order_activation: user?.permissions?.customer_private_order_activation || false,
      customer_storefront_registration_confirmation: user?.permissions?.customer_storefront_registration_confirmation || false,
      payment_menu: user?.permissions?.payment_menu || false,
      excel_download: user?.permissions?.excel_download || false,
      payment_cod: user?.permissions?.payment_cod || false,
      promo_menu: user?.permissions?.promo_menu || false,
      office_hours: user?.permissions?.office_hours || false
    }
  });
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isEdit && userId && !user) {
      fetchUserData();
    }
  }, [isEdit, userId, user]);

  const fetchUserData = async () => {
    try {
      setInitialLoading(true);
      const response = await api.get(`/users/${userId}`);
      
      if (response.data.status === 'success') {
        const userData = response.data.data;
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          password: '',
          password_confirmation: '',
          role: userData.role || '',
          permissions: {
            order_cancellation: userData.permissions?.order_cancellation || false,
            edit_stock_product: userData.permissions?.edit_stock_product || false,
            delete_product: userData.permissions?.delete_product || false,
            price_setting_sell: userData.permissions?.price_setting_sell || false,
            price_setting_buy: userData.permissions?.price_setting_buy || false,
            excel_product_upload: userData.permissions?.excel_product_upload || false,
            edit_customer: userData.permissions?.edit_customer || false,
            delete_customer: userData.permissions?.delete_customer || false,
            supplier_payment_input: userData.permissions?.supplier_payment_input || false,
            edit_order: userData.permissions?.edit_order || false,
            admin_edit_order_restriction: userData.permissions?.admin_edit_order_restriction || false,
            admin_cancel_order: userData.permissions?.admin_cancel_order || false,
            admin_change_payment_status: userData.permissions?.admin_change_payment_status || false,
            net_sales_view: userData.permissions?.net_sales_view || false,
            expense_menu: userData.permissions?.expense_menu || false,
            analyzer_view: userData.permissions?.analyzer_view || false,
            expense_edit_delete: userData.permissions?.expense_edit_delete || false,
            customer_private_order_activation: userData.permissions?.customer_private_order_activation || false,
            customer_storefront_registration_confirmation: userData.permissions?.customer_storefront_registration_confirmation || false,
            payment_menu: userData.permissions?.payment_menu || false,
            excel_download: userData.permissions?.excel_download || false,
            payment_cod: userData.permissions?.payment_cod || false,
            promo_menu: userData.permissions?.promo_menu || false,
            office_hours: userData.permissions?.office_hours || false
          }
        });
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setFormError('Gagal mengambil data user');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('permissions.')) {
      const permissionKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permissionKey]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Nama minimal 2 karakter';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = 'Format email tidak valid';
    }
    
    // Phone validation
    if (!formData.phone || formData.phone.trim().length < 10) {
      errors.phone = 'Nomor handphone minimal 10 digit';
    }
    
    // Password validation for create mode
    if (!isEdit && !formData.password) {
      errors.password = 'Password wajib diisi';
    }
    
    // Password strength validation
    if (formData.password) {
      if (formData.password.length < 8) {
        errors.password = 'Password minimal 8 karakter';
      }
      
      const hasUppercase = /[A-Z]/.test(formData.password);
      const hasLowercase = /[a-z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      
      if (!hasUppercase) {
        errors.password = 'Password harus mengandung huruf besar';
      } else if (!hasLowercase) {
        errors.password = 'Password harus mengandung huruf kecil';
      } else if (!hasNumber) {
        errors.password = 'Password harus mengandung angka';
      } else if (!hasSpecial) {
        errors.password = 'Password harus mengandung simbol seperti @, #, atau tanda lainnya';
      }
    }
    
    // Password confirmation validation
    if (formData.password && formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'Password dan konfirmasi password tidak cocok';
    }
    
    // Role validation
    if (!formData.role) {
      errors.role = 'Role wajib dipilih';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormError(null);
    setValidationErrors({});
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const submitData = { ...formData };
      
      // Remove password fields if empty in edit mode
      if (isEdit && !submitData.password) {
        delete submitData.password;
        delete submitData.password_confirmation;
      }

      let response;
      if (isEdit) {
        const id = user?.id || userId;
        response = await api.put(`/users/${id}`, submitData);
      } else {
        response = await api.post('/users', submitData);
      }
      
      if (response.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: `User berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`,
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          router.visit('/cms/settings/user');
        });
      }
    } catch (err) {
      console.error('Error saving user:', err);
      
      if (err.response?.status === 422) {
        // Validation errors from backend
        const backendErrors = err.response.data.errors || {};
        setValidationErrors(backendErrors);
      } else if (err.response?.status === 401) {
        setFormError('Sesi Anda telah berakhir. Silakan login kembali.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (err.response?.status === 403) {
        setFormError(`Anda tidak memiliki akses untuk ${isEdit ? 'memperbarui' : 'membuat'} user.`);
      } else {
        setFormError(`Gagal ${isEdit ? 'memperbarui' : 'membuat'} user. Silakan coba lagi.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const permissionLabels = {
    order_cancellation: 'Penguncian Order',
    edit_stock_product: 'Edit Stok Produk',
    delete_product: 'Hapus Produk',
    price_setting_sell: 'Setting Harga Beli',
    price_setting_buy: 'Setting Harga Jual',
    excel_product_upload: 'Upload Produk via Excel',
    edit_customer: 'Edit Customer',
    delete_customer: 'Hapus Customer',
    supplier_payment_input: 'Input Biaya Bayar ke Supplier (Dropshipper)',
    edit_order: 'Edit Order',
    admin_edit_order_restriction: 'Blokir admin untuk Edit Order yang dibuat Admin Lain',
    admin_cancel_order: 'Blokir admin melakukan Cancel Order',
    admin_change_payment_status: 'Blokir admin ubah status pembayaran data order',
    net_sales_view: 'Melihat omzet (Net Sales)',
    expense_menu: 'Menu Expense',
    analyzer_view: 'Melihat Analyzer',
    expense_edit_delete: 'Hapus dan Edit Expense',
    customer_private_order_activation: 'Aktivasi Customer Akses Private Order',
    customer_storefront_registration_confirmation: 'Konfirmasi Pendaftaran Customer Storefront',
    payment_menu: 'Menu Payment',
    excel_download: 'Download Excel',
    payment_cod: 'Payment COD',
    promo_menu: 'Menu Promo',
    office_hours: 'Office Hour (Segera Hadir)'
  };

  const roleDescriptions = {
    owner: 'pemilik usaha dan bisa mengakses semua fitur di SmartSeller.',
    admin: 'karyawan yang membantu mengelola order di toko. Mendapat hak akses fitur yang terbatas.',
    shipper: 'karyawan yang bertugas mengirim barang. Ia hanya memiliki hak akses fitur terkait pengiriman.'
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Icon icon="mdi:loading" className="animate-spin text-4xl text-blue-600" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/cms/settings/user"
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit User' : 'Tambah User Baru'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Informasi Dasar</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium">
                  Nama lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Diah"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="saleapurfunadm@gmail.com"
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">
                  Nomor handphone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                    validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="085716421005"
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Password</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium">
                  {isEdit ? "Password (kosongkan jika tidak ingin mengubah)" : "Password"}
                  {!isEdit && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                />
                {validationErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">
                  Konfirmasi password
                  {!isEdit && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                    validationErrors.password_confirmation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  placeholder="Ulangi password"
                />
                {validationErrors.password_confirmation && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.password_confirmation}</p>
                )}
              </div>
            </div>

            {/* Password Requirements */}
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Password harus memenuhi minimal 2 syarat:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ada huruf kapital</li>
                <li>Ada huruf kecil</li>
                <li>Ada angka</li>
                <li>Ada simbol seperti @, #, atau tanda lainnya</li>
              </ul>
            </div>
          </div>

          {/* Role Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Peran</h2>
            
            <div>
              <label className="text-sm font-medium">
                Peran <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                className={`w-full mt-1 border rounded px-3 py-2 text-sm ${
                  validationErrors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="">Pilih peran</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="shipper">Shipper</option>
              </select>
              {validationErrors.role && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.role}</p>
              )}
            </div>

            {/* Role Descriptions */}
            <div className="mt-6 space-y-4">
              <h3 className="font-medium text-gray-900">Penjelasan peran</h3>
              {Object.entries(roleDescriptions).map(([role, description]) => (
                <div key={role} className="flex gap-3">
                  <span className="font-medium text-gray-700 capitalize min-w-[80px]">
                    {role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Shipper'}:
                  </span>
                  <span className="text-gray-600">{description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Penguncian Order</h2>
            
            <div className="space-y-4">
              {Object.entries(permissionLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name={`permissions.${key}`}
                      checked={formData.permissions[key]}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/cms/settings/user"
              className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin mr-2" />
                  {isEdit ? 'Memperbarui...' : 'Menyimpan...'}
                </>
              ) : (
                isEdit ? 'Perbarui' : 'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}