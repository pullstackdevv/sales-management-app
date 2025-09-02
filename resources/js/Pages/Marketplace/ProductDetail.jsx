import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Star, 
    Minus, 
    Plus, 
    ShoppingCart,
    CheckCircle
} from 'lucide-react';
import { productsAPI } from '@/api/products';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { usePage } from '@inertiajs/react';

export default function ProductDetail() {
    const { id } = usePage().props;
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getProduct(id);
            // Laravel API returns {status: 'success', data: product}
            setProduct(response.data || response);
        } catch (err) {
            setError('Failed to load product details');
            console.error('Error fetching product:', err);
        } finally {
            setLoading(false);
        }
    };

    // Mock product data - nanti akan diambil dari API
    const mockProduct = {
        id: 1,
        name: "Smartphone Samsung Galaxy A54 5G",
        price: 3500000,
        originalPrice: 4200000,
        rating: 4.5,
        reviewCount: 128,
        soldCount: 2450,
        stock: 15,
        images: [
            "/assets/images/products/dash-prd-1.jpg",
            "/assets/images/products/dash-prd-2.jpg",
            "/assets/images/products/dash-prd-3.jpg",
            "/assets/images/products/dash-prd-4.jpg"
        ],
        description: "Samsung Galaxy A54 5G adalah smartphone terbaru dengan performa tinggi dan kamera berkualitas. Dilengkapi dengan layar AMOLED 6.4 inch, chipset Exynos 1380, dan kamera triple 50MP yang memukau.",
        specifications: {
            "Layar": "6.4 inch AMOLED, 1080 x 2400 pixels",
            "Processor": "Exynos 1380 Octa-core",
            "RAM": "8GB",
            "Storage": "128GB (expandable up to 1TB)",
            "Kamera Belakang": "50MP + 12MP + 5MP",
            "Kamera Depan": "32MP",
            "Baterai": "5000mAh, 25W Fast Charging",
            "OS": "Android 13, One UI 5.1",
            "Warna": "Awesome Black, Awesome White, Awesome Green"
        },
        features: [
            "5G Connectivity",
            "IP67 Water & Dust Resistance",
            "25W Fast Charging",
            "Wireless PowerShare",
            "Samsung Knox Security",
            "Dolby Atmos Sound"
        ],
        reviews: [
            {
                id: 1,
                user: "Ahmad Rizki",
                rating: 5,
                date: "2024-01-15",
                comment: "Produk sangat bagus, pengiriman cepat dan aman. Smartphone ini memiliki performa yang luar biasa untuk gaming dan fotografi.",
                helpful: 12
            },
            {
                id: 2,
                user: "Siti Nurhaliza",
                rating: 4,
                date: "2024-01-10",
                comment: "Kamera sangat jernih, baterai tahan lama. Hanya sedikit masalah dengan fingerprint sensor yang kadang tidak responsif.",
                helpful: 8
            },
            {
                id: 3,
                user: "Budi Santoso",
                rating: 5,
                date: "2024-01-08",
                comment: "Worth it banget untuk harga segini. Performa smooth, kamera bagus, dan design yang elegan.",
                helpful: 15
            }
        ]
    };

    // Use fetched product or fallback to mock data
    const currentProduct = product || mockProduct;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const discount = currentProduct.originalPrice ? Math.round(((currentProduct.originalPrice - (currentProduct.base_price || currentProduct.price)) / currentProduct.originalPrice) * 100) : 0;

    const addToCart = () => {
        if (currentProduct.is_active !== false) {
            alert(`${currentProduct.name} berhasil ditambahkan ke keranjang!`);
        }
    };

    const buyNow = () => {
        if (currentProduct.is_active !== false) {
            alert(`Mengarahkan ke halaman checkout untuk ${currentProduct.name}`);
        }
    };

    if (loading) {
        return (
            <MarketplaceLayout>
                <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </MarketplaceLayout>
        );
    }

    if (error || !currentProduct) {
        return (
            <MarketplaceLayout>
                <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 text-lg mb-4">{error || 'Product not found'}</p>
                        <Link 
                            href="/marketplace"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Back to Marketplace
                        </Link>
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout>
            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Product Image */}
                        <div className="space-y-4">
                            <div className="aspect-square w-full rounded-sm overflow-hidden bg-white border border-gray-100">
                                <img 
                                    src={currentProduct.image || 'https://via.placeholder.com/600x600?text=No+Image'} 
                                    alt={currentProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl font-normal text-gray-800 leading-tight">
                                    {currentProduct.name}
                                </h1>
                            </div>

                            {/* Price */}
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl font-medium text-gray-900">
                                        {formatPrice(currentProduct.base_price || currentProduct.price)}
                                    </span>
                                </div>
                                <p className={`text-sm ${
                                    currentProduct.is_active !== false ? 'text-green-600' : 'text-red-500'
                                }`}>
                                    {currentProduct.is_active !== false ? `Stok: ${currentProduct.stock || 'Tersedia'}` : 'Tidak Tersedia'}
                                </p>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-3">
                                <label className="text-sm font-normal text-gray-600">
                                    Jumlah
                                </label>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center border border-gray-200 rounded-sm bg-white">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1 || currentProduct.is_active === false}
                                            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                                        >
                                            <span className="text-sm">-</span>
                                        </button>
                                        <span className="px-4 py-2 text-sm font-normal min-w-[40px] text-center">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            disabled={currentProduct.is_active === false}
                                            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                                        >
                                            <span className="text-sm">+</span>
                                        </button>
                                    </div>
                                    {currentProduct.stock && (
                                        <span className="text-xs text-gray-400">
                                            Maksimal {currentProduct.stock}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={addToCart}
                                    disabled={currentProduct.is_active === false}
                                    className={`w-full py-2.5 px-4 border text-sm font-normal transition-all duration-200 flex items-center justify-center ${
                                        currentProduct.is_active !== false 
                                            ? 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 bg-white' 
                                            : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                                    }`}
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Tambah ke Keranjang
                                </button>
                                <button
                                    onClick={buyNow}
                                    disabled={currentProduct.is_active === false}
                                    className={`w-full py-2.5 px-4 text-sm font-normal transition-all duration-200 ${
                                        currentProduct.is_active !== false 
                                            ? 'bg-gray-800 text-white hover:bg-gray-900' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Beli Sekarang
                                </button>
                            </div>


                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="bg-white rounded-sm border border-gray-100">
                        <div className="border-b border-gray-100">
                            <nav className="flex space-x-6 px-4">
                                {[
                                    { id: 'description', label: 'Deskripsi' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-3 px-1 border-b-2 text-sm font-normal ${
                                            activeTab === tab.id
                                                ? 'border-gray-700 text-gray-800'
                                                : 'border-transparent text-gray-500 hover:text-gray-600'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-4">
                            {activeTab === 'description' && (
                                <div className="prose max-w-none">
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {currentProduct.description || 'Deskripsi produk tidak tersedia.'}
                                    </p>
                                    {currentProduct.features && currentProduct.features.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="font-normal text-gray-800 mb-3 text-base">Fitur Utama:</h4>
                                            <ul className="space-y-2">
                                                {currentProduct.features.map((feature, index) => (
                                                    <li key={index} className="flex items-center space-x-2">
                                                        <CheckCircle className="h-4 w-4 text-gray-400" />
                                                        <span className="text-gray-600 text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}