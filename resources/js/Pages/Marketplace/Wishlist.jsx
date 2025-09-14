import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { productsAPI } from '@/api/products';
import { ShoppingCart, Heart, Trash2 } from 'lucide-react';

export default function Wishlist() {
  const [wishlistIds, setWishlistIds] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist IDs from session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('wishlist');
      const ids = raw ? JSON.parse(raw) : [];
      setWishlistIds(Array.isArray(ids) ? ids : []);
    } catch {
      setWishlistIds([]);
    }
  }, []);

  // Fetch products for wishlist IDs
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (!wishlistIds || wishlistIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await productsAPI.getProducts({ ids: wishlistIds.join(','), per_page: wishlistIds.length });
        let productsData = [];
        if (response?.data?.data) {
          productsData = response.data.data;
        } else if (Array.isArray(response?.data)) {
          productsData = response.data;
        } else if (Array.isArray(response)) {
          productsData = response;
        }
        // Keep order by wishlistIds
        const byId = new Map(productsData.map(p => [p.id, p]));
        const ordered = wishlistIds.map(id => byId.get(id)).filter(Boolean);
        setProducts(ordered);
      } catch (e) {
        console.error('Failed to load wishlist products', e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlistProducts();
  }, [wishlistIds]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }), []);
  const formatPrice = useCallback((price) => currencyFormatter.format(price || 0), [currencyFormatter]);

  const removeFromWishlist = (productId) => {
    setWishlistIds((prev) => {
      const next = prev.filter(id => id !== productId);
      sessionStorage.setItem('wishlist', JSON.stringify(next));
      return next;
    });
  };

  const ProductCard = ({ product }) => {
    const img = product?.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : 'https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg';
    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
        <div className="relative overflow-hidden">
          <Link href={`/products/${product.id}`} className="block">
            <img src={img} alt={product.name} className="w-full h-52 object-cover transition-transform duration-300 hover:scale-105" />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300"></div>
          </Link>
          <button
            type="button"
            onClick={() => removeFromWishlist(product.id)}
            className="absolute top-3 right-3 p-2 rounded-full shadow-sm bg-white text-red-500 hover:bg-red-50 transition-colors"
            title="Hapus dari Wishlist"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2 leading-relaxed">
            <Link href={`/products/${product.id}`} className="hover:text-gray-700 transition-colors">{product.name}</Link>
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(product.base_price || product.price)}
            </span>
            <Link href={`/products/${product.id}`} className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 transform hover:scale-110" title="Lihat Produk">
              <ShoppingCart className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MarketplaceLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-light text-gray-900">Wishlist</h1>
            <p className="text-sm text-gray-500">Produk yang kamu sukai akan tampil di sini.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada produk di wishlist</h3>
              <p className="text-gray-500">Klik ikon hati pada produk untuk menambahkannya ke wishlist</p>
              <div className="mt-6">
                <Link href="/products" className="inline-block px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">Jelajahi Produk</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MarketplaceLayout>
  );
}
