import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";

const products = [
  {
    name: "Giardini Bianco Latte",
    price: 3099000,
    stock: 0,
    variant: 1,
    category: "Perfume",
    note: "Produk Sendiri",
  },
  {
    name: "Giftset D&G Light Blue MEN EDT",
    price: 975000,
    stock: 12,
    variant: 1,
    category: "Perfume",
    note: "Produk Sendiri",
  },
  {
    name: "Ahmed Al Maghribi Azure Royal",
    price: 399000,
    stock: 19,
    variant: 1,
    category: "Perfume",
    note: "Produk Sendiri",
  },
];

export default function ProductData() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Produk</h1>

          <div className="flex gap-2">
            <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
              Impor & Ekspor
            </button>
            <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
              Filter
            </button>
            <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
              Download
            </button>
            <Link href="/product/add">
              <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1">
                <Icon icon="material-symbols:add" className="text-lg" />
                Tambah Produk
              </button>
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Cari nama, SKU, atau scan barcode..."
            className="w-full border px-4 py-2 rounded-md text-sm"
          />
        </div>

        <div className="bg-white rounded-md shadow-sm divide-y">
          <div className="grid grid-cols-12 items-center px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
            <div className="col-span-4">Produk & Harga</div>
            <div className="col-span-1">Stok</div>
            <div className="col-span-1">Varian</div>
            <div className="col-span-2">Kategori</div>
            <div className="col-span-2">Keterangan</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>

          {products.map((product, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 items-center px-4 py-3 text-sm"
            >
              <div className="col-span-4">
                <p className="text-blue-600 font-medium">{product.name}</p>
                <p className="text-gray-600">
                  Rp{product.price.toLocaleString()}
                </p>
              </div>
              <div className="col-span-1">
                <span
                  className={`text-xs font-semibold ${
                    product.stock === 0
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {product.stock === 0
                    ? "Out of stock"
                    : `${product.stock} in stock`}
                </span>
              </div>
              <div className="col-span-1">{product.variant}</div>
              <div className="col-span-2">{product.category}</div>
              <div className="col-span-2">{product.note}</div>
              <div className="col-span-2 flex justify-end gap-2 text-lg text-gray-500">
                <Link href={`/product/edit/${idx}`}>
                  <button className="hover:text-blue-600">
                    <Icon icon="mdi:pencil-outline" />
                  </button>
                </Link>
                <button className="hover:text-red-600">
                  <Icon icon="mdi:trash-outline" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
