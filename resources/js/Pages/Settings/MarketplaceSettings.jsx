import { useEffect, useState } from "react";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function MarketplaceSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    marketplace_admin_fee: '',
    marketplace_insurance_fee: '',
    marketplace_promo_fee: '',
    marketplace_promo_fee_max: '',
    marketplace_shipping_fee: '',
    marketplace_shipping_fee_max: '',
    marketplace_process_fee: '',
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/marketplace-settings");
      if (res.data?.success) {
        const data = res.data.data || {};
        setForm({
          marketplace_admin_fee: data.marketplace_admin_fee ?? '',
          marketplace_insurance_fee: data.marketplace_insurance_fee ?? '',
          marketplace_promo_fee: data.marketplace_promo_fee ?? '',
          marketplace_promo_fee_max: data.marketplace_promo_fee_max ?? '',
          marketplace_shipping_fee: data.marketplace_shipping_fee ?? '',
          marketplace_shipping_fee_max: data.marketplace_shipping_fee_max ?? '',
          marketplace_process_fee: data.marketplace_process_fee ?? '',
        });
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || "Failed to load settings";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/marketplace-settings", form);
      if (res.data?.success) {
        Swal.fire("Success", "Settings saved successfully", "success");
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || "Failed to save settings";
      Swal.fire("Error", msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const generatePrices = async () => {
    const result = await Swal.fire({
      title: "Generate Marketplace Prices?",
      text: "Ini akan menghitung ulang dan menimpa harga marketplace untuk semua varian produk berdasarkan pengaturan saat ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Generate",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setGenerating(true);
      try {
        const res = await api.post("/marketplace-settings/generate");
        if (res.data?.success) {
          Swal.fire("Success", res.data.message, "success");
        }
      } catch (e) {
        console.error(e);
        const msg = e.response?.data?.message || "Failed to generate prices";
        Swal.fire("Error", msg, "error");
      } finally {
        setGenerating(false);
      }
    }
  };

  if (loading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Marketplace Price Settings</h2>
        <button
          type="button"
          onClick={generatePrices}
          disabled={saving || generating}
          className="inline-flex items-center px-4 py-3 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 active:bg-green-900 focus:outline-none focus:border-green-900 focus:ring ring-green-300 disabled:opacity-25 transition ease-in-out duration-150"
        >
          {generating ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          Generate Marketplace Price
        </button>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Fee */}
          <div>
            <label htmlFor="marketplace_admin_fee" className="block text-sm font-medium text-gray-700 mb-1">
              Marketplace Admin Fee (%)
            </label>
            <input
              id="marketplace_admin_fee"
              name="marketplace_admin_fee"
              type="number"
              step="0.01"
              value={form.marketplace_admin_fee}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">Default: 10%</p>
          </div>

          {/* Insurance Fee */}
          <div>
            <label htmlFor="marketplace_insurance_fee" className="block text-sm font-medium text-gray-700 mb-1">
              Marketplace Insurance Fee (%)
            </label>
            <input
              id="marketplace_insurance_fee"
              name="marketplace_insurance_fee"
              type="number"
              step="0.01"
              value={form.marketplace_insurance_fee}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">Default: 0.75%</p>
          </div>

          {/* Promo Fee */}
          <div>
            <label htmlFor="marketplace_promo_fee" className="block text-sm font-medium text-gray-700 mb-1">
              Marketplace Promo Fee (%)
            </label>
            <input
              id="marketplace_promo_fee"
              name="marketplace_promo_fee"
              type="number"
              step="0.01"
              value={form.marketplace_promo_fee}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">Default: 4.5%</p>
          </div>

          {/* Promo Fee Max */}
          <div>
            <label htmlFor="marketplace_promo_fee_max" className="block text-sm font-medium text-gray-700 mb-1">
              Marketplace Promo Fee Max Amount (Rp)
            </label>
            <input
              id="marketplace_promo_fee_max"
              name="marketplace_promo_fee_max"
              type="number"
              value={form.marketplace_promo_fee_max}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">Default: 60000</p>
          </div>

          {/* Shipping Fee */}
          <div>
            <label htmlFor="marketplace_shipping_fee" className="block text-sm font-medium text-gray-700 mb-1">
              Marketplace Shipping Fee (%)
            </label>
            <input
              id="marketplace_shipping_fee"
              name="marketplace_shipping_fee"
              type="number"
              step="0.01"
              value={form.marketplace_shipping_fee}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">Default: 4%</p>
          </div>

          {/* Shipping Fee Max */}
          <div>
            <label htmlFor="marketplace_shipping_fee_max" className="block text-sm font-medium text-gray-700 mb-1">
              Marketplace Shipping Fee Max Amount (Rp)
            </label>
            <input
              id="marketplace_shipping_fee_max"
              name="marketplace_shipping_fee_max"
              type="number"
              value={form.marketplace_shipping_fee_max}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">Default: 40000</p>
          </div>

          {/* Process Fee */}
          <div>
            <label htmlFor="marketplace_process_fee" className="block text-sm font-medium text-gray-700 mb-1">
              Marketplace Process Fee (Fixed Rp)
            </label>
            <input
              id="marketplace_process_fee"
              name="marketplace_process_fee"
              type="number"
              value={form.marketplace_process_fee}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">Default: 1500</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || generating}
            className="inline-flex items-center px-4 py-3 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
          >
            {saving ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}