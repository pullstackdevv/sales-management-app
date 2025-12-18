import { useState, useEffect } from "react";
import { 
    Power, 
    Wallet, 
    Gift, 
    ListChecks, 
    Info, 
    Save, 
    Loader2,
    Award
} from "lucide-react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import api from "../../api/axios";
import Swal from "sweetalert2";

const ToggleSwitch = ({ label, description, checked, onChange }) => {
    return (
        <div className="flex items-start justify-between">
            <div className="flex-1">
                {label && <label className="font-medium">{label}</label>}
                {description && (
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                )}
            </div>
            <label className="inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
        </div>
    );
};

function LoyaltySettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        point_rate: { value: "10000", is_active: true },
        min_redeem_amount: { value: "50000", is_active: true },
        max_redeem_percentage: { value: "20", is_active: true },
        redeem_options: { value: "50000,100000,200000", is_active: true },
        loyalty_active: { value: "1", is_active: true },
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get("/loyalty/settings");
            if (response.data.settings) {
                setSettings(response.data.settings);
            }
        } catch (error) {
            console.error("Error fetching loyalty settings:", error);
            Swal.fire("Error", "Gagal memuat pengaturan loyalty", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, field, value) => {
        setSettings((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
            },
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post("/loyalty/settings", { settings });
            Swal.fire("Berhasil", "Pengaturan loyalty berhasil disimpan", "success");
        } catch (error) {
            console.error("Error saving loyalty settings:", error);
            Swal.fire("Error", "Gagal menyimpan pengaturan loyalty", "error");
        } finally {
            setSaving(false);
        }
    };

    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 flex justify-center items-center min-h-[400px]">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Pengaturan Loyalty Points</h1>
                        <p className="text-gray-500 mt-1">
                            Konfigurasi sistem poin dan membership untuk customer
                        </p>
                    </div>
                    <Link
                        href="/cms/loyalty/tiers"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                        <Award className="w-5 h-5" />
                        Kelola Tier Membership
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Sistem */}
                    <div className="bg-white rounded-lg shadow-sm border p-5">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Power className="w-6 h-6 text-green-600" />
                            Status Sistem Loyalty
                        </h2>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <ToggleSwitch
                                label="Aktifkan Sistem Loyalty"
                                description="Jika dinonaktifkan, customer tidak akan mendapat poin"
                                checked={settings.loyalty_active?.value === "1"}
                                onChange={(checked) =>
                                    handleChange("loyalty_active", "value", checked ? "1" : "0")
                                }
                            />
                        </div>
                    </div>

                    {/* Earn Points */}
                    <div className="bg-white rounded-lg shadow-sm border p-5">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-blue-600" />
                            Pengaturan Earn Points
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Rate Poin (Rupiah per 1 Poin)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-gray-500">Rp</span>
                                    <input
                                        type="number"
                                        value={settings.point_rate?.value || ""}
                                        onChange={(e) =>
                                            handleChange("point_rate", "value", e.target.value)
                                        }
                                        placeholder="10000"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-500">= 1 Poin</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Contoh: Belanja {formatRupiah(settings.point_rate?.value || 10000)} mendapat 1 poin dasar
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Redeem Points */}
                    <div className="bg-white rounded-lg shadow-sm border p-5">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Gift className="w-6 h-6 text-orange-600" />
                            Pengaturan Redeem
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Minimal Nilai Redeem (Rupiah)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-gray-500">Rp</span>
                                    <input
                                        type="number"
                                        value={settings.min_redeem_amount?.value || ""}
                                        onChange={(e) =>
                                            handleChange("min_redeem_amount", "value", e.target.value)
                                        }
                                        placeholder="50000"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimal akumulasi nilai rupiah dari poin untuk bisa di-redeem
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Maksimal Redeem (% dari Total Transaksi)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="number"
                                        value={settings.max_redeem_percentage?.value || ""}
                                        onChange={(e) =>
                                            handleChange("max_redeem_percentage", "value", e.target.value)
                                        }
                                        placeholder="20"
                                        min="1"
                                        max="100"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-500">%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Contoh: Maksimal {settings.max_redeem_percentage?.value || 20}% dari total belanja bisa dibayar dengan redeem poin
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Redeem Options */}
                    <div className="bg-white rounded-lg shadow-sm border p-5">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ListChecks className="w-6 h-6 text-purple-600" />
                            Pilihan Redeem
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Pilihan Nilai Rupiah untuk Redeem</label>
                                <input
                                    type="text"
                                    value={settings.redeem_options?.value || ""}
                                    onChange={(e) =>
                                        handleChange("redeem_options", "value", e.target.value)
                                    }
                                    placeholder="50000,100000,200000"
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Pisahkan dengan koma. Contoh: 50000,100000,200000
                                </p>
                            </div>

                            {/* Preview Redeem Options */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium mb-2">Preview Pilihan Redeem:</p>
                                <div className="flex flex-wrap gap-2">
                                    {(settings.redeem_options?.value || "50000,100000,200000")
                                        .split(",")
                                        .map((opt, idx) => {
                                            const amount = parseInt(opt.trim());
                                            const pointRate = parseInt(settings.point_rate?.value || 10000);
                                            const pointsNeeded = Math.ceil(amount / pointRate);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="px-3 py-2 bg-white border rounded-lg text-sm"
                                                >
                                                    <span className="font-medium">{formatRupiah(amount)}</span>
                                                    <span className="text-gray-500 ml-2">
                                                        ({pointsNeeded} poin)
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Info className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-medium text-blue-800">Informasi Penting</h3>
                            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                                <li>Poin dihitung dari harga setelah diskon (net purchase)</li>
                                <li>Ongkir tidak dihitung untuk mendapatkan poin</li>
                                <li>Produk yang sedang diskon tidak mendapatkan poin</li>
                                <li>Poin dasar akan dikalikan dengan multiplier tier customer</li>
                                <li>Redeem menggunakan akumulasi nilai rupiah dari poin yang terkumpul</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Simpan Pengaturan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default LoyaltySettings;
