import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Search, Star, ShoppingCart, Heart } from 'lucide-react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { productsAPI } from '@/api/products';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  const [wishlistIds, setWishlistIds] = useState([]);

  // Derive categories from currently loaded products
  const categories = useMemo(() => {
    const map = new Map();
    map.set('all', { id: 'all', name: 'Semua' });

    products.forEach((p) => {
      const catObj = p.category || p.product_category || null;
      let id = null;
      let name = null;
      if (catObj && typeof catObj === 'object') {
        id = catObj.slug || catObj.name || null;
        name = catObj.name || catObj.slug || null;
      } else if (typeof catObj === 'string') {
        id = catObj;
        name = catObj;
      }
      if (id && name && !map.has(id)) {
        map.set(id, { id, name });
      }
    });

    return Array.from(map.values());
  }, [products]);

  const currentPage = pagination.current_page;
  const setCurrentPage = (page) => {
    setPagination((prev) => ({ ...prev, current_page: page }));
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    const params = new URLSearchParams(window.location.search);
    if (categoryId === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    // load wishlist from session once on mount
    try {
      const raw = sessionStorage.getItem('wishlist');
      const ids = raw ? JSON.parse(raw) : [];
      if (Array.isArray(ids)) setWishlistIds(ids);
    } catch {}
    fetchProducts();
  }, [pagination.current_page, selectedCategory, sortBy, searchTerm]);

  // Initialize selectedCategory from URL query (?category=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryFromUrl = params.get('category');
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
      setCurrentPage(1);
    }
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async (page = pagination.current_page) => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 12,
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sort: sortBy,
      };

      const res = await productsAPI.getProducts(params);
      // Response: { status: 'success', data: { current_page: 1, data: [...], last_page, total } }
      const payload = res.data || {};
      setProducts(payload.data || []);
      setPagination((prev) => ({
        ...prev,
        current_page: payload.current_page || page,
        last_page: payload.last_page || 1,
        total: payload.total || 0,
      }));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (v) => {
    setSearchTerm(v);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  const toggleWishlist = (productId) => {
    setWishlistIds((prev) => {
      const set = new Set(prev);
      if (set.has(productId)) set.delete(productId); else set.add(productId);
      const next = Array.from(set);
      sessionStorage.setItem('wishlist', JSON.stringify(next));
      return next;
    });
  };

  const ProductCard = ({ product }) => {
    const liked = wishlistIds.includes(product.id);
    return (
      <Link href={`/products/${product.id}`} className="block group">
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          <div className="relative overflow-hidden">
            <img
              src={product?.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : 'https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg'}
              alt={product.name}
              className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
              className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-all duration-200 ${liked ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
              aria-label={liked ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
            >
              <Heart className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {formatPrice(product.base_price ?? product.price ?? 0)}
              </span>
              <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 transform hover:scale-110">
                <ShoppingCart className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading && products.length === 0) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </MarketplaceLayout>
    );
  }

  if (error) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={() => fetchProducts(currentPage)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Top bar (title + search) */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <h1 className="text-2xl font-light text-gray-900 mb-8 text-center">
                Produk
              </h1>

              <div className="mb-8">
                <div className="max-w-md mx-auto relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-none focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Categories filter */}
              {categories.length > 1 && (
                <div className="mb-6">
                  <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product grid + pagination */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? 'Loading...' : `Menampilkan ${products.length} produk`}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Tidak ada produk yang ditemukan</p>
            </div>
          )}

          {pagination.last_page > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-12">
              <button
                onClick={() => {
                  const prev = Math.max(1, pagination.current_page - 1);
                  setCurrentPage(prev);
                  fetchProducts(prev);
                }}
                disabled={pagination.current_page === 1}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Sebelumnya
              </button>

              <span className="text-sm text-gray-500">
                {pagination.current_page} dari {pagination.last_page}
              </span>

              <button
                onClick={() => {
                  const next = Math.min(
                    pagination.last_page,
                    pagination.current_page + 1
                  );
                  setCurrentPage(next);
                  fetchProducts(next);
                }}
                disabled={pagination.current_page === pagination.last_page}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya →
              </button>
            </div>
          )}
        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default ProductList;
