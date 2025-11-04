import React, { useState, useEffect } from "react";
import { Button } from "flowbite-react";
import axios from "axios";
import Swal from "sweetalert2";

export default function ProductSettings() {
  const [stockLimit, setStockLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStockLimit();
  }, []);

  const fetchStockLimit = async () => {
    try {
      const res = await axios.get('/api/product-settings');
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        // Cari setting dengan nama 'stock_limit'
        const stockSetting = res.data.data.find(setting => setting.setting_name === 'stock_limit');
        if (stockSetting) {
          setStockLimit(stockSetting.setting_value || '');
        }
      }
    } catch (error) {
      console.error('Error fetching stock limit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Cek apakah sudah ada setting stock_limit
      const checkResponse = await axios.get('/api/product-settings');
      const existingSetting = checkResponse.data.data?.find(setting => setting.setting_name === 'stock_limit');
      
      const data = {
        setting_name: 'stock_limit',
        setting_value: stockLimit,
        description: 'Batas minimum stok untuk alert',
        is_active: true
      };

      let saveResponse;
      if (existingSetting) {
        saveResponse = await axios.put(`/api/product-settings/${existingSetting.id}`, data);
      } else {
        saveResponse = await axios.post('/api/product-settings', data);
      }
      
      if (saveResponse.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: saveResponse.data.message || 'Pengaturan stock alert berhasil disimpan!'
        });
        fetchStockLimit();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.response?.data?.message || 'Terjadi kesalahan!'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Settings</h1>
        <p className="text-gray-600">Pengaturan batas minimum stok untuk alert global</p>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batas Minimum Stok
            </label>
            <div className="flex space-x-3">
              <input
                type="number"
                value={stockLimit}
                onChange={(e) => setStockLimit(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan batas minimum stok"
                min="0"
              />
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Sistem akan memberikan alert ketika stok produk mencapai batas ini
            </p>
          </div>
        </div>
      )}
    </div>
  );
}