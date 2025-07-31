import { useState } from "react";
import { Link, useParams } from "@inertiajs/react";
import MarketplaceLayout from "../../Layouts/MarketplaceLayout";
import { 
    Star, 
    ShoppingCart, 
    Heart, 
    Eye,
    ArrowLeft,
    Truck,
    Shield,
    Clock,
    Package,
    Share2,
    MessageCircle,
    ThumbsUp,
    ThumbsDown,
    CheckCircle,
    Star as StarFilled
} from "lucide-react";

export default function ProductDetail() {
    const { id } = useParams();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [activeTab, setActiveTab] = useState('description');

    // Mock product data - nanti akan diambil dari API
    const product = {
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    const addToCart = () => {
        // Logic untuk menambah ke keranjang
        console.log('Added to cart:', { product: product.id, quantity });
    };

    const buyNow = () => {
        // Logic untuk beli langsung
        console.log('Buy now:', { product: product.id, quantity });
    };

    return (
        <MarketplaceLayout>
            <div className="bg-gray-50 min-h-screen py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="mb-8">
                        <Link 
                            href="/marketplace"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali ke Beranda
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Product Images */}
                        <div className="space-y-4">
                            <div className="aspect-w-1 aspect-h-1 w-full">
                                <img 
                                    src={product.images[selectedImage]} 
                                    alt={product.name}
                                    className="w-full h-96 object-cover rounded-lg"
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {product.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`aspect-w-1 aspect-h-1 w-full rounded-lg overflow-hidden border-2 ${
                                            selectedImage === index 
                                                ? 'border-blue-500' 
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <img 
                                            src={image} 
                                            alt={`${product.name} ${index + 1}`}
                                            className="w-full h-20 object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {product.name}
                                </h1>
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                className={`h-5 w-5 ${
                                                    i < Math.floor(product.rating) 
                                                        ? 'text-yellow-400 fill-current' 
                                                        : 'text-gray-300'
                                                }`} 
                                            />
                                        ))}
                                        <span className="ml-2 text-sm text-gray-600">
                                            {product.rating} ({product.reviewCount} ulasan)
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        • {product.soldCount} terjual
                                    </span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl font-bold text-gray-900">
                                        {formatPrice(product.price)}
                                    </span>
                                    {product.originalPrice > product.price && (
                                        <>
                                            <span className="text-lg text-gray-500 line-through">
                                                {formatPrice(product.originalPrice)}
                                            </span>
                                            <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                                                -{discount}%
                                            </span>
                                        </>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">
                                    Stok: {product.stock} tersedia
                                </p>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Jumlah
                                </label>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1}
                                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="text-lg">-</span>
                                        </button>
                                        <span className="px-4 py-2 text-sm font-medium">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                            disabled={quantity >= product.stock}
                                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="text-lg">+</span>
                                        </button>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        Maksimal {product.stock}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <div className="flex space-x-3">
                                    <button
                                        onClick={addToCart}
                                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                                    >
                                        <ShoppingCart className="h-5 w-5 mr-2" />
                                        Tambah ke Keranjang
                                    </button>
                                    <button
                                        onClick={() => setIsWishlisted(!isWishlisted)}
                                        className={`p-3 rounded-lg border transition-colors ${
                                            isWishlisted 
                                                ? 'bg-red-500 text-white border-red-500' 
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Heart className="h-5 w-5" />
                                    </button>
                                    <button className="p-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                                        <Share2 className="h-5 w-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={buyNow}
                                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
                                >
                                    Beli Sekarang
                                </button>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm text-gray-600">Gratis Ongkir</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-gray-600">Garansi Resmi</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                    <span className="text-sm text-gray-600">Pengiriman Cepat</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Details Tabs */}
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8 px-6">
                                {[
                                    { id: 'description', label: 'Deskripsi' },
                                    { id: 'specifications', label: 'Spesifikasi' },
                                    { id: 'reviews', label: 'Ulasan' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === 'description' && (
                                <div className="space-y-4">
                                    <p className="text-gray-700 leading-relaxed">
                                        {product.description}
                                    </p>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Fitur Utama:</h4>
                                        <ul className="space-y-2">
                                            {product.features.map((feature, index) => (
                                                <li key={index} className="flex items-center space-x-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <span className="text-gray-700">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'specifications' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(product.specifications).map(([key, value]) => (
                                            <div key={key} className="border-b border-gray-100 pb-2">
                                                <dt className="text-sm font-medium text-gray-500">{key}</dt>
                                                <dd className="text-sm text-gray-900 mt-1">{value}</dd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Ulasan ({product.reviews.length})
                                        </h3>
                                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                            Tulis Ulasan
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {product.reviews.map((review) => (
                                            <div key={review.id} className="border-b border-gray-200 pb-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            {review.user}
                                                        </h4>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <div className="flex items-center">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star 
                                                                        key={i} 
                                                                        className={`h-4 w-4 ${
                                                                            i < review.rating 
                                                                                ? 'text-yellow-400 fill-current' 
                                                                                : 'text-gray-300'
                                                                        }`} 
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-sm text-gray-500">
                                                                {new Date(review.date).toLocaleDateString('id-ID')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button className="text-gray-400 hover:text-gray-600">
                                                            <ThumbsUp className="h-4 w-4" />
                                                        </button>
                                                        <button className="text-gray-400 hover:text-gray-600">
                                                            <ThumbsDown className="h-4 w-4" />
                                                        </button>
                                                        <button className="text-gray-400 hover:text-gray-600">
                                                            <MessageCircle className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 leading-relaxed">
                                                    {review.comment}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-3">
                                                    <span className="text-xs text-gray-500">
                                                        {review.helpful} orang merasa ulasan ini membantu
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
} 