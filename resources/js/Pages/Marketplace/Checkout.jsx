import { useState } from "react";
import { Link } from "@inertiajs/react";
import MarketplaceLayout from "../../Layouts/MarketplaceLayout";
import { CreditCard, Truck, Home, ArrowLeft, CheckCircle } from "lucide-react";

export default function Checkout() {
    const [selectedPayment, setSelectedPayment] = useState("bank_transfer");
    const [address, setAddress] = useState("Jl. Mawar No. 123, Jakarta");
    const orderItems = [
        {
            id: 1,
            name: "Smartphone Samsung Galaxy A54",
            price: 3500000,
            quantity: 1,
            image: "/assets/images/products/dash-prd-1.jpg"
        },
        {
            id: 2,
            name: "Headphone Sony WH-1000XM4",
            price: 2800000,
            quantity: 2,
            image: "/assets/images/products/dash-prd-3.jpg"
        }
    ];
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = 15000;
    const total = subtotal + shippingCost;
    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    return (
        <MarketplaceLayout>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Link href="/cart" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 text-lg sm:text-xl">
                    <ArrowLeft className="h-6 w-6 sm:h-7 sm:w-7 mr-3 sm:mr-4" />
                    Kembali ke Keranjang
                </Link>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Checkout & Pembayaran</h1>
                {/* Alamat Pengiriman */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex items-center mb-3 sm:mb-4">
                        <Home className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 mr-3 sm:mr-4" />
                        <span className="font-semibold text-gray-900 text-lg sm:text-xl">Alamat Pengiriman</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700 text-lg sm:text-xl">{address}</span>
                        <button className="text-blue-600 hover:underline text-lg sm:text-xl">Ubah</button>
                    </div>
                </div>
                {/* Ringkasan Pesanan */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4 sm:mb-6 text-xl sm:text-2xl">Ringkasan Pesanan</h2>
                    <div className="divide-y divide-gray-100">
                        {orderItems.map(item => (
                            <div key={item.id} className="flex items-center py-4 sm:py-6">
                                <img src={item.image} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mr-4 sm:mr-6" />
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 text-lg sm:text-xl">{item.name}</h3>
                                    <p className="text-lg sm:text-xl text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-bold text-gray-900 text-lg sm:text-xl">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-4 sm:pt-6 mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                        <div className="flex justify-between text-lg sm:text-xl">
                            <span>Subtotal</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-lg sm:text-xl">
                            <span>Ongkos Kirim</span>
                            <span>{formatPrice(shippingCost)}</span>
                        </div>
                        <div className="flex justify-between text-xl sm:text-2xl font-bold">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>
                {/* Metode Pembayaran */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4 sm:mb-6 text-xl sm:text-2xl">Metode Pembayaran</h2>
                    <div className="space-y-4 sm:space-y-6">
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="payment" value="bank_transfer" checked={selectedPayment === "bank_transfer"} onChange={() => setSelectedPayment("bank_transfer")} className="w-5 h-5 sm:w-6 sm:h-6"/>
                            <span className="ml-4 sm:ml-6 text-lg sm:text-xl">Transfer Bank</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="payment" value="ewallet" checked={selectedPayment === "ewallet"} onChange={() => setSelectedPayment("ewallet")} className="w-5 h-5 sm:w-6 sm:h-6"/>
                            <span className="ml-4 sm:ml-6 text-lg sm:text-xl">E-Wallet (OVO, GoPay, DANA)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="payment" value="cod" checked={selectedPayment === "cod"} onChange={() => setSelectedPayment("cod")} className="w-5 h-5 sm:w-6 sm:h-6"/>
                            <span className="ml-4 sm:ml-6 text-lg sm:text-xl">Bayar di Tempat (COD)</span>
                        </label>
                    </div>
                </div>
                {/* Tombol Konfirmasi */}
                <button className="w-full bg-blue-600 text-white py-4 sm:py-5 rounded-lg font-semibold text-xl sm:text-2xl hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 mr-3 sm:mr-4" />
                    Konfirmasi & Bayar
                </button>
            </div>
        </MarketplaceLayout>
    );
}