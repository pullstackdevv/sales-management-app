import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from '@inertiajs/react';
import { 
    Star, 
    ShoppingCart, 
    ArrowRight
} from "lucide-react";
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { productsAPI } from '@/api/products';

const Homepage = () => {
    const [activeCategory, setActiveCategory] = useState("all");
    const [products, setProducts] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getProducts({ per_page: 8 });
            // Laravel API returns {status: 'success', data: paginatedResults}
            // paginatedResults has a 'data' property with the actual products array
            const productsData = response?.data?.data || [];
            setProducts(productsData);
            setFeaturedProducts(productsData.slice(0, 4));
            setError(null);
        } catch (err) {
            setError('Failed to load products');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isActive = true;
        (async () => {
            await fetchProducts();
        })();
        return () => {
            isActive = false;
        };
    }, [fetchProducts]);


    const currencyFormatter = useMemo(() => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }), []);

    const formatPrice = useCallback((price) => currencyFormatter.format(price), [currencyFormatter]);

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
                        <Link 
                            href="/products" 
                            className="inline-flex items-center px-6 py-3 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
                        >
                            Lihat Semua Produk
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="py-16 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-light text-gray-900 mb-4">
                            Kategori
                        </h2>
                    </div>
                    <div className="flex justify-center space-x-8">
                        {categories.slice(1).map((category) => (
                            <Link 
                                key={category.id} 
                                href={`/products?category=${category.id}`}
                                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                            >
                                {category.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Popular Products */}
            <div className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-light text-gray-900 mb-4">Produk Populer</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
                        {featuredProducts.slice(0, 4).map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
};

export default Homepage;