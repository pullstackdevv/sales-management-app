import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import TableComponent from "../../components/ui/table/TableComponent";
import { Button } from "flowbite-react";
import api from "@/api/axios";
import * as AuthAPI from "@/api/auth";
import Swal from "sweetalert2";

export default function UserSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role_id: '',
    is_active: true
  });
  
  const [roles, setRoles] = useState([]);
  const [roleDescriptions, setRoleDescriptions] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchRoleDescriptions();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role_id: roles.length > 0 ? roles.find(r => r.role === 'staff')?.role || roles[0]?.role || '' : '',
      is_active: true
    });
    setFormError(null);
    setSelectedUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalType('create');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      password_confirmation: '',
      role_id: user.role?.name || user.role_id || '',
      is_active: user.is_active
    });
    setSelectedUser(user);
    setModalType('edit');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };



  const handleRoleChange = (e) => {
    const roleId = e.target.value;
    setFormData(prev => ({
      ...prev,
      role_id: roleId
    }));
  };

  const createUser = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      const response = await api.post('/users', formData);
      
      if (response.data.status === 'success') {
        closeModal();
        fetchUsers();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'User berhasil dibuat',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Error creating user:', err);
      
      if (err.response?.status === 422) {
        // Validation errors
        const errors = Object.values(err.response.data.errors).flat();
        setFormError(errors.join(', '));
      } else if (err.response?.status === 401) {
        setFormError('Sesi Anda telah berakhir. Silakan login kembali.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (err.response?.status === 403) {
        setFormError('Anda tidak memiliki akses untuk membuat user.');
      } else {
        setFormError('Gagal membuat user. Silakan coba lagi.');
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: 'Gagal membuat user'
        });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const updateUser = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      const updateData = { ...formData };
      // Remove password fields if empty
      if (!updateData.password) {
        delete updateData.password;
        delete updateData.password_confirmation;
      }

      const response = await api.put(`/users/${selectedUser.id}`, updateData);
      
      if (response.data.status === 'success') {
        closeModal();
        fetchUsers();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'User berhasil diperbarui',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Error updating user:', err);
      
      if (err.response?.status === 422) {
        // Validation errors
        const errors = Object.values(err.response.data.errors).flat();
        setFormError(errors.join(', '));
      } else if (err.response?.status === 401) {
        setFormError('Sesi Anda telah berakhir. Silakan login kembali.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (err.response?.status === 403) {
        setFormError('Anda tidak memiliki akses untuk memperbarui user.');
      } else {
        setFormError('Gagal memperbarui user. Silakan coba lagi.');
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: 'Gagal memperbarui user'
        });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const deleteUser = async (user) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: `Apakah Anda yakin ingin menghapus user ${user.name}?`,
      icon: 'warning',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await api.delete(`/users/${user.id}`);
      
      if (response.data.status === 'success') {
        fetchUsers();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'User berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Gagal menghapus user'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormError(null);
    
    // Basic validation
    if (!formData.name || !formData.email || (modalType === 'create' && !formData.password)) {
      setFormError('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    // Password confirmation validation
    if (formData.password && formData.password !== formData.password_confirmation) {
      setFormError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (modalType === 'create') {
      createUser();
    } else {
      updateUser();
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      if (!AuthAPI.isAuthenticated()) {
        setError('Anda harus login terlebih dahulu');
        return;
      }

      const response = await api.get("/users");
      
      if (response.data.status === 'success') {
        // Handle paginated data
        const userData = response.data.data.data || response.data.data;
        setUsers(Array.isArray(userData) ? userData : []);
      } else {
        setError('Gagal mengambil data pengguna');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 401) {
        setError('Sesi Anda telah berakhir. Silakan login kembali.');
      } else if (err.response?.status === 403) {
        setError('Anda tidak memiliki akses untuk melihat data pengguna.');
      } else {
        setError('Terjadi kesalahan saat mengambil data pengguna.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get("/roles");
      if (response.data.status === 'success') {
        const rolesData = response.data.data.data || response.data.data;
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchRoleDescriptions = async () => {
    try {
      const response = await api.get("/users/role-permissions");
      if (response.data.status === 'success') {
        setRoleDescriptions(response.data.data || {});
      }
    } catch (err) {
      console.error('Error fetching role descriptions:', err);
    }
  };


  
  const columns = [
    {
      key: "no",
      label: "No",
      render: (_, i) => <span>{i + 1}.</span>,
    },
    {
      key: "name",
      label: "Nama",
      render: (row) => <b>{row.name}</b>,
    },
    { key: "email", label: "Email" },
    { 
      key: "role", 
      label: "Role",
      render: (row) => {
        const roleName = row.role?.name || 'Unknown';
        return <span className="capitalize">{roleName}</span>;
      }
    },

    {
      key: "actions",
      label: "Aksi",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit User"
          >
            <Icon icon="mdi:pencil" className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteUser(row)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus User"
          >
            <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan User</h2>
          <p className="text-gray-600 mt-1">Kelola data pengguna dan permission</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Icon icon="solar:add-circle-outline" className="w-5 h-5" />
          Tambah User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <p className="font-medium">Error!</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total User</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Icon icon="solar:users-group-rounded-outline" className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">User Aktif</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.is_active).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Icon icon="solar:check-circle-outline" className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">User Nonaktif</p>
                  <p className="text-2xl font-bold text-red-600">
                    {users.filter(u => !u.is_active).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Icon icon="solar:close-circle-outline" className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h3 className="font-semibold mb-4">Data Pengguna</h3>
              {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Icon icon="solar:users-group-rounded-outline" className="text-4xl text-gray-400 mb-3" />
                  <p className="text-gray-600 text-center">Belum ada data pengguna</p>
                </div>
              ) : (
                <TableComponent columns={columns} data={users} />
              )}
            </div>
          </div>
        </>
       )}

      {/* Custom Modal for Add/Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {modalType === 'create' ? 'Tambah User Baru' : 'Edit User'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon icon="solar:close-circle-outline" className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <p className="font-medium">Error!</p>
                    <p className="text-sm">{formError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Nama *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Masukkan alamat email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {modalType === 'create' ? 'Password *' : 'Password (kosongkan jika tidak ingin mengubah)'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={modalType === 'create'}
                    placeholder="Masukkan password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Konfirmasi Password *</label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleInputChange}
                    required={modalType === 'create' || formData.password}
                    placeholder="Konfirmasi password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role *</label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleRoleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Role</option>
                    {roles.map((role, index) => (
                      <option key={index} value={role.role}>
                        {role.role}
                      </option>
                    ))}
                  </select>
                  
                  {/* Role Description */}
                  {formData.role_id && (() => {
                    const selectedRole = roles.find(r => r.role === formData.role_id);
                    const roleDesc = roleDescriptions[selectedRole?.role];
                    return selectedRole && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          {roleDesc?.description || selectedRole.description}
                        </p>
                        {(selectedRole.permissions || roleDesc?.permissions) && (selectedRole.permissions || roleDesc.permissions).length > 0 && (
                          <div className="text-xs text-blue-600">
                            <strong>Akses:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {(selectedRole.permissions || roleDesc.permissions).map((permission, index) => (
                                <li key={index}>{permission.replace(/\./g, ' ').replace(/_/g, ' ')}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">User Aktif</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {formLoading ? (
                      <>
                        <Icon icon="solar:loading-outline" className="animate-spin mr-2" />
                        {modalType === 'create' ? 'Membuat...' : 'Memperbarui...'}
                      </>
                    ) : (
                      modalType === 'create' ? 'Buat User' : 'Perbarui User'
                    )}
                  </button>
                </div>
              </form>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
