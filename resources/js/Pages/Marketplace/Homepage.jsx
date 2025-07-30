import { useState } from "react";
import { Link } from "@inertiajs/react";
import MarketplaceLayout from "../../Layouts/MarketplaceLayout";
import { 
    Star, 
    ShoppingCart, 
    Heart, 
    Eye,
    ArrowRight,
    Truck,
    Shield,
    Clock,
    Tag
} from "lucide-react";

export default function Homepage() {
    const [activeCategory, setActiveCategory] = useState("all");

    // Mock data - nanti akan diambil dari API
    const categories = [
        { id: "all", name: "Semua", icon: "🏠" },
        { id: "electronics", name: "Elektronik", icon: "📱" },
        { id: "fashion", name: "Fashion", icon: "👕" },
        { id: "home", name: "Rumah Tangga", icon: "🏠" },
        { id: "beauty", name: "Kecantikan", icon: "💄" },
        { id: "sports", name: "Olahraga", icon: "⚽" },
        { id: "books", name: "Buku", icon: "📚" },
        { id: "food", name: "Makanan", icon: "🍕" },
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const ProductCard = ({ product }) => {
        const [isWishlisted, setIsWishlisted] = useState(product.isWishlisted);

        return (
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                <div className="relative">
                    <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{product.discount}%
                        </div>
                    )}
                    {product.isNew && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                            NEW
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                            <button className="bg-white p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <Eye className="h-5 w-5 text-gray-700" />
                            </button>
                            <button 
                                className={`p-2 rounded-full transition-colors ${
                                    isWishlisted 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-white hover:bg-gray-100'
                                }`}
                                onClick={() => setIsWishlisted(!isWishlisted)}
                            >
                                <Heart className={`h-5 w-5 ${isWishlisted ? 'text-white' : 'text-gray-700'}`} />
                            </button>
                            <button className="bg-white p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <ShoppingCart className="h-5 w-5 text-gray-700" />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center mb-2">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${
                                        i < Math.floor(product.rating) 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300'
                                    }`} 
                                />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-1">({product.reviewCount})</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-lg font-bold text-gray-900">
                                {formatPrice(product.price)}
                            </span>
                            {product.originalPrice > product.price && (
                                <span className="text-sm text-gray-500 line-through ml-2">
                                    {formatPrice(product.originalPrice)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <MarketplaceLayout>
            {/* Hero Banner */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
                                Temukan Produk Terbaik
                            </h1>
                            <p className="text-xl mb-8 text-blue-100">
                                Ribuan produk berkualitas dengan harga terbaik dan pengiriman cepat ke seluruh Indonesia
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link 
                                    href="/marketplace/products"
                                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
                                >
                                    Mulai Belanja
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                                <Link 
                                    href="/marketplace/promotions"
                                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
                                >
                                    Lihat Promosi
                                </Link>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <img 
                                src="/assets/images/backgrounds/welcome-bg.png" 
                                alt="Hero" 
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Truck className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Pengiriman Cepat</h3>
                            <p className="text-gray-600 text-sm">Gratis ongkir untuk pembelian di atas Rp 100.000</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Garansi 100%</h3>
                            <p className="text-gray-600 text-sm">Produk original dengan garansi resmi</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="h-8 w-8 text-yellow-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
                            <p className="text-gray-600 text-sm">Customer service siap membantu Anda</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Tag className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Harga Terbaik</h3>
                            <p className="text-gray-600 text-sm">Harga kompetitif dengan diskon menarik</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategori Populer</h2>
                        <p className="text-gray-600">Temukan produk sesuai kategori favorit Anda</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`p-4 rounded-lg text-center transition-colors ${
                                    activeCategory === category.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <div className="text-2xl mb-2">{category.icon}</div>
                                <div className="text-sm font-medium">{category.name}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Popular Products */}
            <div className="bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Produk Populer</h2>
                            <p className="text-gray-600">Produk terlaris dengan rating tinggi</p>
                        </div>
                        <Link 
                            href="/marketplace/products"
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                        >
                            Lihat Semua
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {popularProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Promotions */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                                Flash Sale! 🔥
                            </h2>
                            <p className="text-xl mb-6 text-purple-100">
                                Diskon hingga 70% untuk produk elektronik dan fashion. Buruan sebelum kehabisan!
                            </p>
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="text-center">
                                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                                        <span className="text-2xl font-bold">02</span>
                                    </div>
                                    <span className="text-sm">Hari</span>
                                </div>
                                <div className="text-center">
                                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                                        <span className="text-2xl font-bold">18</span>
                                    </div>
                                    <span className="text-sm">Jam</span>
                                </div>
                                <div className="text-center">
                                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                                        <span className="text-2xl font-bold">45</span>
                                    </div>
                                    <span className="text-sm">Menit</span>
                                </div>
                                <div className="text-center">
                                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                                        <span className="text-2xl font-bold">30</span>
                                    </div>
                                    <span className="text-sm">Detik</span>
                                </div>
                            </div>
                            <Link 
                                href="/marketplace/promotions"
                                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
                            >
                                Lihat Promosi
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                        <div className="hidden lg:block">
                            <img 
                                src="/assets/images/backgrounds/welcome-bg2.png" 
                                alt="Promotion" 
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
} 