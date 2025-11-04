import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "flowbite-react";
import TableComponent from "../../components/ui/table/TableComponent";
import axios from "axios";
import Swal from "sweetalert2";

export default function OriginSettings() {
  const [origins, setOrigins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingOrigin, setEditingOrigin] = useState(null);
  const [formData, setFormData] = useState({
    store_name: '',
    origin_address: '',
    phone: '',
    address: '',
    is_active: true
  });

  // Fetch origins from API
  const fetchOrigins = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/origin-settings');
      if (response.data.success) {
        setOrigins(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching origins:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data origin settings'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrigins();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = editingOrigin
        ? await axios.put(`/api/origin-settings/${editingOrigin.id}`, formData)
        : await axios.post('/api/origin-settings', formData);

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: response.data.message || (editingOrigin ? 'Origin berhasil diupdate!' : 'Origin berhasil ditambahkan!'),
          timer: 2000,
          showConfirmButton: false
        });

        setShowModal(false);
        fetchOrigins();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving origin:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal menyimpan origin setting'
      });
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: 'Apakah Anda yakin ingin menghapus origin setting ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`/api/origin-settings/${id}`);
        
        if (response.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: response.data.message || 'Origin berhasil dihapus!',
            timer: 2000,
            showConfirmButton: false
          });
          
          fetchOrigins();
        }
      } catch (error) {
        console.error('Error deleting origin:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Gagal menghapus origin setting'
        });
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      store_name: '',
      origin_address: '',
      phone: '',
      address: '',
      is_active: true
    });
    setEditingOrigin(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Handle edit
  const handleEdit = (origin) => {
    setEditingOrigin(origin);
    setFormData({
      store_name: origin.store_name,
      origin_address: origin.origin_address,
      phone: origin.phone || '',
      address: origin.address || '',
      is_active: origin.is_active
    });
    setShowModal(true);
  };



  const columns = [
    { 
      key: "store_name", 
      label: "Nama Toko & Detail",
      render: (row) => (
        <div>
          <div className="font-medium">{row.store_name}</div>
          <div className="text-sm text-gray-500">{row.origin_address}</div>
          <div className="text-xs text-gray-400">{row.phone} • {row.address}</div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`text-xs px-2 py-1 rounded ${
            row.is_active
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {row.is_active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex space-x-2">
          <button 
            className="text-blue-600 hover:text-blue-800"
            onClick={() => handleEdit(row)}
          >
            <Icon icon="mdi:pencil" width={18} />
          </button>
          <button 
            className="text-red-600 hover:text-red-800"
            onClick={() => handleDelete(row.id)}
          >
            <Icon icon="mdi:delete" width={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Pengaturan Origin</h2>
        <Button 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          onClick={handleAddNew}
        >
          <Icon icon="mdi:plus" width={18} className="mr-1" />
          Tambah Origin Setting
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        {/* Origins Table */}
        <div>
          <h3 className="font-semibold mb-2">Data Origin Settings</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <TableComponent columns={columns} data={origins} />
          )}
        </div>

        {/* Custom Modal for Add/Edit Origin */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50" 
              onClick={() => setShowModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingOrigin ? 'Edit Origin Setting' : 'Tambah Origin Setting'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="mdi:close" width={24} />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Toko</label>
                    <input
                      type="text"
                      value={formData.store_name}
                      onChange={(e) => setFormData({...formData, store_name: e.target.value})}
                      required
                      placeholder="Masukkan nama toko"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Asal Pengiriman</label>
                    <input
                      type="text"
                      value={formData.origin_address}
                      onChange={(e) => setFormData({...formData, origin_address: e.target.value})}
                      required
                      placeholder="Masukkan asal pengiriman"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Telepon</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Masukkan nomor telepon"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Alamat</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Masukkan alamat lengkap"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium">Aktif</label>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {editingOrigin ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
