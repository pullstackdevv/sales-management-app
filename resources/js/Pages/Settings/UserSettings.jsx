import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import TableComponent from "../../components/ui/table/TableComponent";
import { Button } from "flowbite-react";
import api from "@/api/axios";
import * as AuthAPI from "@/api/auth";
import Swal from "sweetalert2";

export default function UserSettings() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
          <Link
            href={`/settings/users/${row.id}/edit`}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit User"
          >
            <Icon icon="mdi:pencil" className="w-4 h-4" />
          </Link>
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
          <Link 
            href="/settings/users/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Icon icon="mdi:plus" width={18} />
            Tambah User
          </Link>
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
          <Link 
            href="/settings/users/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            <Icon icon="mdi:plus" width={18} />
            Tambah User
          </Link>
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
        <Link 
          href="/settings/users/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Icon icon="mdi:plus" width={18} />
          Tambah User
        </Link>
      </div>



      <div className="bg-white rounded-lg shadow p-6">
        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Cari User
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm pr-10"
                  placeholder="Cari berdasarkan nama atau email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <Icon 
                  icon="mdi:magnify" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Role
              </label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={roleFilter}
                onChange={handleRoleFilterChange}
              >
                <option value="">Semua Role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Status
              </label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>
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


    </div>
  );
}
