import MarketplaceLayout from "../../Layouts/MarketplaceLayout";
import { usePage, Link } from "@inertiajs/react";
import { MapPin, LogOut, ShoppingBag, User as UserIcon } from "lucide-react";

export default function Profile() {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const avatar = user.avatar
        ? (String(user.avatar).startsWith('http') ? user.avatar : `/storage/${user.avatar}`)
        : "/assets/images/profile/user-1.jpg";

    return (
        <MarketplaceLayout>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-light text-gray-900 mb-6">Profil</h1>

                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center mb-8">
                    <div className="relative">
                        <img src={avatar} alt={user.name || 'User'} className="w-20 h-20 rounded-full object-cover" />
                        {!user.avatar && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                                <UserIcon className="w-8 h-8" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 sm:ml-5 mt-4 sm:mt-0">
                        <h2 className="text-lg font-semibold text-gray-900">{user.name || 'Pengguna'}</h2>
                        <p className="text-gray-600 text-sm mt-1">{user.email || '-'}</p>
                        {(user.whatsapp || user.phone) && (
                            <p className="text-gray-600 text-sm mt-1">{user.whatsapp || user.phone}</p>
                        )}
                        {typeof user.address === 'string' && user.address && (
                            <div className="flex items-center text-gray-600 text-sm mt-2">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{user.address}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Orders placeholder (no dummy) */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Riwayat Pemesanan</h3>
                        <Link href="/orders" className="text-sm text-gray-600 hover:text-gray-900">Lihat semua</Link>
                    </div>
                    <div className="text-center py-8">
                        <ShoppingBag className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-gray-600 text-sm">Belum ada pesanan</p>
                        <Link href="/" className="inline-block mt-4 px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800">Mulai Belanja</Link>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}