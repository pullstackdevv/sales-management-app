import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import TableComponent from "../../components/ui/table/TableComponent";

import api from "@/api/axios";
import * as AuthAPI from "@/api/auth";
import Swal from "sweetalert2";

export default function RoleSettings() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('edit'); 
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    role: '',
    description: '',
    permissions: []
  });
  
  const [availablePermissions] = useState([
    'dashboard',
    'orders',
    'products',
    'customers',
    'stock',
    'vouchers',
    'expenses',
    'reports',
    'settings'
  ]);
  
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const resetForm = () => {
    setFormData({
      role: '',
      description: '',
      permissions: []
    });
    setFormError(null);
    setSelectedRole(null);
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setFormData({
      role: role.role,
      description: role.description,
      permissions: role.permissions || []
    });
    setModalType('edit');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const updateRole = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      if (!AuthAPI.isAuthenticated()) {
        setFormError('Anda harus login terlebih dahulu');
        return;
      }

      const response = await api.put(`/roles/${selectedRole.role}`, {
        description: formData.description,
        permissions: formData.permissions
      });
      
      if (response.data.status === 'success') {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: response.data.message || 'Role permission berhasil diupdate!',
          timer: 2000,
          showConfirmButton: false
        });
        fetchRoles();
        closeModal();
      } else {
        setFormError(response.data.message || 'Gagal memperbarui role');
      }
    } catch (err) {
      console.error('Error updating role:', err);

      if (err.response) {
        console.log('Error response data:', err.response.data);
      }

      if (err.response?.status === 401) {
        setFormError('Sesi Anda telah berakhir. Silakan login kembali.');
      } else if (err.response?.status === 403) {
        setFormError('Anda tidak memiliki akses untuk memperbarui role.');
      } else if (err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat();
        setFormError(errors.join(', '));
      } else if (err.response?.data?.status === 'success') {
        // 🚀 tangani success di catch (kalau interceptor bikin error padahal success)
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: response.data.message || 'Role permission berhasil diupdate!',
          timer: 2000,
          showConfirmButton: false
        });
        fetchRoles();
        closeModal();
      } else {
        setFormError('Terjadi kesalahan saat memperbarui role.');
      }
    }
 finally {
      setFormLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!AuthAPI.isAuthenticated()) {
        setError('Anda harus login terlebih dahulu');
        return;
      }

      const response = await api.get('/roles');
      
      if (response.data.status === 'success') {
        setRoles(response.data.data || []);
      } else {
        setError('Gagal mengambil data role');
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      if (err.response?.status === 401) {
        setError('Sesi Anda telah berakhir. Silakan login kembali.');
      } else if (err.response?.status === 403) {
        setError('Anda tidak memiliki akses untuk melihat data role.');
      } else {
        setError('Terjadi kesalahan saat mengambil data role.');
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
      key: "role",
      label: "Role",
      render: (row) => {
        const roleLabels = {
          'owner': 'Owner',
          'admin': 'Administrator', 
          'staff': 'Staff',
          'warehouse': 'Staff Gudang'
        };
        return <b className="capitalize">{roleLabels[row.role] || row.role}</b>;
      },
    },
    {
      key: "description",
      label: "Deskripsi",
      render: (row) => <span className="text-gray-600">{row.description}</span>,
    },
    {
      key: "permissions",
      label: "Permissions",
      render: (row) => {
        const permissions = row.permissions || [];
        
        return (
          <div className="max-w-xs">
            {permissions.length > 0 ? (
              <div className="text-xs space-y-1">
                {permissions.slice(0, 3).map((perm, idx) => (
                  <div key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded truncate capitalize">
                    {perm}
                  </div>
                ))}
                {permissions.length > 3 && (
                  <div className="text-gray-500">+{permissions.length - 3} more</div>
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
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
          >
            <Icon icon="mdi:pencil" width={16} height={16} />
            Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Role Settings</h2>
                  <p className="text-gray-600 mt-1">Kelola role dan permissions sistem</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {roles.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="mdi:shield-account-outline" width={64} height={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Belum ada data role</p>
                </div>
              ) : (
                <TableComponent columns={columns} data={roles} />
              )}
            </div>
          </div>
        </>
       )}

      {/* Modal for Edit Role */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Role: {formData.role}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="mdi:close" width={24} height={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Role
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Masukkan deskripsi role..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionChange(permission)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {permission}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={formLoading}
              >
                Batal
              </button>
              <button
                onClick={updateRole}
                disabled={formLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {formLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}