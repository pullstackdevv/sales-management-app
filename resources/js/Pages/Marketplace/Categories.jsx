import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { productsAPI } from '@/api/products';
import { Grid, List, Search, Filter, ShoppingCart, Heart } from 'lucide-react';

export default function Categories() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('name');
    const [wishlistIds, setWishlistIds] = useState([]);

    useEffect(() => {
        // Load wishlist once
        try {
            const raw = sessionStorage.getItem('wishlist');
            const ids = raw ? JSON.parse(raw) : [];
            if (Array.isArray(ids)) setWishlistIds(ids);
        } catch {}
        fetchProducts();
    }, [selectedCategory, searchQuery, sortBy]);

    const toggleWishlist = (productId) => {
        setWishlistIds((prev) => {
            const set = new Set(prev);
            if (set.has(productId)) set.delete(productId); else set.add(productId);
            const next = Array.from(set);
            sessionStorage.setItem('wishlist', JSON.stringify(next));
            return next;
        });
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = {
                category: selectedCategory,
                search: searchQuery,
                sort: sortBy,
                per_page: 50
            };
            const response = await productsAPI.getProducts(params);
            
            // Handle different response structures
            let productsData = [];
            if (response?.data?.data) {
                // Laravel paginated response: {data: {data: [...], meta: {...}}}
                productsData = response.data.data;
            } else if (Array.isArray(response?.data)) {
                // Direct array response: {data: [...]}
                productsData = response.data;
            } else if (Array.isArray(response)) {
                // Direct array response
                productsData = response;
            }
            
            setProducts(productsData);
            // Extract unique categories from products
            const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
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
                    <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors">{product.name}</h3>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {formatPrice(product.base_price || product.price)}
                        </span>
                        <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 transform hover:scale-110" type="button">
                            <ShoppingCart className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    ); };

    const ProductListItem = ({ product }) => {
        const liked = wishlistIds.includes(product.id);
        return (
        <Link href={`/products/${product.id}`} className="block group">
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                    <div className="relative overflow-hidden rounded-lg">
                        <img
                            src={product?.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : 'https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg'}
                            alt={product.name}
                            className="w-20 h-20 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-gray-700 transition-colors">
                            {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {formatPrice(product.base_price || product.price)}
                            </span>
                            <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 transform hover:scale-110" type="button">
                                <ShoppingCart className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
                        className={`ml-2 p-2 rounded-full shadow-sm transition-all duration-200 ${liked ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
                        aria-label={liked ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
                    >
                        <Heart className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </Link>
    ); };

    return (
        <MarketplaceLayout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-light text-gray-900 mb-4">Kategori Produk</h1>
                        
                        {/* Filters */}
                        <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari produk..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                                        />
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div className="sm:w-48">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                                    >
                                        <option value="">Semua Kategori</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sort */}
                                <div className="sm:w-40">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                                    >
                                        <option value="name">Nama A-Z</option>
                                        <option value="price_asc">Harga Terendah</option>
                                        <option value="price_desc">Harga Tertinggi</option>
                                        <option value="stock">Stok Terbanyak</option>
                                    </select>
                                </div>

                                {/* View Toggle */}
                                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <>
                            {/* Results Info */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-600">
                                    Menampilkan {products.length} produk
                                    {selectedCategory && ` dalam kategori "${selectedCategory}"`}
                                    {searchQuery && ` untuk "${searchQuery}"`}
                                </p>
                            </div>

                            {/* Products Grid/List */}
                            {products.length === 0 ? (
                                <div className="text-center py-12">
                                    <Filter className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada produk ditemukan</h3>
                                    <p className="text-gray-500">Coba ubah filter atau kata kunci pencarian</p>
                                </div>
                            ) : (
                                <div className={
                                    viewMode === 'grid' 
                                        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                                        : "space-y-4"
                                }>
                                    {products.map((product) => (
                                        viewMode === 'grid' 
                                            ? <ProductCard key={product.id} product={product} />
                                            : <ProductListItem key={product.id} product={product} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
}
