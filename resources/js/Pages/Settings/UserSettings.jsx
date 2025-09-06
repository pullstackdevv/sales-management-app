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
    role: 'staff',
    is_active: true,
    permissions: {
      orders: { view: false, create: false, edit: false, delete: false },
      products: { view: false, create: false, edit: false, delete: false },
      customers: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false }
    }
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'staff',
      is_active: true,
      permissions: {
        orders: { view: false, create: false, edit: false, delete: false },
        products: { view: false, create: false, edit: false, delete: false },
        customers: { view: false, create: false, edit: false, delete: false },
        reports: { view: false, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false }
      }
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
      is_active: user.is_active,
      permissions: user.permissions || {
        orders: { view: false, create: false, edit: false, delete: false },
        products: { view: false, create: false, edit: false, delete: false },
        customers: { view: false, create: false, edit: false, delete: false },
        reports: { view: false, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false }
      }
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

  const handlePermissionChange = (module, action, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: checked
        }
      }
    }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    let defaultPermissions = {
      orders: { view: false, create: false, edit: false, delete: false },
      products: { view: false, create: false, edit: false, delete: false },
      customers: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false }
    };

    // Set default permissions based on role
    if (role === 'owner' || role === 'admin') {
      Object.keys(defaultPermissions).forEach(module => {
        defaultPermissions[module] = { view: true, create: true, edit: true, delete: true };
      });
    } else if (role === 'staff') {
      defaultPermissions.orders = { view: true, create: true, edit: true, delete: false };
      defaultPermissions.products = { view: true, create: false, edit: true, delete: false };
      defaultPermissions.customers = { view: true, create: true, edit: true, delete: false };
      defaultPermissions.reports = { view: true, create: false, edit: false, delete: false };
    } else if (role === 'warehouse') {
      defaultPermissions.orders = { view: true, create: false, edit: true, delete: false };
      defaultPermissions.products = { view: true, create: true, edit: true, delete: false };
    }

    setFormData(prev => ({
      ...prev,
      role: role,
      permissions: defaultPermissions
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
          'owner': 'Owner',
          'admin': 'Administrator', 
          'staff': 'Staff',
          'warehouse': 'Staff Gudang'
        };
        return <span className="capitalize">{roleLabels[row.role] || row.role}</span>;
      }
    },
    {
      key: "permissions",
      label: "Permissions",
      render: (row) => {
        const permissions = row.permissions || {};
        const activePermissions = [];
        
        Object.keys(permissions).forEach(module => {
          const modulePerms = permissions[module] || {};
          const activeActions = Object.keys(modulePerms).filter(action => modulePerms[action]);
          if (activeActions.length > 0) {
            activePermissions.push(`${module}: ${activeActions.join(', ')}`);
          }
        });
        
        return (
          <div className="max-w-xs">
            {activePermissions.length > 0 ? (
              <div className="text-xs space-y-1">
                {activePermissions.slice(0, 2).map((perm, idx) => (
                  <div key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded truncate">
                    {perm}
                  </div>
                ))}
                {activePermissions.length > 2 && (
                  <div className="text-gray-500">+{activePermissions.length - 2} more</div>
                )}
              </div>
            ) : (
              <span className="bg-gray-200 px-2 py-1 rounded text-xs">No permissions</span>
            )}
          </div>
        );
      },
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
            color="blue"
            onClick={openCreateModal}
            className="flex items-center gap-2"
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
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Icon icon="mdi:account-group" className="text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600 text-center">Belum ada data pengguna</p>
          </div>
        ) : (
          <TableComponent columns={columns} data={users} />
        )}
      </div>

      {/* User Modal */}
      <Modal show={showModal} onClose={closeModal} size="lg">
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
                onChange={handleRoleChange}
                required
              >
                <option value="staff">Staff</option>
                <option value="admin">Administrator</option>
                <option value="warehouse">Staff Gudang</option>
                <option value="owner">Owner</option>
              </Select>
            </div>

            {/* Permissions Section */}
            <div>
              <Label value="Permissions" className="mb-3 block" />
              <div className="space-y-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                {Object.keys(formData.permissions).map(module => (
                  <div key={module} className="border-b pb-3 last:border-b-0">
                    <h4 className="font-medium capitalize mb-2 text-gray-700">{module}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(formData.permissions[module]).map(action => (
                        <label key={action} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.permissions[module][action]}
                            onChange={(e) => handlePermissionChange(module, action, e.target.checked)}
                            className="rounded"
                          />
                          <span className="capitalize">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
