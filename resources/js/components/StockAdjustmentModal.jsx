import { useState } from "react";
import { Icon } from "@iconify/react";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function StockAdjustmentModal({ 
  isOpen, 
  onClose, 
  variant, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'in',
    quantity: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.quantity || formData.quantity <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Jumlah harus lebih dari 0'
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        product_variant_id: variant.id,
        type: formData.type,
        quantity: parseInt(formData.quantity),
        notes: formData.notes || `${formData.type === 'in' ? 'Penambahan' : 'Pengurangan'} stok manual untuk ${variant.variant_label || 'Default'}`
      };

      await api.post('/stock-movements', payload);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Stok berhasil ${formData.type === 'in' ? 'ditambah' : 'dikurangi'}`,
        showConfirmButton: false,
        timer: 1500
      });
      
      // Reset form
      setFormData({
        type: 'in',
        quantity: '',
        notes: ''
      });
      
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      
      let errorMessage = 'Gagal mengubah stok';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        errorMessage = errors.join(', ');
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        type: 'in',
        quantity: '',
        notes: ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Penyesuaian Stok</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <Icon icon="material-symbols:close" className="text-xl" />
          </button>
        </div>

        {variant && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-900">
              {variant.product?.name || 'Produk'}
            </p>
            <p className="text-xs text-gray-600">
              Varian: {variant.variant_label || 'Default'} | SKU: {variant.sku}
            </p>
            <p className="text-xs text-gray-600">
              Stok saat ini: <span className="font-semibold">{variant.stock}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Jenis Penyesuaian</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="in"
                  checked={formData.type === 'in'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm text-green-600">Tambah Stok</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="out"
                  checked={formData.type === 'out'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm text-red-600">Kurangi Stok</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Jumlah*</label>
            <input
              type="number"
              min="1"
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan jumlah..."
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catatan</label>
            <textarea
              rows="3"
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Catatan penyesuaian stok (opsional)..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !formData.quantity}
              className={`flex-1 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                formData.type === 'in' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? (
                <>
                  <Icon icon="eos-icons:loading" className="text-lg" />
                  Memproses...
                </>
              ) : (
                <>
                  <Icon icon={formData.type === 'in' ? 'material-symbols:add' : 'material-symbols:remove'} />
                  {formData.type === 'in' ? 'Tambah Stok' : 'Kurangi Stok'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}