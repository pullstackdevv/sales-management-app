import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Button, TextInput, Label, ToggleSwitch, Spinner, Card } from "flowbite-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

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
            toast.error("Gagal memuat pengaturan loyalty");
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
            toast.success("Pengaturan loyalty berhasil disimpan");
        } catch (error) {
            console.error("Error saving loyalty settings:", error);
            toast.error("Gagal menyimpan pengaturan loyalty");
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
                    <Spinner size="xl" />
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
                        <Icon icon="solar:medal-ribbons-star-outline" width={20} />
                        Kelola Tier Membership
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Sistem */}
                    <Card>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Icon icon="solar:power-outline" width={24} className="text-green-600" />
                            Status Sistem Loyalty
                        </h2>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">Aktifkan Sistem Loyalty</p>
                                <p className="text-sm text-gray-500">
                                    Jika dinonaktifkan, customer tidak akan mendapat poin
                                </p>
                            </div>
                            <ToggleSwitch
                                checked={settings.loyalty_active?.value === "1"}
                                onChange={(checked) =>
                                    handleChange("loyalty_active", "value", checked ? "1" : "0")
                                }
                            />
                        </div>
                    </Card>

                    {/* Earn Points */}
                    <Card>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Icon icon="solar:wallet-money-outline" width={24} className="text-blue-600" />
                            Pengaturan Earn Points
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="point_rate" value="Rate Poin (Rupiah per 1 Poin)" />
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-gray-500">Rp</span>
                                    <TextInput
                                        id="point_rate"
                                        type="number"
                                        value={settings.point_rate?.value || ""}
                                        onChange={(e) =>
                                            handleChange("point_rate", "value", e.target.value)
                                        }
                                        placeholder="10000"
                                        className="flex-1"
                                    />
                                    <span className="text-gray-500">= 1 Poin</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Contoh: Belanja {formatRupiah(settings.point_rate?.value || 10000)} mendapat 1 poin dasar
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Redeem Points */}
                    <Card>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Icon icon="solar:gift-outline" width={24} className="text-orange-600" />
                            Pengaturan Redeem
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="min_redeem_amount" value="Minimal Nilai Redeem (Rupiah)" />
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-gray-500">Rp</span>
                                    <TextInput
                                        id="min_redeem_amount"
                                        type="number"
                                        value={settings.min_redeem_amount?.value || ""}
                                        onChange={(e) =>
                                            handleChange("min_redeem_amount", "value", e.target.value)
                                        }
                                        placeholder="50000"
                                        className="flex-1"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimal akumulasi nilai rupiah dari poin untuk bisa di-redeem
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="max_redeem_percentage" value="Maksimal Redeem (% dari Total Transaksi)" />
                                <div className="flex items-center gap-2 mt-1">
                                    <TextInput
                                        id="max_redeem_percentage"
                                        type="number"
                                        value={settings.max_redeem_percentage?.value || ""}
                                        onChange={(e) =>
                                            handleChange("max_redeem_percentage", "value", e.target.value)
                                        }
                                        placeholder="20"
                                        className="flex-1"
                                        min="1"
                                        max="100"
                                    />
                                    <span className="text-gray-500">%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Contoh: Maksimal {settings.max_redeem_percentage?.value || 20}% dari total belanja bisa dibayar dengan redeem poin
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Redeem Options */}
                    <Card>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Icon icon="solar:checklist-outline" width={24} className="text-purple-600" />
                            Pilihan Redeem
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="redeem_options" value="Pilihan Nilai Rupiah untuk Redeem" />
                                <TextInput
                                    id="redeem_options"
                                    type="text"
                                    value={settings.redeem_options?.value || ""}
                                    onChange={(e) =>
                                        handleChange("redeem_options", "value", e.target.value)
                                    }
                                    placeholder="50000,100000,200000"
                                    className="mt-1"
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
                    </Card>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Icon icon="solar:info-circle-outline" width={24} className="text-blue-600 mt-0.5" />
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
                    <Button
                        color="blue"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6"
                    >
                        {saving ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Icon icon="solar:diskette-outline" width={20} className="mr-2" />
                                Simpan Pengaturan
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default LoyaltySettings;
