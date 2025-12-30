import { useState, useEffect } from "react";
import MarketplaceLayout from "../../Layouts/MarketplaceLayout";
import { Link } from "@inertiajs/react";
import { 
    MapPin, 
    ShoppingBag, 
    User as UserIcon, 
    Award, 
    Star, 
    Gift, 
    TrendingUp,
    ChevronRight,
    Loader2,
    Phone,
    Mail,
    CheckCircle,
    XCircle,
    LogOut
} from "lucide-react";
import api from "../../api/axios";
import customerSession from "../../utils/customerSession";

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState(null);
    const [loyaltyData, setLoyaltyData] = useState(null);
    const [showVerification, setShowVerification] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState('phone');
    const [verificationInput, setVerificationInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    
    // Search customer state
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [pendingCustomer, setPendingCustomer] = useState(null);

    useEffect(() => {
        checkExistingSession();
    }, []);

    const checkExistingSession = async () => {
        const session = customerSession.get();
        if (session && session.customer_id && session.verification_value) {
            // Try to fetch loyalty data with existing session
            await fetchLoyaltyData(session);
        }
        setLoading(false);
    };

    const fetchLoyaltyData = async (verificationData) => {
        try {
            const response = await api.post('/loyalty/guest-loyalty', verificationData);
            if (response.data.status === 'success') {
                setCustomer(response.data.customer);
                setLoyaltyData(response.data);
            }
        } catch (err) {
            console.error('Error fetching loyalty data:', err);
            // Session might be invalid, clear it
            customerSession.clear();
            setCustomer(null);
            setLoyaltyData(null);
        }
    };

    const handleSearch = async () => {
        if (!searchInput.trim()) return;
        
        setSearching(true);
        setError('');
        try {
            const response = await api.post('/customers/guest-lookup', {
                search: searchInput.trim()
            });
            if (response.data.status === 'success') {
                setSearchResults(response.data.data || []);
                if (response.data.data?.length === 0) {
                    setError('Customer tidak ditemukan');
                }
            }
        } catch (err) {
            setError('Gagal mencari customer');
        } finally {
            setSearching(false);
        }
    };

    const handleSelectCustomer = (cust) => {
        setPendingCustomer(cust);
        setShowVerification(true);
        setSearchResults([]);
        setVerificationInput('');
        setError('');
    };

    const handleVerify = async () => {
        if (!verificationInput.trim() || !pendingCustomer) return;

        setVerifying(true);
        setError('');
        try {
            const response = await api.post('/customers/guest-verify', {
                customer_id: pendingCustomer.id,
                verification_type: verificationMethod,
                verification_value: verificationInput.trim()
            });

            if (response.data.status === 'success') {
                const verifiedCustomer = response.data.data;
                
                // Save to customer session
                customerSession.setVerified(
                    verifiedCustomer.id,
                    verificationMethod,
                    verificationInput.trim(),
                    verifiedCustomer
                );

                // Fetch loyalty data
                await fetchLoyaltyData({
                    customer_id: verifiedCustomer.id,
                    verification_type: verificationMethod,
                    verification_value: verificationInput.trim()
                });

                setShowVerification(false);
                setPendingCustomer(null);
                setSearchInput('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verifikasi gagal');
        } finally {
            setVerifying(false);
        }
    };

    const handleLogout = () => {
        customerSession.clear();
        setCustomer(null);
        setLoyaltyData(null);
        setPendingCustomer(null);
        setSearchInput('');
        setSearchResults([]);
    };

    const formatRupiah = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    if (loading) {
        return (
            <MarketplaceLayout>
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-center items-center min-h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    // Not logged in - show login/search form
    if (!customer) {
        return (
            <MarketplaceLayout>
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-2xl font-light text-gray-900 mb-6">Profil</h1>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        {!showVerification ? (
                            <>
                                <div className="text-center mb-6">
                                    <UserIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Masuk ke Akun Anda</h2>
                                    <p className="text-gray-600 text-sm">Cari nama Anda untuk melihat poin loyalty dan riwayat pesanan</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Nama Customer</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="Masukkan nama Anda..."
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                            />
                                            <button
                                                onClick={handleSearch}
                                                disabled={searching || !searchInput.trim()}
                                                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cari'}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                            <XCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    {searchResults.length > 0 && (
                                        <div className="border rounded-lg divide-y">
                                            {searchResults.map((cust) => (
                                                <button
                                                    key={cust.id}
                                                    onClick={() => handleSelectCustomer(cust)}
                                                    className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="font-medium text-gray-900">{cust.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {cust.masked_phone && <span className="mr-3">{cust.masked_phone}</span>}
                                                            {cust.masked_email && <span>{cust.masked_email}</span>}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <CheckCircle className="mx-auto h-12 w-12 text-pink-500 mb-4" />
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Verifikasi Akun</h2>
                                    <p className="text-gray-600 text-sm">
                                        Verifikasi untuk <span className="font-medium">{pendingCustomer?.name}</span>
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setVerificationMethod('phone')}
                                            className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 ${
                                                verificationMethod === 'phone' 
                                                    ? 'border-pink-500 bg-pink-50 text-pink-700' 
                                                    : 'border-gray-300 text-gray-600'
                                            }`}
                                        >
                                            <Phone className="w-4 h-4" />
                                            No. HP
                                        </button>
                                        <button
                                            onClick={() => setVerificationMethod('email')}
                                            className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 ${
                                                verificationMethod === 'email' 
                                                    ? 'border-pink-500 bg-pink-50 text-pink-700' 
                                                    : 'border-gray-300 text-gray-600'
                                            }`}
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </button>
                                    </div>

                                    <div>
                                        <input
                                            type={verificationMethod === 'email' ? 'email' : 'tel'}
                                            value={verificationInput}
                                            onChange={(e) => setVerificationInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                            placeholder={verificationMethod === 'phone' ? 'Masukkan nomor HP...' : 'Masukkan email...'}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                            <XCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setShowVerification(false);
                                                setPendingCustomer(null);
                                                setError('');
                                            }}
                                            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                        >
                                            Kembali
                                        </button>
                                        <button
                                            onClick={handleVerify}
                                            disabled={verifying || !verificationInput.trim()}
                                            className="flex-1 py-2 px-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verifikasi'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    // Logged in - show profile with loyalty
    const session = customerSession.get();
    const tier = loyaltyData?.tier;
    const points = loyaltyData?.points;
    const progress = loyaltyData?.progress;
    const transactions = loyaltyData?.transactions || [];
    
    // Get tier color or fallback to pink
    const tierColor = tier?.color || '#ec4899';
    const tierColorLight = tier?.color ? `${tier.color}20` : '#fce7f3';

    return (
        <MarketplaceLayout>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-light text-gray-900">Profil</h1>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <LogOut className="w-4 h-4" />
                        Keluar
                    </button>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center mb-6">
                    <div className="relative">
                        <div 
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                            style={{
                                background: `linear-gradient(135deg, ${tierColor}dd, ${tierColor})`
                            }}
                        >
                            {customer?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    </div>
                    <div className="flex-1 sm:ml-5 mt-4 sm:mt-0">
                        <h2 className="text-lg font-semibold text-gray-900">{customer.name}</h2>
                        {session?.phone && (
                            <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {session.phone}
                            </p>
                        )}
                        {session?.email && (
                            <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {session.email}
                            </p>
                        )}
                    </div>
                </div>

                {/* Loyalty Points Card */}
                {loyaltyData?.settings?.is_active && (
                    <div 
                        className="rounded-lg shadow-sm p-5 mb-6 text-white"
                        style={{
                            background: `linear-gradient(135deg, ${tierColor}dd, ${tierColor})`
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Award className="w-6 h-6" />
                                <span className="font-semibold">Loyalty Points</span>
                            </div>
                            {tier && (
                                <span 
                                    className="px-3 py-1 rounded-full text-xs font-medium"
                                    style={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                        color: tierColor,
                                        fontWeight: '600'
                                    }}
                                >
                                    {tier.name}
                                </span>
                            )}
                        </div>

                        <div className="text-center mb-4">
                            <p className="text-4xl font-bold">{points?.current?.toLocaleString('id-ID') || 0}</p>
                            <p className="text-white/80 text-sm">Poin Tersedia</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center text-sm">
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-white/80">Total Poin</p>
                                <p className="font-semibold">{points?.lifetime?.toLocaleString('id-ID') || 0}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-white/80">Belanja Tahun Ini</p>
                                <p className="font-semibold">{formatRupiah(points?.annual_spend || 0)}</p>
                            </div>
                        </div>

                        {/* Progress to next tier */}
                        {progress?.next_tier && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" />
                                        Menuju {progress.next_tier.name}
                                    </span>
                                    <span>{progress.percentage}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2">
                                    <div 
                                        className="bg-white rounded-full h-2 transition-all"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-white/80 mt-2">
                                    Belanja {formatRupiah(progress.remaining || 0)} lagi untuk naik tier
                                </p>
                            </div>
                        )}

                        {/* Tier Benefits */}
                        {tier?.benefits && Array.isArray(tier.benefits) && tier.benefits.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                    <Gift className="w-4 h-4" />
                                    Keuntungan {tier.name}
                                </p>
                                <ul className="text-sm text-white/80 space-y-1">
                                    {tier.benefits.slice(0, 3).map((benefit, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <Star className="w-3 h-3" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Transactions */}
                {transactions.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Poin</h3>
                        <div className="space-y-3">
                            {transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {tx.type === 'earn' ? 'Poin Masuk' : tx.type === 'redeem' ? 'Poin Keluar' : 'Penyesuaian'}
                                        </p>
                                        <p className="text-xs text-gray-500">{tx.description}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(tx.created_at).toLocaleDateString('id-ID', { 
                                                day: 'numeric', month: 'short', year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    <span className={`font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.points > 0 ? '+' : ''}{tx.points}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Orders Link */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Riwayat Pemesanan</h3>
                        <Link href="/orders" className="text-sm hover:underline flex items-center gap-1" style={{ color: tierColor }}>
                            Lihat semua <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="text-center py-6">
                        <ShoppingBag className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-gray-600 text-sm">Lihat riwayat pesanan Anda</p>
                        <Link href="/orders" className="inline-block mt-4 px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800">
                            Lihat Pesanan
                        </Link>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}