import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "flowbite-react";
import TableComponent from "../../components/ui/table/TableComponent";

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
  const salesChannels = [
    { name: "Tokopedia", status: "Aktif" },
    { name: "Shopee SALEPARFUM", status: "Nonaktif" },
    { name: "Shopee", status: "Aktif" },
    { name: "Whatsapp", status: "Aktif" },
    { name: "Website Lain", status: "Aktif" },
  ];

  const columns = [
    { key: "name", label: "Nama & Keterangan" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`text-xs px-2 py-1 rounded ${
            row.status === "Aktif"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (_, idx) => (
        <button className="text-blue-600 hover:text-blue-800">
          <Icon icon="mdi:pencil" width={18} />
        </button>
      ),
    },
  ];

  return (
    <div className="">
      {/* Header & Save Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Pengaturan Order</h2>
        <Button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 text-sm">
          Simpan Pengaturan
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        {/* Toggle Settings */}
        <ToggleSwitch
          label="Simpan order tanpa customer"
          description="ON: Input order diperbolehkan nama customer kosong, dengan default pengiriman 'Ambil di Toko'"
        />
        <ToggleSwitch
          label="Tampilkan logo di Shipping Label untuk Dropshipper / Reseller"
          description="ON: Tampilkan, OFF: Sembunyikan"
        />

        {/* Sales Channels Table */}
        <div>
          <h3 className="font-semibold mb-2">Data Sales Channels</h3>
          <TableComponent columns={columns} data={salesChannels} />
          <Button className="mt-3 border border-primary text-primary px-4 py-2 rounded-md text-sm hover:bg-gray-100 flex items-center">
            <Icon icon="mdi:plus" width={18} className="mr-1" />
            Tambah Sales Channels
          </Button>
        </div>

        {/* Custom Filter & Template */}
        <div>
          <h3 className="font-semibold mb-2">Custom filter di data order</h3>
          <p className="text-sm text-gray-500">Nama Filter</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Custom biaya template di form order</h3>
          <p className="text-sm text-gray-500">Nama Template</p>
        </div>

        {/* More Toggle Settings */}
        <ToggleSwitch label="Simpan order dari Reseller / Dropshipper / Custom Customer sebagai perolehan Admin" />
        <ToggleSwitch label="Tampilkan email customer di download order" />
        <ToggleSwitch label="Tampilkan id customer di download order" />
        <ToggleSwitch label="Aktifkan input barcode marketplace" />
      </div>
    </div>
  );
}
