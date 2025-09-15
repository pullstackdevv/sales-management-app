import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from '@inertiajs/react';
import { 
    Star, 
    ShoppingCart, 
    ArrowRight,
    Search,
    Filter,
    Grid,
    List
} from "lucide-react";
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { productsAPI } from '@/api/products';

const Homepage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('grid');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
    });

    // Derive categories from loaded products (fallback to string/slug if available)
    const categories = useMemo(() => {
        const map = new Map();
        // Always include "all"
        map.set('all', { id: 'all', name: 'Semua' });

        products.forEach((p) => {
            // Support various possible shapes from API
            // e.g. p.category is string | { name, slug } | { name }
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

    const fetchProducts = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                per_page: pagination.per_page,
                search: searchQuery || undefined,
                category: selectedCategory || undefined,
                sort: sortBy,
            };
            
            const response = await productsAPI.getProducts(params);
            const payload = response?.data || {};
            setProducts(payload.data || []);
            setPagination(prev => ({
                ...prev,
                current_page: payload.current_page || page,
                last_page: payload.last_page || 1,
                total: payload.total || 0,
            }));
            setError(null);
        } catch (err) {
            setError('Failed to load products');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = {
                page: 1,
                per_page: pagination.per_page,
                search: searchQuery || undefined,
                category: selectedCategory || undefined,
                sort: sortBy,
            };
            
            const fetchData = async () => {
                try {
                    setSearchLoading(true);
                    const response = await productsAPI.getProducts(params);
                    const payload = response?.data || {};
                    setProducts(payload.data || []);
                    setPagination(prev => ({
                        ...prev,
                        current_page: payload.current_page || 1,
                        last_page: payload.last_page || 1,
                        total: payload.total || 0,
                    }));
                    setError(null);
                } catch (err) {
                    setError('Failed to load products');
                    console.error('Error fetching products:', err);
                } finally {
                    setSearchLoading(false);
                }
            };
            
            fetchData();
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Effect for category and sort changes (immediate)
    useEffect(() => {
        const params = {
            page: 1,
            per_page: pagination.per_page,
            search: searchQuery || undefined,
            category: selectedCategory || undefined,
            sort: sortBy,
        };
        
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await productsAPI.getProducts(params);
                const payload = response?.data || {};
                setProducts(payload.data || []);
                setPagination(prev => ({
                    ...prev,
                    current_page: payload.current_page || 1,
                    last_page: payload.last_page || 1,
                    total: payload.total || 0,
                }));
                setError(null);
            } catch (err) {
                setError('Failed to load products');
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [selectedCategory, sortBy]);

    // Effect for pagination
    useEffect(() => {
        const params = {
            page: pagination.current_page,
            per_page: pagination.per_page,
            search: searchQuery || undefined,
            category: selectedCategory || undefined,
            sort: sortBy,
        };
        
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await productsAPI.getProducts(params);
                const payload = response?.data || {};
                setProducts(payload.data || []);
                setPagination(prev => ({
                    ...prev,
                    current_page: payload.current_page || pagination.current_page,
                    last_page: payload.last_page || 1,
                    total: payload.total || 0,
                }));
                setError(null);
            } catch (err) {
                setError('Failed to load products');
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };
        
        if (pagination.current_page > 1) {
            fetchData();
        }
    }, [pagination.current_page]);

    // Initial load
    useEffect(() => {
        const params = {
            page: 1,
            per_page: pagination.per_page,
            search: searchQuery || undefined,
            category: selectedCategory || undefined,
            sort: sortBy,
        };
        
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await productsAPI.getProducts(params);
                const payload = response?.data || {};
                setProducts(payload.data || []);
                setPagination(prev => ({
                    ...prev,
                    current_page: payload.current_page || 1,
                    last_page: payload.last_page || 1,
                    total: payload.total || 0,
                }));
                setError(null);
            } catch (err) {
                setError('Failed to load products');
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);


    const currencyFormatter = useMemo(() => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }), []);

    const formatPrice = useCallback((price) => currencyFormatter.format(price), [currencyFormatter]);

    const handleSearch = (value) => {
        setSearchQuery(value);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSortChange = (sort) => {
        setSortBy(sort);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const setCurrentPage = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };


    const ProductCard = memo(({ product }) => {
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
                    </div>
                    <div className="p-5">
                        <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors">{product.name}</h3>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {formatPrice(product.base_price || product.price)}
                            </span>
                            <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 transform hover:scale-110">
                                <ShoppingCart className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </Link>
        );
    });

    const ProductListItem = memo(({ product }) => {
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
                    </div>
                </div>
            </Link>
        );
    });

    if (loading) {
        return (
            <MarketplaceLayout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                            onClick={fetchProducts}
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
            {/* Hero Section */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-3xl font-light text-gray-900 mb-4">
                            Koleksi Produk Terbaik
                        </h1>
                        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                            Temukan produk berkualitas dengan harga terbaik
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="max-w-md mx-auto relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-none focus:outline-none focus:border-gray-400"
                                autoComplete="off"
                            />
                            {searchLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Categories Filter */}
                    {categories.length > 1 && (
                        <div className="mb-6">
                            <div className="flex flex-wrap justify-center gap-2">
                                <button
                                    onClick={() => handleCategoryChange('')}
                                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                        selectedCategory === ''
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    Semua
                                </button>
                                {categories.slice(1).map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategoryChange(cat.id)}
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

                    {/* Filters and Controls */}
                    <div className="bg-white rounded-lg border border-gray-100 p-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            {/* Sort */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm text-gray-600">Urutkan:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
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
                                    className={`p-2 ${
                                        viewMode === 'grid'
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${
                                        viewMode === 'list'
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                                    {selectedCategory && ` dalam kategori "${categories.find(c => c.id === selectedCategory)?.name}"`}
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

                            {/* Pagination */}
                            {pagination.last_page > 1 && (
                                <div className="flex justify-center items-center space-x-4 mt-12">
                                    <button
                                        onClick={() => {
                                            const prev = Math.max(1, pagination.current_page - 1);
                                            setCurrentPage(prev);
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
                                            const next = Math.min(pagination.last_page, pagination.current_page + 1);
                                            setCurrentPage(next);
                                        }}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Selanjutnya →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
};

export default Homepage;