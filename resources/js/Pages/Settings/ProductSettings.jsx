import { Button } from "flowbite-react";
import React from "react";

export default function ProductSettings() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pengaturan Produk</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <label className="w-40 font-medium">Stok Limit</label>
          <input type="number" className="border rounded px-3 py-2 w-32" value={2} readOnly />
          <span className="ml-4 text-xs text-gray-500">
            Apabila stok produk mencapai angka limit ini maka akan muncul notifikasi
          </span>
        </div>
        <div className="flex items-center mb-4">
          <label className="w-40 font-medium">Kategori Produk</label>
          <a href="#" className="text-blue-600 underline text-sm">Klik untuk setting kategori produk</a>
        </div>
        <div className="mt-6 text-right">
        <Button className="bg-primary text-white px-6 py-2 rounded-lg ">Simpan Pengaturan</Button>
        </div>
      </div>
    </div>
  );
}