import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from '@inertiajs/react';
import { 
    Search,
    Filter,
    Grid,
    List
} from "lucide-react";
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { productsAPI } from '@/api/products';
// Removed cart functionality from homepage cards

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
        per_page: 1000, // Set high value to fetch all products
        total: 0,
    });
    // Removed: addToCart integration on homepage cards

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
                    const productsData = payload.data || [];
                    
                    // Debug log for price issues
                    console.log('Search fetch - Products received:', productsData.length);
                    if (productsData.length > 0) {
                        console.log('Sample product price fields:', {
                            id: productsData[0].id,
                            name: productsData[0].name,
                            price: productsData[0].price,
                            base_price: productsData[0].base_price,
                            min_price: productsData[0].min_price,
                            selling_price: productsData[0].selling_price
                        });
                    }
                    
                    setProducts(productsData);
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

    // Effect for pagination - Disabled when showing all products
    useEffect(() => {
        // Skip pagination effect when per_page is set to show all products
        if (pagination.per_page >= 1000) return;
        
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
                const productsData = payload.data || [];
                
                // Debug log for initial load
                console.log('Initial load - Products received:', productsData.length);
                if (productsData.length > 0) {
                    console.log('Sample product from initial load:', {
                        id: productsData[0].id,
                        name: productsData[0].name,
                        price: productsData[0].price,
                        base_price: productsData[0].base_price,
                        min_price: productsData[0].min_price,
                        selling_price: productsData[0].selling_price
                    });
                }
                
                setProducts(productsData);
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


    // Robust price extraction function to handle various price field formats
    const getProductPrice = useCallback((product) => {
        if (!product) {
            console.warn('getProductPrice: product is null/undefined');
            return 0;
        }

        // Try different price fields in order of preference
        const priceFields = [
            product.price,
            product.base_price, 
            product.min_price,
            product.selling_price,
            product.regular_price
        ];

        for (const priceField of priceFields) {
            if (priceField !== null && priceField !== undefined && priceField !== '') {
                // Convert to number if it's a string
                const numPrice = typeof priceField === 'string' ? parseFloat(priceField) : priceField;
                
                // Validate that it's a positive number
                if (!isNaN(numPrice) && numPrice > 0) {
                    return numPrice;
                }
            }
        }

        // Log when no valid price is found for debugging
        console.warn('getProductPrice: No valid price found for product:', {
            id: product.id,
            name: product.name,
            price: product.price,
            base_price: product.base_price,
            min_price: product.min_price,
            selling_price: product.selling_price,
            regular_price: product.regular_price
        });
        
        return 0;
    }, []);

    const currencyFormatter = useMemo(() => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }), []);

    const formatPrice = useCallback((price) => {
        // Ensure price is a valid number
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        
        if (isNaN(numPrice) || numPrice < 0) {
            return 'Harga tidak tersedia';
        }
        
        if (numPrice === 0) {
            return 'Hubungi untuk harga';
        }
        
        return currencyFormatter.format(numPrice);
    }, [currencyFormatter]);

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

    // Client-side sorting as fallback
    const sortedProducts = useMemo(() => {
        if (!products || products.length === 0) return [];
        
        const sorted = [...products];
        
        switch (sortBy) {
            case 'name':
                return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            case 'price_asc':
                return sorted.sort((a, b) => {
                    const priceA = getProductPrice(a);
                    const priceB = getProductPrice(b);
                    return priceA - priceB;
                });
            case 'price_desc':
                return sorted.sort((a, b) => {
                    const priceA = getProductPrice(a);
                    const priceB = getProductPrice(b);
                    return priceB - priceA;
                });
            case 'stock':
                return sorted.sort((a, b) => {
                    const stockA = a.stock || 0;
                    const stockB = b.stock || 0;
                    return stockB - stockA;
                });
            default:
                return sorted;
        }
    }, [products, sortBy]);

    const setCurrentPage = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };


    const ProductCard = memo(({ product }) => {
        return (
            <Link href={`/products/${product.id}`} className="block group">
                <div className="bg-white rounded-lg shadow-sm hover:shadow-lg border border-gray-100 hover:border-blue-200 transition-all duration-300 overflow-hidden h-full flex flex-col">
                    {/* Image Container - Fixed height */}
                    <div className="relative overflow-hidden bg-gray-100 h-40 sm:h-44">
                        <img 
                            src={product?.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : 'https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg'} 
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300"></div>
                    </div>
                    
                    {/* Content Container */}
                    <div className="p-2.5 sm:p-3 flex flex-col flex-grow">
                        {/* Product Name */}
                        <h3 className="text-xs sm:text-xs font-medium text-gray-900 mb-1.5 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors flex-grow">{product.name}</h3>
                        
                        {/* Price */}
                        <div className="flex items-end gap-1">
                            <span className="text-sm sm:text-sm font-bold text-gray-900">
                                {formatPrice(getProductPrice(product))}
                            </span>
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
                    <div className="flex items-center gap-4 p-4 sm:p-4">
                        <div className="relative overflow-hidden rounded-lg">
                            <img
                                src={product?.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : 'https://png.pngtree.com/png-vector/20221125/ourmid/pngtree-no-image-available-icon-flatvector-illustration-blank-avatar-modern-vector-png-image_40962406.jpg'}
                                alt={product.name}
                                className="w-24 h-24 sm:w-20 sm:h-20 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-sm font-medium text-gray-900 mb-2 sm:mb-1 line-clamp-2 group-hover:text-gray-700 transition-colors">
                                {product.name}
                            </h3>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {formatPrice(getProductPrice(product))}
                                </span>
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-3 sm:mb-4">
                            Koleksi Produk Terbaik
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                            Temukan produk berkualitas dengan harga terbaik
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="max-w-lg mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                                autoComplete="off"
                            />
                            {searchLoading && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Categories Filter */}
                    {categories.length > 1 && (
                        <div className="mb-6">
                            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                                <button
                                    onClick={() => handleCategoryChange('')}
                                    className={`px-4 py-2 sm:px-3 sm:py-1 text-base sm:text-sm rounded-full border transition-colors ${
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
                                        className={`px-4 py-2 sm:px-3 sm:py-1 text-base sm:text-sm rounded-full border transition-colors ${
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
                    <div className="bg-white rounded-lg border border-gray-100 p-4 sm:p-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            {/* Sort */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <label className="text-base sm:text-sm text-gray-600 whitespace-nowrap">Urutkan:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="flex-1 sm:flex-none px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
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
                                    className={`p-3 sm:p-2 ${
                                        viewMode === 'grid'
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Grid className="h-5 w-5 sm:h-4 sm:w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 sm:p-2 ${
                                        viewMode === 'list'
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <List className="h-5 w-5 sm:h-4 sm:w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <>
                            {/* Results Info */}
                            <div className="mb-6">
                                <p className="text-base sm:text-sm text-gray-600 px-2 sm:px-0">
                                    Menampilkan {sortedProducts.length} produk
                                    {selectedCategory && ` dalam kategori "${categories.find(c => c.id === selectedCategory)?.name}"`}
                                    {searchQuery && ` untuk "${searchQuery}"`}
                                </p>
                            </div>

                            {/* Products Grid/List */}
                            {sortedProducts.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <Filter className="mx-auto h-16 w-16 sm:h-12 sm:w-12 text-gray-300 mb-4" />
                                    <h3 className="text-xl sm:text-lg font-medium text-gray-900 mb-2">Tidak ada produk ditemukan</h3>
                                    <p className="text-base sm:text-sm text-gray-500">Coba ubah kata kunci pencarian atau filter</p>
                                </div>
                            ) : (
                                <div className={
                                    viewMode === 'grid'
                                        ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"
                                        : "space-y-4"
                                }>
                                    {sortedProducts.map((product) => (
                                        viewMode === 'grid'
                                            ? <ProductCard key={product.id} product={product} />
                                            : <ProductListItem key={product.id} product={product} />
                                    ))}
                                </div>
                            )}

                            {/* Pagination - Hidden when showing all products */}
                            {pagination.last_page > 1 && pagination.per_page < 1000 && (
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