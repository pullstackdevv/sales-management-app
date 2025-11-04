import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "flowbite-react";
import TableComponent from "../../components/ui/table/TableComponent";
import axios from "axios";
import Swal from "sweetalert2";

const ToggleSwitch = ({ label, description }) => {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex-1">
        <label className="font-medium">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={enabled}
          onChange={() => setEnabled(!enabled)}
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
      </label>
    </div>
  );
};

export default function OrderSettings() {
  const [salesChannels, setSalesChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    platform: '',
    is_active: true
  });

  // Fetch sales channels from API
  const fetchSalesChannels = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sales-channels');
      if (response.data.status === 'success') {
        setSalesChannels(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sales channels:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data sales channels'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingChannel) {
        // Update existing channel
        await axios.put(`/api/sales-channels/${editingChannel.id}`, formData);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Sales channel berhasil diupdate'
        });
      } else {
        // Create new channel
        await axios.post('/api/sales-channels', formData);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Sales channel berhasil ditambahkan'
        });
      }
      setShowModal(false);
      resetForm();
      fetchSalesChannels();
    } catch (error) {
      console.error('Error saving sales channel:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal menyimpan sales channel'
      });
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: 'Apakah Anda yakin ingin menghapus sales channel ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/sales-channels/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Sales channel berhasil dihapus'
        });
        fetchSalesChannels();
      } catch (error) {
        console.error('Error deleting sales channel:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Gagal menghapus sales channel'
        });
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      platform: '',
      is_active: true
    });
    setEditingChannel(null);
  };

  // Handle edit
  const handleEdit = (channel) => {
    setEditingChannel(channel);
    setFormData({
        name: channel.name,
        code: channel.code,
        description: channel.description,
        platform: channel.platform,
        is_active: channel.is_active
      });
    setShowModal(true);
  };

  // Handle add new
  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  useEffect(() => {
    fetchSalesChannels();
  }, []);

  const columns = [
    { 
      key: "name", 
      label: "Nama & Keterangan",
      render: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.description}</div>
          <div className="text-xs text-gray-400">{row.platform} • {row.code}</div>
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
      {/* Header & Save Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Pengaturan Order</h2>
        {/* <Button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 text-sm">
          Simpan Pengaturan
        </Button> */}
         <Button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            onClick={handleAddNew}
          >
            <Icon icon="mdi:plus" width={18} className="mr-1" />
            Tambah Sales Channels
          </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        {/* Toggle Settings */}
        {/* <ToggleSwitch
          label="Simpan order tanpa customer"
          description="ON: Input order diperbolehkan nama customer kosong, dengan default pengiriman 'Ambil di Toko'"
        />
        <ToggleSwitch
          label="Tampilkan logo di Shipping Label untuk Dropshipper / Reseller"
          description="ON: Tampilkan, OFF: Sembunyikan"
        /> */}

        {/* Sales Channels Table */}
        <div>
          <h3 className="font-semibold mb-2">Data Sales Channels</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <TableComponent columns={columns} data={salesChannels} />
          )}
         
        </div>

        {/* Custom Modal for Add/Edit Sales Channel */}
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
                  {editingChannel ? 'Edit Sales Channel' : 'Tambah Sales Channel'}
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
                    <label className="block text-sm font-medium mb-1">Nama</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Masukkan nama sales channel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Kode</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      required
                      placeholder="Masukkan kode (contoh: SHOPEE)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Deskripsi</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Masukkan deskripsi sales channel"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Platform</label>
                    <input
                      type="text"
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                      required
                      placeholder="Masukkan platform (contoh: marketplace, website, social media)"
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
                      {editingChannel ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Custom Filter & Template */}
        {/* <div>
          <h3 className="font-semibold mb-2">Custom filter di data order</h3>
          <p className="text-sm text-gray-500">Nama Filter</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Custom biaya template di form order</h3>
          <p className="text-sm text-gray-500">Nama Template</p>
        </div> */}

        {/* More Toggle Settings */}
        {/* <ToggleSwitch label="Simpan order dari Reseller / Dropshipper / Custom Customer sebagai perolehan Admin" />
        <ToggleSwitch label="Tampilkan email customer di download order" />
        <ToggleSwitch label="Tampilkan id customer di download order" />
        <ToggleSwitch label="Aktifkan input barcode marketplace" /> */}
      </div>
    </div>
  );
}
