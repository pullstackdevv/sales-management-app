import { useState } from "react";
import { Link } from "@inertiajs/react";
import MarketplaceLayout from "../../Layouts/MarketplaceLayout";
import { Search, Star, ShoppingCart, Heart } from "lucide-react";

export default function ProductList() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const categories = [
        { id: "all", name: "Semua" },
        { id: "electronics", name: "Elektronik" },
        { id: "fashion", name: "Fashion" },
        { id: "home", name: "Rumah Tangga" },
        { id: "beauty", name: "Kecantikan" },
        { id: "sports", name: "Olahraga" },
        { id: "books", name: "Buku" },
        { id: "food", name: "Makanan" },
    ];
    const products = [
        {
            id: 1,
            name: "Smartphone Samsung Galaxy A54",
            price: 3500000,
            originalPrice: 4200000,
            rating: 4.5,
            reviewCount: 128,
            image: "/assets/images/products/dash-prd-1.jpg",
            discount: 17,
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
            isWishlisted: false
        }
    ];
    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    const filteredProducts = products.filter(p => (activeCategory === "all" || p.category === activeCategory) && p.name.toLowerCase().includes(search.toLowerCase()));
    return (
        <MarketplaceLayout>
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 sm:mb-10">Daftar Produk</h1>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 sm:mb-10 gap-6 sm:gap-8">
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full text-lg sm:text-xl font-medium border transition-colors ${activeCategory === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full lg:w-80">
                        <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="block w-full pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg sm:text-xl"
                            placeholder="Cari produk..."
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                            <Link href={`/marketplace/product/${product.id}`}>
                                <img src={product.image} alt={product.name} className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
                            </Link>
                            <div className="p-5 sm:p-6">
                                <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 line-clamp-2 text-base sm:text-lg">{product.name}</h3>
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-5 w-5 sm:h-5 sm:w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <span className="text-base sm:text-lg text-gray-500 ml-2">({product.reviewCount})</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                    <span className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                                    {product.originalPrice > product.price && (
                                        <span className="text-base sm:text-lg text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </MarketplaceLayout>
    );
}