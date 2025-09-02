import React, { useState, useEffect } from 'react';
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

    const categories = [
        { id: "all", name: "Semua" },
        { id: "electronics", name: "Elektronik" },
        { id: "fashion", name: "Fashion" },
        { id: "beauty", name: "Kecantikan" },
        { id: "home", name: "Rumah Tangga" }
    ];

    const popularProducts = [
        {
            id: 1,
            name: "Smartphone Samsung Galaxy A54",
            price: 3500000,
            originalPrice: 4200000,
            rating: 4.5,
            reviewCount: 128,
            image: "/assets/images/products/dash-prd-1.jpg",
            discount: 17,
            isNew: true,
            isWishlisted: false
        },
        {
            id: 2,
            name: "Laptop ASUS VivoBook S14",
            price: 8500000,
            originalPrice: 9500000,
            rating: 4.3,
            reviewCount: 89,
            image: "/assets/images/products/dash-prd-2.jpg",
            discount: 11,
            isNew: false,
            isWishlisted: true
        },
        {
            id: 3,
            name: "Headphone Sony WH-1000XM4",
            price: 2800000,
            originalPrice: 3500000,
            rating: 4.7,
            reviewCount: 256,
            image: "/assets/images/products/dash-prd-3.jpg",
            discount: 20,
            isNew: false,
            isWishlisted: false
        },
        {
            id: 4,
            name: "Smartwatch Apple Watch Series 8",
            price: 5200000,
            originalPrice: 6500000,
            rating: 4.6,
            reviewCount: 167,
            image: "/assets/images/products/dash-prd-4.jpg",
            discount: 20,
            isNew: true,
            isWishlisted: false
        },
        {
            id: 5,
            name: "Kamera Canon EOS R6",
            price: 18500000,
            originalPrice: 22000000,
            rating: 4.8,
            reviewCount: 73,
            image: "/assets/images/products/dash-prd-1.jpg",
            discount: 16,
            isNew: false,
            isWishlisted: true
        },
        {
            id: 6,
            name: "Speaker JBL Flip 6",
            price: 1200000,
            originalPrice: 1500000,
            rating: 4.4,
            reviewCount: 94,
            image: "/assets/images/products/dash-prd-2.jpg",
            discount: 20,
            isNew: false,
            isWishlisted: false
        },
        {
            id: 7,
            name: "Tablet iPad Air 5th Gen",
            price: 7800000,
            originalPrice: 8500000,
            rating: 4.6,
            reviewCount: 142,
            image: "/assets/images/products/dash-prd-3.jpg",
            discount: 8,
            isNew: true,
            isWishlisted: false
        },
        {
            id: 8,
            name: "Gaming Mouse Logitech G Pro X",
            price: 850000,
            originalPrice: 1200000,
            rating: 4.5,
            reviewCount: 203,
            image: "/assets/images/products/dash-prd-4.jpg",
            discount: 29,
            isNew: false,
            isWishlisted: true
        }
    ];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getProducts({ per_page: 8 });
            // Laravel API returns {status: 'success', data: paginatedResults}
            // paginatedResults has a 'data' property with the actual products array
            const productsData = response.data?.data || [];
            setProducts(productsData);
            setFeaturedProducts(productsData.slice(0, 4));
        } catch (err) {
            setError('Failed to load products');
            console.error('Error fetching products:', err);
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
        return (
            <Link href={`/marketplace/products/${product.id}`} className="block">
                <div className="bg-white border border-gray-100 hover:border-gray-200 transition-colors duration-200 overflow-hidden">
                    <div className="relative">
                        <img 
                            src={product.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300'} 
                            alt={product.name}
                            className="w-full h-48 object-cover"
                        />
                    </div>
                    <div className="p-4">
                        <h3 className="text-sm text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center mb-2">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        className={`h-3 w-3 ${
                                            i < Math.floor(product.rating || 4.5) 
                                                ? 'text-yellow-400 fill-current' 
                                                : 'text-gray-300'
                                        }`} 
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base font-medium text-gray-900">
                                {formatPrice(product.base_price || product.price)}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                <ShoppingCart className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

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
                            href="/marketplace/products" 
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
                                href={`/marketplace/products?category=${category.id}`}
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
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
                            {[...Array(4)].map((_, index) => (
                                <div key={index} className="bg-white border border-gray-100 animate-pulse">
                                    <div className="bg-gray-200 h-48"></div>
                                    <div className="p-4">
                                        <div className="bg-gray-200 h-4 rounded mb-2"></div>
                                        <div className="bg-gray-200 h-3 rounded mb-2"></div>
                                        <div className="bg-gray-200 h-4 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">{error}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
                            {featuredProducts.slice(0, 4).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
};

export default Homepage;