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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link href="/marketplace/cart" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Keranjang
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout & Pembayaran</h1>
                {/* Alamat Pengiriman */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center mb-2">
                        <Home className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-semibold text-gray-900">Alamat Pengiriman</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700">{address}</span>
                        <button className="text-blue-600 hover:underline text-sm">Ubah</button>
                    </div>
                </div>
                {/* Ringkasan Pesanan */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h2>
                    <div className="divide-y divide-gray-100">
                        {orderItems.map(item => (
                            <div key={item.id} className="flex items-center py-3">
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg mr-4" />
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-4 mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Ongkos Kirim</span>
                            <span>{formatPrice(shippingCost)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>
                {/* Metode Pembayaran */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
                    <div className="space-y-3">
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="payment" value="bank_transfer" checked={selectedPayment === "bank_transfer"} onChange={() => setSelectedPayment("bank_transfer")}/>
                            <span className="ml-3">Transfer Bank</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="payment" value="ewallet" checked={selectedPayment === "ewallet"} onChange={() => setSelectedPayment("ewallet")}/>
                            <span className="ml-3">E-Wallet (OVO, GoPay, DANA)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="payment" value="cod" checked={selectedPayment === "cod"} onChange={() => setSelectedPayment("cod")}/>
                            <span className="ml-3">Bayar di Tempat (COD)</span>
                        </label>
                    </div>
                </div>
                {/* Tombol Konfirmasi */}
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Konfirmasi & Bayar
                </button>
            </div>
        </MarketplaceLayout>
    );
}