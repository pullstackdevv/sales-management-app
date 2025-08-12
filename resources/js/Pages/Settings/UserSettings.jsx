import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import TableComponent from "../../components/ui/table/TableComponent";
import { Button, Modal, TextInput, Label, Select, Alert } from "flowbite-react";
import { HiInformationCircle } from "react-icons/hi";
import api from "@/api/axios";
import * as AuthAPI from "@/api/auth";
import Swal from "sweetalert2";

export default function UserSettings() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    is_active: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== '') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.is_active === isActive);
    }

    setFilteredUsers(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: '',
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
      role: typeof user.role === 'object' ? user.role.value : user.role,
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
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
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

  const validateForm = () => {
    const errors = [];
    
    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      errors.push('Nama minimal 2 karakter');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.push('Format email tidak valid');
    }
    
    // Password validation for create mode
    if (modalType === 'create' && !formData.password) {
      errors.push('Password wajib diisi');
    }
    
    // Password strength validation
    if (formData.password) {
      if (formData.password.length < 8) {
        errors.push('Password minimal 8 karakter');
      }
      
      const hasUppercase = /[A-Z]/.test(formData.password);
      const hasLowercase = /[a-z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);
      
      if (!hasUppercase || !hasLowercase || !hasNumber) {
        errors.push('Password harus mengandung huruf besar, huruf kecil, dan angka');
      }
    }
    
    // Password confirmation validation
    if (formData.password && formData.password !== formData.password_confirmation) {
      errors.push('Password dan konfirmasi password tidak cocok');
    }
    
    // Role validation
    if (!formData.role) {
      errors.push('Role wajib dipilih');
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormError(null);
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setFormError(validationErrors.join(', '));
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
        const roleLabels = {
          'admin': 'Admin',
          'manager': 'Manager', 
          'staff': 'Staff'
        };
        return <span className="capitalize">{roleLabels[row.role] || row.role}</span>;
      }
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.is_active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      ),
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

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Pengaturan User</h2>
          <Button 
            color="blue"
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            <Icon icon="mdi:plus" width={18} />
            Tambah User
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:loading" className="animate-spin text-2xl text-primary" />
              <span className="text-gray-600">Memuat data pengguna...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Pengaturan User</h2>
          <Button 
            className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-primary/90 text-sm"
            onClick={openCreateModal}
          >
            <Icon icon="mdi:plus" width={18} />
            Tambah User
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Icon icon="mdi:alert-circle" className="text-4xl text-red-500 mb-3" />
            <p className="text-red-600 text-center mb-4">{error}</p>
            <Button 
              onClick={fetchUsers}
              color="blue"
              className="flex items-center gap-2"
            >
              <Icon icon="mdi:refresh" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Pengaturan User</h2>
        <Button 
          color="blue"
          onClick={openCreateModal}
          className="flex items-center gap-2"
        >
          <Icon icon="mdi:plus" width={18} />
          Tambah User
        </Button>
      </div>



      <div className="bg-white rounded-lg shadow p-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <TextInput
              type="text"
              placeholder="Cari berdasarkan nama atau email..."
              value={searchTerm}
              onChange={handleSearchChange}
              icon={() => <Icon icon="mdi:magnify" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={roleFilter}
              onChange={handleRoleFilterChange}
            >
              <option value="">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </Select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Icon icon="mdi:account-group" className="text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600 text-center">
              {users.length === 0 ? 'Belum ada data pengguna' : 'Tidak ada pengguna yang sesuai dengan filter'}
            </p>
          </div>
        ) : (
          <TableComponent columns={columns} data={filteredUsers} />
        )}
      </div>

      {/* User Modal */}
      <Modal show={showModal} onClose={closeModal} size="md">
        <Modal.Header>
          {modalType === 'create' ? 'Tambah User Baru' : 'Edit User'}
        </Modal.Header>
        <Modal.Body>
          <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert color="failure" icon={HiInformationCircle}>
                {formError}
              </Alert>
            )}
            <div>
              <Label htmlFor="name" value="Nama" />
              <TextInput
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Masukkan nama lengkap"
              />
            </div>


            <div>
              <Label htmlFor="email" value="Email" />
              <TextInput
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Masukkan alamat email"
              />
            </div>


            <div>
              <Label 
                htmlFor="password" 
                value={modalType === 'create' ? 'Password' : 'Password (kosongkan jika tidak ingin mengubah)'} 
              />
              <TextInput
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={modalType === 'create'}
                placeholder="Masukkan password"
              />
            </div>


            <div>
              <Label htmlFor="password_confirmation" value="Konfirmasi Password" />
              <TextInput
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                value={formData.password_confirmation}
                onChange={handleInputChange}
                required={modalType === 'create' || formData.password}
                placeholder="Konfirmasi password"
              />
            </div>


            <div>
              <Label htmlFor="role" value="Role" />
              <Select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="">Pilih Role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </Select>
            </div>


            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded"
              />
              <Label htmlFor="is_active" value="User Aktif" />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            type="submit"
            disabled={formLoading}
            color="blue"
            form="userForm"
          >
            {formLoading ? (
              <>
                <Icon icon="mdi:loading" className="animate-spin mr-2" />
                {modalType === 'create' ? 'Membuat...' : 'Memperbarui...'}
              </>
            ) : (
              modalType === 'create' ? 'Buat User' : 'Perbarui User'
            )}
          </Button>
          <Button color="gray" onClick={closeModal}>
            Batal
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
