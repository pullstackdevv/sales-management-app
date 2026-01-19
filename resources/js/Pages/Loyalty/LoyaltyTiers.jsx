import { useState, useEffect } from "react";
import { 
    ArrowLeft, 
    Pencil, 
    CheckCircle, 
    Info, 
    X, 
    Save, 
    Loader2,
    Check,
    Award,
    Crown,
    Star,
    Gem,
    Trophy,
    Heart
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

function LoyaltyTiers() {
    const [loading, setLoading] = useState(true);
    const [tiers, setTiers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingTier, setEditingTier] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        min_annual_spend: "",
        max_annual_spend: "",
        multiplier: "1",
        color: "#ec4899",
        icon: "Award",
        benefits: "",
        order: 0,
        is_active: true,
    });

    const colorOptions = [
        { value: "#ec4899", label: "Pink", bg: "bg-pink-500" },
        { value: "#f59e0b", label: "Gold", bg: "bg-amber-500" },
        { value: "#8b5cf6", label: "Purple", bg: "bg-purple-500" },
        { value: "#3b82f6", label: "Blue", bg: "bg-blue-500" },
        { value: "#10b981", label: "Green", bg: "bg-emerald-500" },
        { value: "#ef4444", label: "Red", bg: "bg-red-500" },
    ];

    const iconOptions = [
        { value: "Award", label: "Award", component: Award },
        { value: "Crown", label: "Crown", component: Crown },
        { value: "Star", label: "Star", component: Star },
        { value: "Gem", label: "Gem", component: Gem },
        { value: "Trophy", label: "Trophy", component: Trophy },
        { value: "Heart", label: "Heart", component: Heart },
    ];

    const getIconComponent = (iconName) => {
        const iconMap = { Award, Crown, Star, Gem, Trophy, Heart };
        return iconMap[iconName] || Award;
    };

    useEffect(() => {
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        try {
            setLoading(true);
            const response = await api.get("/loyalty/tiers");
            setTiers(response.data.tiers || []);
        } catch (error) {
            console.error("Error fetching tiers:", error);
            Swal.fire("Error", "Gagal memuat data tier", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (tier = null) => {
        if (tier) {
            setEditingTier(tier);
            setFormData({
                name: tier.name || "",
                min_annual_spend: tier.min_annual_spend || "",
                max_annual_spend: tier.max_annual_spend || "",
                multiplier: tier.multiplier || "1",
                color: tier.color || "#ec4899",
                icon: tier.icon || "solar:medal-ribbons-star-outline",
                benefits: tier.benefits || "",
                order: tier.order || 0,
                is_active: tier.is_active ?? true,
            });
        } else {
            setEditingTier(null);
            setFormData({
                name: "",
                min_annual_spend: "",
                max_annual_spend: "",
                multiplier: "1",
                color: "#ec4899",
                icon: "Award",
                benefits: "",
                order: tiers.length,
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTier(null);
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            Swal.fire("Error", "Nama tier harus diisi", "error");
            return;
        }
        if (!formData.min_annual_spend) {
            Swal.fire("Error", "Minimal belanja tahunan harus diisi", "error");
            return;
        }

        try {
            setSaving(true);
            if (editingTier) {
                await api.put(`/loyalty/tiers/${editingTier.id}`, formData);
                Swal.fire("Berhasil", "Tier berhasil diperbarui", "success");
            } else {
                await api.post("/loyalty/tiers", formData);
                Swal.fire("Berhasil", "Tier berhasil ditambahkan", "success");
            }
            handleCloseModal();
            fetchTiers();
        } catch (error) {
            console.error("Error saving tier:", error);
            Swal.fire("Error", error.response?.data?.message || "Gagal menyimpan tier", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (tier) => {
        try {
            await api.post(`/loyalty/tiers/${tier.id}/toggle-status`);
            Swal.fire("Berhasil", `Tier ${tier.is_active ? "dinonaktifkan" : "diaktifkan"}`, "success");
            fetchTiers();
        } catch (error) {
            console.error("Error toggling tier status:", error);
            Swal.fire("Error", "Gagal mengubah status tier", "error");
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href="/cms/loyalty/settings"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-bold">Tier Membership</h1>
                    </div>
                    <p className="text-gray-500">
                        Kelola tier membership berdasarkan belanja tahunan customer
                    </p>
                </div>

                {/* Tier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tiers.map((tier) => (
                        <div key={tier.id} className="relative overflow-hidden bg-white rounded-lg shadow-sm border">
                            {/* Color Bar */}
                            <div
                                className="absolute top-0 left-0 right-0 h-2"
                                style={{ backgroundColor: tier.color || "#ec4899" }}
                            />

                            <div className="p-5 pt-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: `${tier.color}20` }}
                                        >
                                            {(() => {
                                                const IconComp = getIconComponent(tier.icon || "Award");
                                                return <IconComp className="w-7 h-7" style={{ color: tier.color }} />;
                                            })()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{tier.name}</h3>
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${tier.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                {tier.is_active ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenModal(tier)}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">Threshold Belanja</span>
                                        <span className="font-semibold text-sm">
                                            {formatRupiah(tier.min_annual_spend)}
                                            {tier.max_annual_spend ? ` - ${formatRupiah(tier.max_annual_spend)}` : "+"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">Multiplier Poin</span>
                                        <span className="font-semibold text-green-600">
                                            {tier.multiplier}x
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">Jumlah Customer</span>
                                        <span className="font-semibold">
                                            {tier.customer_points_count || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Benefits */}
                                {tier.benefits && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Benefits:</p>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            {tier.benefits.split("\n").filter(b => b.trim()).map((benefit, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Toggle */}
                                <div className="mt-4 pt-4 border-t">
                                    <ToggleSwitch
                                        label="Status Aktif"
                                        checked={tier.is_active}
                                        onChange={() => handleToggleStatus(tier)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {tiers.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">
                                Belum ada tier membership
                            </h3>
                            <p className="text-gray-500">
                                Tier membership akan ditampilkan di sini
                            </p>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Info className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-medium text-amber-800">Catatan</h3>
                            <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                                <li>Tier tidak dapat dihapus, hanya bisa dinonaktifkan</li>
                                <li>Customer akan otomatis naik tier berdasarkan total belanja tahunan</li>
                                <li>Tier reset setiap tanggal 1 Januari</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Custom Modal for Add/Edit Tier */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50" 
                            onClick={handleCloseModal}
                        ></div>
                        
                        {/* Modal Content */}
                        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="text-lg font-semibold">
                                    Edit Tier
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nama Tier *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        placeholder="Contoh: Pretty Gold"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Min. Belanja Tahunan (Rp) *</label>
                                        <input
                                            type="number"
                                            value={formData.min_annual_spend}
                                            onChange={(e) => handleChange("min_annual_spend", e.target.value)}
                                            placeholder="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Max. Belanja Tahunan (Rp)</label>
                                        <input
                                            type="number"
                                            value={formData.max_annual_spend}
                                            onChange={(e) => handleChange("max_annual_spend", e.target.value)}
                                            placeholder="Kosongkan jika unlimited"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Kosongkan untuk tier tertinggi
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Multiplier Poin *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        max="10"
                                        value={formData.multiplier}
                                        onChange={(e) => handleChange("multiplier", e.target.value)}
                                        placeholder="1.5"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Contoh: 1.5 = poin dasar × 1.5
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Warna Tier</label>
                                    <div className="flex gap-2 mt-2">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => handleChange("color", color.value)}
                                                className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center transition-transform ${
                                                    formData.color === color.value
                                                        ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                                                        : ""
                                                }`}
                                            >
                                                {formData.color === color.value && (
                                                    <Check className="w-5 h-5 text-white" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Icon Tier</label>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {iconOptions.map((iconOpt) => {
                                        const IconComp = iconOpt.component;
                                        return (
                                            <button
                                                key={iconOpt.value}
                                                type="button"
                                                onClick={() => handleChange("icon", iconOpt.value)}
                                                className={`p-3 rounded-lg border transition-colors ${
                                                    formData.icon === iconOpt.value
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                <IconComp
                                                    className="w-6 h-6"
                                                    style={{ color: formData.color }}
                                                />
                                            </button>
                                        );
                                    })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Benefits (satu per baris)</label>
                                    <textarea
                                        value={formData.benefits}
                                        onChange={(e) => handleChange("benefits", e.target.value)}
                                        placeholder="Gratis ongkir&#10;Diskon eksklusif&#10;Akses early sale"
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <ToggleSwitch
                                    label="Tier Aktif"
                                    checked={formData.is_active}
                                    onChange={(checked) => handleChange("is_active", checked)}
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 p-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
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
                                            Simpan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default LoyaltyTiers;
