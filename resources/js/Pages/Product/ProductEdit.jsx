import { useState } from "react";
import { Icon } from "@iconify/react";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function ProductEdit() {
  const [product, setProduct] = useState({
    name: "Giardini Bianco Latte",
    category: "Perfume",
    stockType: "self",
    description: "Giardini Bianco Latte",
    weight: 550,
    priceBuy: 2745000,
    priceSell: 3099000,
    stock: 0,
    variant: {
      sku: "GBL-PRO-SLH",
      size: "Product 100ml"
    }
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button className="text-gray-500 hover:text-gray-700" onClick={() => window.history.back()}>
            <Icon icon="material-symbols:arrow-back" width={24} />
          </button>
          <h1 className="text-2xl font-semibold">Ubah Produk</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Produk*</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md"
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

            <div className="mt-6">
              <h2 className="font-semibold mb-2">Varian 1</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input
                    type="text"
                    className="w-full border px-3 py-2 rounded-md"
                    value={product.variant.sku}
                    onChange={(e) => setProduct({ ...product, variant: { ...product.variant, sku: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ukuran</label>
                  <input
                    type="text"
                    className="w-full border px-3 py-2 rounded-md"
                    value={product.variant.size}
                    onChange={(e) => setProduct({ ...product, variant: { ...product.variant, size: e.target.value } })}
                  />
                </div>
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
                  <label className="block text-sm font-medium mb-1">Harga Beli</label>
                  <input
                    type="number"
                    className="w-full border px-3 py-2 rounded-md"
                    value={product.priceBuy}
                    onChange={(e) => setProduct({ ...product, priceBuy: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Harga Jual Normal</label>
                  <input
                    type="number"
                    className="w-full border px-3 py-2 rounded-md"
                    value={product.priceSell}
                    onChange={(e) => setProduct({ ...product, priceSell: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border p-4 rounded-md shadow-sm">
              <h2 className="font-medium mb-2">Atur Produk</h2>
              <div className="flex justify-between items-center mb-2">
                <span>Varian</span>
                <input type="checkbox" checked readOnly />
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Diskon</span>
                <input type="checkbox" readOnly />
              </div>
              <div className="flex justify-between items-center">
                <span>Harga Grosir</span>
                <input type="checkbox" readOnly />
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
              Simpan Produk
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}