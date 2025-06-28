import { useState } from "react";
import { Icon } from "@iconify/react";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function ProductAdd() {
  const [product, setProduct] = useState({
    name: "",
    category: "",
    stockType: "self",
    description: "",
    weight: 0,
    priceBuy: 0,
    priceSell: 0,
    stock: 0,
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => window.history.back()}
          >
            <Icon icon="material-symbols:arrow-back" width={24} />
          </button>
          <h1 className="text-2xl font-semibold">Tambah Produk</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Produk*</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md"
                placeholder="Masukkan nama produk..."
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md"
                placeholder="Contoh: Perfume"
                value={product.category}
                onChange={(e) => setProduct({ ...product, category: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi*</label>
              <textarea
                rows="4"
                className="w-full border px-3 py-2 rounded-md"
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Berat (gr)</label>
                <input
                  type="number"
                  className="w-full border px-3 py-2 rounded-md"
                  value={product.weight}
                  onChange={(e) => setProduct({ ...product, weight: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stok</label>
                <input
                  type="number"
                  className="w-full border px-3 py-2 rounded-md"
                  value={product.stock}
                  onChange={(e) => setProduct({ ...product, stock: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border p-4 rounded-md shadow-sm">
              <h2 className="font-medium mb-2">Atur Produk</h2>
              <div className="flex justify-between items-center mb-2">
                <span>Varian</span>
                <input type="checkbox" />
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Diskon</span>
                <input type="checkbox" />
              </div>
              <div className="flex justify-between items-center">
                <span>Harga Grosir</span>
                <input type="checkbox" />
              </div>
            </div>

            <div className="border p-4 rounded-md shadow-sm">
              <h2 className="font-medium mb-2">Atur Privor & Storefront</h2>
              <div className="flex justify-between items-center mb-2">
                <span>Publish</span>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="flex justify-between items-center">
                <span>Tampilkan Stok</span>
                <input type="checkbox" defaultChecked />
              </div>
            </div>

            <button className="w-full py-2 bg-blue-600 text-white rounded-md">
              Tambah Produk
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}