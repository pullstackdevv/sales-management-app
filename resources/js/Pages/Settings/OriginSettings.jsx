import React from "react";
import { Icon } from "@iconify/react";
import TableComponent from "../../components/ui/table/TableComponent";

export default function OriginSettings() {
  const origins = [
    {
      store: "SP",
      origin: "Kemayoran Kota Jakarta Pusat",
      phone: "083867000077",
      address: "Jakarta - Indonesia",
    },
  ];

  const columns = [
    {
      key: "no",
      label: "No",
      render: (_, i) => <span>{i + 1}.</span>,
    },
    { key: "store", label: "Nama Toko" },
    { key: "origin", label: "Asal Pengiriman" },
    { key: "phone", label: "Telepon" },
    { key: "address", label: "Alamat" },
    {
      key: "actions",
      label: "",
      render: () => (
        <div className="flex gap-2 text-lg">
          <button className="text-blue-500 hover:text-blue-700">
            <Icon icon="mdi:pencil-outline" />
          </button>
          <button className="text-red-500 hover:text-red-700">
            <Icon icon="mdi:trash-can-outline" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pengaturan Supplier</h2>
      <div className="bg-white rounded-lg shadow p-6">
        {/* Tombol Tambah */}
        <div className="flex justify-end mb-4">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm">
            <Icon icon="mdi:plus" width={18} />
            Tambah Asal Pengiriman
          </button>
        </div>

        {/* Tabel */}
        <TableComponent columns={columns} data={origins} />
      </div>
    </div>
  );
}
