import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import {
    Button,
    TextInput,
    Label,
    ToggleSwitch,
    Spinner,
    Card,
    Modal,
    Textarea,
    Badge,
} from "flowbite-react";
import api from "../../api/axios";
import Swal from "sweetalert2";

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
        icon: "solar:medal-ribbons-star-outline",
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
        { value: "solar:medal-ribbons-star-outline", label: "Medal Star" },
        { value: "solar:crown-outline", label: "Crown" },
        { value: "solar:star-outline", label: "Star" },
        { value: "solar:diamond-outline", label: "Diamond" },
        { value: "solar:cup-star-outline", label: "Trophy" },
        { value: "solar:heart-outline", label: "Heart" },
    ];

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
                icon: "solar:medal-ribbons-star-outline",
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
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href="/cms/loyalty/settings"
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <Icon icon="solar:arrow-left-outline" width={20} />
                            </Link>
                            <h1 className="text-2xl font-bold">Tier Membership</h1>
                        </div>
                        <p className="text-gray-500">
                            Kelola tier membership berdasarkan belanja tahunan customer
                        </p>
                    </div>
                    <Button color="blue" onClick={() => handleOpenModal()}>
                        <Icon icon="solar:add-circle-outline" width={20} className="mr-2" />
                        Tambah Tier
                    </Button>
                </div>

                {/* Tier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tiers.map((tier) => (
                        <Card key={tier.id} className="relative overflow-hidden">
                            {/* Color Bar */}
                            <div
                                className="absolute top-0 left-0 right-0 h-2"
                                style={{ backgroundColor: tier.color || "#ec4899" }}
                            />

                            <div className="pt-2">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: `${tier.color}20` }}
                                        >
                                            <Icon
                                                icon={tier.icon || "solar:medal-ribbons-star-outline"}
                                                width={28}
                                                style={{ color: tier.color }}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{tier.name}</h3>
                                            <Badge color={tier.is_active ? "success" : "gray"}>
                                                {tier.is_active ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenModal(tier)}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Icon icon="solar:pen-outline" width={18} />
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
                                                    <Icon
                                                        icon="solar:check-circle-outline"
                                                        width={16}
                                                        className="text-green-500 mt-0.5 flex-shrink-0"
                                                    />
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Toggle */}
                                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Status Aktif</span>
                                    <ToggleSwitch
                                        checked={tier.is_active}
                                        onChange={() => handleToggleStatus(tier)}
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Empty State */}
                    {tiers.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <Icon
                                icon="solar:medal-ribbons-star-outline"
                                width={64}
                                className="mx-auto text-gray-300 mb-4"
                            />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">
                                Belum ada tier membership
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Tambahkan tier untuk mengatur level membership customer
                            </p>
                            <Button color="blue" onClick={() => handleOpenModal()}>
                                <Icon icon="solar:add-circle-outline" width={20} className="mr-2" />
                                Tambah Tier Pertama
                            </Button>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Icon icon="solar:info-circle-outline" width={24} className="text-amber-600 mt-0.5" />
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

                {/* Modal Add/Edit */}
                <Modal show={showModal} onClose={handleCloseModal} size="lg">
                    <Modal.Header>
                        {editingTier ? "Edit Tier" : "Tambah Tier Baru"}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" value="Nama Tier *" />
                                <TextInput
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="Contoh: Pretty Gold"
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="min_annual_spend" value="Min. Belanja Tahunan (Rp) *" />
                                    <TextInput
                                        id="min_annual_spend"
                                        type="number"
                                        value={formData.min_annual_spend}
                                        onChange={(e) => handleChange("min_annual_spend", e.target.value)}
                                        placeholder="0"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="max_annual_spend" value="Max. Belanja Tahunan (Rp)" />
                                    <TextInput
                                        id="max_annual_spend"
                                        type="number"
                                        value={formData.max_annual_spend}
                                        onChange={(e) => handleChange("max_annual_spend", e.target.value)}
                                        placeholder="Kosongkan jika unlimited"
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Kosongkan untuk tier tertinggi
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="multiplier" value="Multiplier Poin *" />
                                <TextInput
                                    id="multiplier"
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="10"
                                    value={formData.multiplier}
                                    onChange={(e) => handleChange("multiplier", e.target.value)}
                                    placeholder="1.5"
                                    className="mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Contoh: 1.5 = poin dasar × 1.5
                                </p>
                            </div>

                            <div>
                                <Label value="Warna Tier" />
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
                                                <Icon icon="solar:check-outline" className="text-white" width={20} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label value="Icon Tier" />
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {iconOptions.map((icon) => (
                                        <button
                                            key={icon.value}
                                            type="button"
                                            onClick={() => handleChange("icon", icon.value)}
                                            className={`p-3 rounded-lg border transition-colors ${
                                                formData.icon === icon.value
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <Icon
                                                icon={icon.value}
                                                width={24}
                                                style={{ color: formData.color }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="benefits" value="Benefits (satu per baris)" />
                                <Textarea
                                    id="benefits"
                                    value={formData.benefits}
                                    onChange={(e) => handleChange("benefits", e.target.value)}
                                    placeholder="Gratis ongkir&#10;Diskon eksklusif&#10;Akses early sale"
                                    rows={4}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <ToggleSwitch
                                    checked={formData.is_active}
                                    onChange={(checked) => handleChange("is_active", checked)}
                                />
                                <Label value="Tier Aktif" />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button color="gray" onClick={handleCloseModal}>
                            Batal
                        </Button>
                        <Button color="blue" onClick={handleSubmit} disabled={saving}>
                            {saving ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Icon icon="solar:diskette-outline" width={20} className="mr-2" />
                                    Simpan
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </DashboardLayout>
    );
}

export default LoyaltyTiers;
