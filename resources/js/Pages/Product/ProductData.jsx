import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import api from "@/api/axios";

export default function ProductData() {
  const [products, setProducts] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);

  useEffect(() => {
    api.get("/products").then((response) => {
      setProducts(response.data.data.data); // Adjust if data nesting is different
    });
  }, []);

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
            <div className="col-span-2">SKU</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>

          {products.map((product, idx) => {
            const totalStock = product.variants?.reduce(
              (sum, v) => sum + v.stock,
              0
            );

            return (
              <div key={product.id}>
                <div className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                  <div className="col-span-4">
                    <p className="text-blue-600 font-medium">{product.name}</p>
                    <p className="text-gray-600">
                      Rp{parseInt(product.base_price).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <span
                      className={`text-xs font-semibold ${
                        totalStock === 0 ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {totalStock === 0
                        ? "Out of stock"
                        : `${totalStock} in stock`}
                    </span>
                  </div>
                  <div className="col-span-1">{product.variants?.length || 0}</div>
                  <div className="col-span-2">{product.sku}</div>
                  <div className="col-span-2">
                    {product.is_active ? (
                      <span className="bg-green-100 text-green-600 px-2 py-1 text-xs rounded">
                        Aktif
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 text-xs rounded">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2 text-lg text-gray-500">
                    <button
                      className="hover:text-blue-600"
                      onClick={() =>
                        setExpandedProduct(
                          expandedProduct === product.id ? null : product.id
                        )
                      }
                    >
                      <Icon icon="mdi:eye-outline" />
                    </button>
                    <Link href={`/product/edit/${product.id}`}>
                      <button className="hover:text-blue-600">
                        <Icon icon="mdi:pencil-outline" />
                      </button>
                    </Link>
                    <button className="hover:text-red-600">
                      <Icon icon="mdi:trash-outline" />
                    </button>
                  </div>
                </div>

                {expandedProduct === product.id && (
                  <div className="px-8 py-2 bg-gray-50 text-sm">
                    <table className="w-full text-left border mt-2 text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-1">Varian</th>
                          <th className="px-2 py-1">SKU</th>
                          <th className="px-2 py-1">Harga</th>
                          <th className="px-2 py-1">Stok</th>
                          <th className="px-2 py-1">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants?.map((variant) => (
                          <tr key={variant.id}>
                            <td className="px-2 py-1">{variant.variant_label}</td>
                            <td className="px-2 py-1">{variant.sku}</td>
                            <td className="px-2 py-1">Rp{parseInt(variant.price).toLocaleString()}</td>
                            <td className="px-2 py-1">{variant.stock}</td>
                            <td className="px-2 py-1">
                              {variant.is_active ? (
                                <span className="text-green-600">Aktif</span>
                              ) : (
                                <span className="text-gray-500">Nonaktif</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
