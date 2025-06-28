import { useState } from "react";
import { Icon } from "@iconify/react";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function StockOpnameAdd() {
  const [rows, setRows] = useState([
    { id: 1, product: "", sistem: 0, gudang: 0, selisih: 0 },
  ]);

  const addRow = () => {
    setRows([
      ...rows,
      { id: rows.length + 1, product: "", sistem: 0, gudang: 0, selisih: 0 },
    ]);
  };

  const removeRow = (id) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => window.history.back()}>
            <Icon icon="material-symbols:arrow-back" width={24} />
          </button>
          <h1 className="text-2xl font-bold">Buat Stok Opname Baru</h1>
        </div>

        {/* Buat Button */}
        <div className="mb-4 text-right">
          <button className="bg-gray-300 px-4 py-2 text-sm rounded-md text-gray-600 cursor-not-allowed">
            Buat Stok Opname
          </button>
        </div>

        {/* Informasi Stok Opname */}
        <div className="bg-white p-5 rounded-md shadow mb-6">
          <h2 className="font-semibold text-md mb-4">Informasi Stok Opname</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Gudang*</label>
              <input
                type="text"
                disabled
                value="Gudang Utama"
                className="mt-1 w-full border px-4 py-2 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tanggal Stok Opname</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  disabled
                  value="15 Juni 2025"
                  className="w-full border px-4 py-2 rounded-md bg-gray-100"
                />
                <Icon
                  icon="material-symbols:calendar-today"
                  className="absolute right-3 top-3 text-gray-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium">Keterangan*</label>
            <textarea className="mt-1 w-full border px-4 py-2 rounded-md bg-gray-100" rows="3" />
          </div>
        </div>

        {/* Penyesuaian Stok */}
        <div className="bg-white p-5 rounded-md shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-md">Penyesuaian Stok</h2>
            <button onClick={addRow} className="text-blue-600 text-sm flex items-center gap-1">
              <Icon icon="material-symbols:add" />
              Tambah Baris
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 text-sm font-medium text-gray-600 mb-2">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Produk*</div>
            <div className="col-span-2 text-center">Jumlah Di Sistem</div>
            <div className="col-span-2 text-center">Jumlah Di Gudang*</div>
            <div className="col-span-2 text-center">Jumlah Stok Opname</div>
            <div className="col-span-1 text-right"></div>
          </div>

          {/* Table Rows */}
          {rows.map((row, index) => (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-center mb-2">
              <div className="col-span-1">{index + 1}.</div>
              <div className="col-span-4">
                <input
                  type="text"
                  placeholder="Cari produk"
                  className="w-full border px-3 py-1.5 rounded-md text-sm"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={0}
                  disabled
                  className="w-full border px-3 py-1.5 rounded-md text-sm text-center bg-gray-100"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  className="w-full border px-3 py-1.5 rounded-md text-sm text-center"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={0}
                  disabled
                  className="w-full border px-3 py-1.5 rounded-md text-sm text-center bg-gray-100"
                />
              </div>
              <div className="col-span-1 text-right">
                <button
                  onClick={() => removeRow(row.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Icon icon="mdi:trash-outline" />
                </button>
              </div>
            </div>
          ))}

          {/* Clear All Button */}
          <div className="mt-4">
            <button
              onClick={() => setRows([])}
              className="text-sm text-gray-500 hover:underline"
            >
              Hapus Semua Baris
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
