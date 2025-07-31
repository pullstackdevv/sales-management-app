import MarketplaceLayout from "../../Layouts/MarketplaceLayout";
import { User, MapPin, ShoppingBag, LogOut } from "lucide-react";

export default function Profile() {
    // Mock data user
    const user = {
        name: "Budi Santoso",
        email: "budi@example.com",
        phone: "+62 812-3456-7890",
        address: "Jl. Mawar No. 123, Jakarta",
        avatar: "/assets/images/profile/user-1.jpg"
    };
    const orders = [
        {
            id: 1,
            date: "2024-07-01",
            status: "Selesai",
            total: 3500000,
            items: 2
        },
        {
            id: 2,
            date: "2024-06-28",
            status: "Diproses",
            total: 8500000,
            items: 1
        }
    ];
    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    return (
        <MarketplaceLayout>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil Saya</h1>
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center mb-8">
                    <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover mr-6" />
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">{user.name}</h2>
                        <p className="text-gray-600 mb-1">{user.email}</p>
                        <p className="text-gray-600 mb-1">{user.phone}</p>
                        <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{user.address}</span>
                        </div>
                    </div>
                    <button className="ml-auto bg-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center hover:bg-red-200">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4">Alamat Pengiriman</h3>
                    <div className="flex items-center text-gray-700">
                        <MapPin className="h-5 w-5 mr-2" />
                        {user.address}
                        <button className="ml-auto text-blue-600 hover:underline text-sm">Ubah</button>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Pesanan Saya</h3>
                    <div className="divide-y divide-gray-100">
                        {orders.map(order => (
                            <div key={order.id} className="flex items-center py-4">
                                <ShoppingBag className="h-6 w-6 text-blue-600 mr-4" />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Order #{order.id}</div>
                                    <div className="text-sm text-gray-500">{order.date} • {order.status} • {order.items} produk</div>
                                </div>
                                <div className="font-bold text-gray-900">{formatPrice(order.total)}</div>
                                <button className="ml-4 text-blue-600 hover:underline text-sm">Lihat</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}