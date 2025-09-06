import { useState } from "react";
import { Link } from "@inertiajs/react";
import MarketplaceLayout from "../../Layouts/MarketplaceLayout";
import { 
    Trash2, 
    Plus, 
    Minus, 
    ArrowLeft,
    CreditCard,
    Truck,
    Shield,
    CheckCircle
} from "lucide-react";

export default function Cart() {
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: "Smartphone Samsung Galaxy A54",
            price: 3500000,
            originalPrice: 4200000,
            image: "/assets/images/products/dash-prd-1.jpg",
            quantity: 1,
            stock: 10,
            selected: true
        },
        {
            id: 2,
            name: "Laptop ASUS VivoBook S14",
            price: 8500000,
            originalPrice: 9500000,
            image: "/assets/images/products/dash-prd-2.jpg",
            quantity: 1,
            stock: 5,
            selected: true
        },
        {
            id: 3,
            name: "Headphone Sony WH-1000XM4",
            price: 2800000,
            originalPrice: 3500000,
            image: "/assets/images/products/dash-prd-3.jpg",
            quantity: 2,
            stock: 15,
            selected: true
        }
    ]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const updateQuantity = (id, newQuantity) => {
        setCartItems(prev => 
            prev.map(item => 
                item.id === id 
                    ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.stock)) }
                    : item
            )
        );
    };

    const removeItem = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const toggleSelect = (id) => {
        setCartItems(prev => 
            prev.map(item => 
                item.id === id 
                    ? { ...item, selected: !item.selected }
                    : item
            )
        );
    };

    const toggleSelectAll = () => {
        const allSelected = cartItems.every(item => item.selected);
        setCartItems(prev => 
            prev.map(item => ({ ...item, selected: !allSelected }))
        );
    };

    const selectedItems = cartItems.filter(item => item.selected);
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = selectedItems.length > 0 ? 15000 : 0;
    const total = subtotal + shippingCost;

    return (
        <MarketplaceLayout>
            <div className="bg-gray-50 min-h-screen py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <Link 
                            href="/marketplace"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 text-lg sm:text-xl"
                        >
                            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 mr-3" />
                            Kembali ke Beranda
                        </Link>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Keranjang Belanja</h1>
                        <p className="text-gray-600 mt-3 sm:mt-4 text-lg sm:text-xl">
                            {cartItems.length} produk dalam keranjang
                        </p>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="text-center py-12 sm:py-16">
                            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 max-w-md mx-auto">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                    <Truck className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                                    Keranjang Belanja Kosong
                                </h3>
                                <p className="text-gray-600 mb-6 sm:mb-8 text-lg sm:text-xl">
                                    Belum ada produk di keranjang belanja Anda
                                </p>
                                <Link 
                                    href="/marketplace/products"
                                    className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg sm:text-xl"
                                >
                                    Mulai Belanja
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-sm">
                                    {/* Cart Header */}
                                    <div className="p-4 sm:p-6 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={cartItems.every(item => item.selected)}
                                                    onChange={toggleSelectAll}
                                                    className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="ml-3 sm:ml-4 text-lg sm:text-xl font-medium text-gray-900">
                                                    Pilih Semua ({cartItems.length})
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => setCartItems([])}
                                                className="text-red-600 hover:text-red-700 text-lg sm:text-xl font-medium"
                                            >
                                                Hapus Semua
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cart Items List */}
                                    <div className="divide-y divide-gray-200">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="p-4 sm:p-6">
                                                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.selected}
                                                            onChange={() => toggleSelect(item.id)}
                                                            className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <div className="ml-3 sm:ml-4 flex-1 flex items-center">
                                                            <img 
                                                                src={item.image} 
                                                                alt={item.name}
                                                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                                                            />
                                                            <div className="ml-3 sm:ml-4 flex-1">
                                                                <h3 className="text-lg sm:text-xl font-medium text-gray-900">
                                                                    {item.name}
                                                                </h3>
                                                                <div className="flex flex-col sm:flex-row sm:items-center mt-2 space-y-1 sm:space-y-0">
                                                                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                                                                        {formatPrice(item.price)}
                                                                    </span>
                                                                    {item.originalPrice > item.price && (
                                                                        <span className="text-lg sm:text-xl text-gray-500 line-through sm:ml-3">
                                                                            {formatPrice(item.originalPrice)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-lg sm:text-xl text-gray-500 mt-2">
                                                                    Stok: {item.stock} tersedia
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6">
                                                        {/* Quantity Control */}
                                                        <div className="flex items-center border border-gray-300 rounded-lg">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                disabled={item.quantity <= 1}
                                                                className="p-3 sm:p-4 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Minus className="h-5 w-5 sm:h-6 sm:w-6" />
                                                            </button>
                                                            <span className="px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl font-medium">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                disabled={item.quantity >= item.stock}
                                                                className="p-3 sm:p-4 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-red-600 hover:text-red-700 p-3 sm:p-4"
                                                        >
                                                            <Trash2 className="h-6 w-6 sm:h-7 sm:w-7" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sticky top-24">
                                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">
                                        Ringkasan Pesanan
                                    </h3>
                                    
                                    <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                                        <div className="flex justify-between text-lg sm:text-xl">
                                            <span className="text-gray-600">Subtotal ({selectedItems.length} item)</span>
                                            <span className="font-medium">{formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg sm:text-xl">
                                            <span className="text-gray-600">Ongkos Kirim</span>
                                            <span className="font-medium">{formatPrice(shippingCost)}</span>
                                        </div>
                                        <div className="border-t pt-4 sm:pt-6">
                                            <div className="flex justify-between text-xl sm:text-2xl font-bold">
                                                <span>Total</span>
                                                <span>{formatPrice(total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Info */}
                                    <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                                        <div className="flex items-center mb-2 sm:mb-3">
                                            <Truck className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 mr-3 sm:mr-4" />
                                            <span className="text-lg sm:text-xl font-medium text-blue-900">
                                                Gratis Ongkir
                                            </span>
                                        </div>
                                        <p className="text-lg sm:text-xl text-blue-700">
                                            Untuk pembelian di atas Rp 100.000
                                        </p>
                                    </div>

                                    {/* Security Info */}
                                    <div className="bg-green-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                                        <div className="flex items-center mb-2 sm:mb-3">
                                            <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 mr-3 sm:mr-4" />
                                            <span className="text-lg sm:text-xl font-medium text-green-900">
                                                Pembayaran Aman
                                            </span>
                                        </div>
                                        <p className="text-lg sm:text-xl text-green-700">
                                            Dilindungi dengan enkripsi SSL
                                        </p>
                                    </div>

                                    {/* Checkout Button */}
                                    <Link
                                        href="/marketplace/checkout"
                                        className={`w-full py-4 sm:py-5 px-4 sm:px-6 rounded-lg font-medium text-center transition-colors text-lg sm:text-xl ${
                                            selectedItems.length > 0
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center">
                                            <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 mr-3 sm:mr-4" />
                                            Lanjut ke Pembayaran
                                        </div>
                                    </Link>

                                    {/* Continue Shopping */}
                                    <Link
                                        href="/marketplace/products"
                                        className="w-full mt-4 sm:mt-6 py-4 sm:py-5 px-4 sm:px-6 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center block text-lg sm:text-xl"
                                    >
                                        Lanjut Belanja
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
}