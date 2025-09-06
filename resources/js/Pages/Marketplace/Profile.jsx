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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Profil Saya</h1>
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center mb-6 sm:mb-8">
                    <img src={user.avatar} alt={user.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover mb-4 sm:mb-0 sm:mr-6" />
                    <div className="flex-1">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 sm:mb-3">{user.name}</h2>
                        <p className="text-gray-600 mb-2 sm:mb-3 text-lg sm:text-xl">{user.email}</p>
                        <p className="text-gray-600 mb-2 sm:mb-3 text-lg sm:text-xl">{user.phone}</p>
                        <div className="flex items-center text-gray-600">
                            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                            <span className="text-lg sm:text-xl">{user.address}</span>
                        </div>
                    </div>
                    <button className="mt-4 sm:mt-0 sm:ml-auto bg-red-100 text-red-600 px-4 sm:px-6 py-3 sm:py-4 rounded-lg flex items-center hover:bg-red-200 text-lg sm:text-xl">
                        <LogOut className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" /> Logout
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4 sm:mb-6 text-xl sm:text-2xl">Alamat Pengiriman</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center text-gray-700">
                        <div className="flex items-center mb-3 sm:mb-0 flex-1">
                            <MapPin className="h-6 w-6 sm:h-7 sm:w-7 mr-3 sm:mr-4" />
                            <span className="text-lg sm:text-xl">{user.address}</span>
                        </div>
                        <button className="text-blue-600 hover:underline text-lg sm:text-xl self-start sm:self-auto">Ubah</button>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 sm:mb-6 text-xl sm:text-2xl">Pesanan Saya</h3>
                    <div className="divide-y divide-gray-100">
                        {orders.map(order => (
                            <div key={order.id} className="flex flex-col sm:flex-row sm:items-center py-4 sm:py-6">
                                <div className="flex items-center mb-3 sm:mb-0 flex-1">
                                    <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 mr-4 sm:mr-6" />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 text-lg sm:text-xl">Order #{order.id}</div>
                                        <div className="text-lg sm:text-xl text-gray-500">{order.date} • {order.status} • {order.items} produk</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:block">
                                    <div className="font-bold text-gray-900 text-lg sm:text-xl">{formatPrice(order.total)}</div>
                                    <button className="ml-4 sm:ml-6 text-blue-600 hover:underline text-lg sm:text-xl">Lihat</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}