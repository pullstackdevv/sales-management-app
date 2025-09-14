import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Link } from "@inertiajs/react";
import MarketplaceLayout from "../../Layouts/MarketplaceLayout";
import { 
    Trash2, 
    Plus, 
    Minus, 
    ArrowLeft,
    CreditCard,
    Truck,
    Shield
} from "lucide-react";

// Cart item row component, memoized to avoid unnecessary re-renders
const CartItem = memo(function CartItem({ item, onToggleSelect, onUpdateQuantity, onRemove, formatPrice }) {
    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => onToggleSelect(item.id)}
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
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-3 sm:p-4 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Minus className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                        <span className="px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl font-medium">
                            {item.quantity}
                        </span>
                        <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="p-3 sm:p-4 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>
                    <button
                        onClick={() => onRemove(item.id)}
                        className="text-red-600 hover:text-red-700 p-3 sm:p-4"
                    >
                        <Trash2 className="h-6 w-6 sm:h-7 sm:w-7" />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default function Cart() {
    const [cartItems, setCartItems] = useState([]);

    // Load cart from session storage (key: 'checkout_data')
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('checkout_data');
            if (!raw) return;
            const data = JSON.parse(raw);
            let items = [];
            if (Array.isArray(data)) {
                items = data;
            } else if (Array.isArray(data?.items)) {
                items = data.items;
            } else if (data?.product) {
                // Shape: { customer: {...}, product: {...} }
                items = [data.product];
            }

            const mapped = items.map((it, idx) => {
                const img = it.image || it.product_image || it.thumbnail;
                const imgUrl = img ? (String(img).startsWith('http') ? img : `/storage/${img}`) : '/assets/images/products/placeholder.jpg';
                const price = Number(it.price ?? it.base_price ?? it.product_price ?? 0);
                const original = Number(it.originalPrice ?? it.original_price ?? it.price ?? price);
                return {
                    id: it.id ?? it.product_id ?? idx + 1,
                    name: it.name ?? it.product_name ?? 'Produk',
                    price,
                    originalPrice: original,
                    image: imgUrl,
                    quantity: Number(it.quantity ?? 1),
                    stock: Number(it.stock ?? it.available_stock ?? 99),
                    selected: typeof it.selected === 'boolean' ? it.selected : true,
                };
            });

            setCartItems(mapped);
        } catch (e) {
            console.warn('Failed to parse checkout_data from sessionStorage');
        }
    }, []);

    const persistToSession = useCallback((items) => {
        try {
            // Preserve original structure loosely under 'items'
            const raw = sessionStorage.getItem('checkout_data');
            const base = raw ? JSON.parse(raw) : {};
            const payload = {
                ...base,
                items: items.map(it => ({
                    id: it.id,
                    product_id: it.id,
                    product_name: it.name,
                    name: it.name,
                    price: it.price,
                    original_price: it.originalPrice,
                    image: it.image,
                    quantity: it.quantity,
                    stock: it.stock,
                    selected: it.selected,
                })),
            };
            sessionStorage.setItem('checkout_data', JSON.stringify(payload));
        } catch {}
    }, []);

    // Memoize formatter to avoid creating a new Intl instance on every render
    const currencyFormatter = useMemo(() => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }), []);

    const formatPrice = useCallback((price) => currencyFormatter.format(price), [currencyFormatter]);

    // Stable handlers using functional updates, so deps can be [] safely
    const updateQuantity = useCallback((id, newQuantity) => {
        setCartItems(prev => {
            const next = prev.map(item => 
                item.id === id 
                    ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.stock)) }
                    : item
            );
            persistToSession(next);
            return next;
        });
    }, [persistToSession]);

    const removeItem = useCallback((id) => {
        setCartItems(prev => {
            const next = prev.filter(item => item.id !== id);
            persistToSession(next);
            return next;
        });
    }, [persistToSession]);

    const toggleSelect = useCallback((id) => {
        setCartItems(prev => {
            const next = prev.map(item => 
                item.id === id 
                    ? { ...item, selected: !item.selected }
                    : item
            );
            persistToSession(next);
            return next;
        });
    }, [persistToSession]);

    const toggleSelectAll = useCallback(() => {
        setCartItems(prev => {
            const allSelected = prev.every(item => item.selected);
            const next = prev.map(item => ({ ...item, selected: !allSelected }));
            persistToSession(next);
            return next;
        });
    }, [persistToSession]);

    // Derived values memoized to avoid recalculation on unrelated renders
    const selectedItems = useMemo(() => cartItems.filter(item => item.selected), [cartItems]);
    const subtotal = useMemo(() => selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), [selectedItems]);
    const shippingCost = useMemo(() => (selectedItems.length > 0 ? 15000 : 0), [selectedItems.length]);
    const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

    return (
        <MarketplaceLayout>
            <div className="bg-gray-50 min-h-screen py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <Link 
                            href="/"
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-5 text-sm sm:text-base"
                        >
                            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Kembali
                        </Link>
                        <h1 className="text-2xl font-light text-gray-900">Keranjang</h1>
                        <p className="text-gray-600 mt-2 text-sm">
                            {cartItems.length} produk dalam keranjang Anda
                        </p>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="text-center py-12 sm:py-16">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-md mx-auto">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Truck className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Keranjang kosong
                                </h3>
                                <p className="text-gray-600 mb-5 text-sm">
                                    Belum ada produk yang Anda pilih.
                                </p>
                                <Link 
                                    href="/products"
                                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors text-sm"
                                >
                                    Mulai Belanja
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                                    {/* Cart Header */}
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={cartItems.every(item => item.selected)}
                                                    onChange={toggleSelectAll}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="ml-3 text-sm font-medium text-gray-900">
                                                    Pilih semua ({cartItems.length})
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => setCartItems([])}
                                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                                            >
                                                Hapus Semua
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cart Items List */}
                                    <div className="divide-y divide-gray-200">
                                        {cartItems.map((item) => (
                                            <CartItem
                                                key={item.id}
                                                item={item}
                                                onToggleSelect={toggleSelect}
                                                onUpdateQuantity={updateQuantity}
                                                onRemove={removeItem}
                                                formatPrice={formatPrice}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sticky top-24">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Ringkasan
                                    </h3>
                                    
                                    <div className="space-y-3 mb-5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal ({selectedItems.length} item)</span>
                                            <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Ongkos kirim</span>
                                            <span className="font-medium text-gray-900">{formatPrice(shippingCost)}</span>
                                        </div>
                                        <div className="border-t border-gray-100 pt-3">
                                            <div className="flex justify-between text-base font-semibold text-gray-900">
                                                <span>Total</span>
                                                <span>{formatPrice(total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Info */}
                                    <div className="bg-blue-50 rounded-md p-3 mb-4">
                                        <div className="flex items-center mb-1.5">
                                            <Truck className="h-5 w-5 text-blue-600 mr-2" />
                                            <span className="text-sm font-medium text-blue-900">Gratis ongkir</span>
                                        </div>
                                        <p className="text-sm text-blue-700">
                                            Untuk pembelian di atas Rp 100.000
                                        </p>
                                    </div>

                                    {/* Security Info */}
                                    <div className="bg-green-50 rounded-md p-3 mb-5">
                                        <div className="flex items-center mb-1.5">
                                            <Shield className="h-5 w-5 text-green-600 mr-2" />
                                            <span className="text-sm font-medium text-green-900">Pembayaran aman</span>
                                        </div>
                                        <p className="text-sm text-green-700">
                                            Dilindungi dengan enkripsi SSL
                                        </p>
                                    </div>

                                    {/* Checkout Button */}
                                    <Link
                                        href={selectedItems.length > 0 ? "/checkout/product" : "#"}
                                        onClick={(e) => {
                                            if (selectedItems.length === 0) {
                                                e.preventDefault();
                                            }
                                        }}
                                        className={`w-full py-3 px-4 rounded-md font-medium text-center transition-colors text-sm ${
                                            selectedItems.length > 0
                                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center">
                                            <CreditCard className="h-5 w-5 mr-2" />
                                            Lanjut ke Pembayaran
                                        </div>
                                    </Link>

                                    {/* Continue Shopping */}
                                    <Link
                                        href="/products"
                                        className="w-full mt-3 py-3 px-4 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center block text-sm"
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