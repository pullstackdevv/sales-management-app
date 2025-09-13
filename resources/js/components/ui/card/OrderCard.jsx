import { Icon } from "@iconify/react";
import { Link, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Timeline, TimelineItem, TimelinePoint } from "flowbite-react";
import PaymentHistoryModal from "../modal/PaymentHistoryModal";
import ShippingUpdateModal from "../modal/ShippingUpdateModal";
import OrderHistoryModal from "../modal/OrderHistoryModal";

// Helper function for route generation
const route = (name, params = null) => {
    const routes = {
        'cms.orders.show': (id) => `/cms/order/detail/${id}`,
        'cms.orders.payment-history': (id) => `/cms/order/payment-history/${id}`,
        'cms.orders.edit': (id) => `/cms/order/edit/${id}`
    };

    if (routes[name]) {
        return params ? routes[name](params) : routes[name]();
    }
    return '#';
};

export default function OrderCard({ order, onOrderUpdate }) {
    const [localOrder, setLocalOrder] = useState(order);


    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [showPaymentHistory, setShowPaymentHistory] = useState(false);
    const [showOrderHistory, setShowOrderHistory] = useState(false);
    const dropdownRef = useRef(null);

    // Update local order when prop changes
    useEffect(() => {
        setLocalOrder(order);
    }, [order]);



    // Helper function to determine order source
    const getOrderSource = (order) => {


        // Default to manual admin order
        return {
            type: 'manual',
            label: 'Manual',
            icon: 'mdi:account-tie',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-700',
            borderColor: 'border-gray-200'
        };
    };

    const orderSource = getOrderSource(order);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowStatusDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    // Helper function to get status badge styling
    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: {
                bgColor: "bg-yellow-100",
                textColor: "text-yellow-700",
                icon: "mdi:clock-outline",
            },
            paid: {
                bgColor: "bg-green-100",
                textColor: "text-green-700",
                icon: "mdi:check-circle",
            },
            shipped: {
                bgColor: "bg-blue-100",
                textColor: "text-blue-700",
                icon: "mdi:truck-outline",
            },
            delivered: {
                bgColor: "bg-green-100",
                textColor: "text-green-700",
                icon: "mdi:check-circle-outline",
            },
            cancelled: {
                bgColor: "bg-red-100",
                textColor: "text-red-700",
                icon: "mdi:close-circle",
            },
        };
        return statusConfig[status] || statusConfig.pending;
    };

    // Helper function to get timeline step styling
    const getTimelineStepColor = (stepIndex, orderStatus) => {
        // Gunakan raw_status jika tersedia, fallback ke status yang sudah ditransformasi
        const rawStatus = order.raw_status || orderStatus;

        // Jika status dibatalkan, semua ikon timeline berwarna merah
        if (rawStatus === "cancelled") {
            return "text-red-500";
        }

        const statusSteps = {
            pending: 0,
            paid: 1,
            processing: 1,
            shipped: 2,
            delivered: 3,
        };

        const currentStep = statusSteps[rawStatus] || 0;
        return stepIndex <= currentStep ? "text-green-500" : "text-gray-300";
    };

    // Helper function to get timeline step icons and tooltips
    const getTimelineStepData = (stepIndex) => {
        const stepData = [
            { icon: "material-symbols:inventory-2", tooltip: "Order Dibuat" },
            { icon: "material-symbols:credit-card", tooltip: "Pembayaran Dikonfirmasi" },
            { icon: "material-symbols:local-shipping-outline", tooltip: "Order Dikirim" },
            { icon: "material-symbols:home-outline", tooltip: "Order Diterima" }
        ];

        return stepData[stepIndex] || { icon: "material-symbols:circle", tooltip: "Status" };
    };

    const statusBadge = getStatusBadge(localOrder.raw_status || localOrder.status);

    // Get valid status transitions - allow all status changes
    const getValidStatusTransitions = (currentStatus) => {
        const allStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
        // Return all statuses except the current one
        return allStatuses.filter((status) => status !== currentStatus);
    };

    // Helper function to get status label in Indonesian
    const getStatusLabel = (status) => {
        const statusLabels = {
            pending: "Belum Bayar",
            paid: "Dibayar",
            shipped: "Dikirim",
            delivered: "Diterima",
            cancelled: "Dibatalkan"
        };
        return statusLabels[status] || status;
    };

    // Handle status update
    const handleStatusUpdate = async (newStatus) => {
        if (isUpdatingStatus) return;

        const result = await Swal.fire({
            title: "Konfirmasi",
            text: `Apakah Anda yakin ingin mengubah status order menjadi ${newStatus}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Ya, Ubah!",
            cancelButtonText: "Batal",
        });

        if (!result.isConfirmed) return;

        setIsUpdatingStatus(true);
        setShowStatusDropdown(false);

        try {
            const token =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content") ||
                localStorage.getItem("auth_token") ||
                "3|kQS8PzhP4mz4C2Ap5k5FS1tapDkeVFBExe5Mncfd1c7a3056";

            const response = await axios.post(
                `/api/orders/${localOrder.id}/update-status`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            );

            await Swal.fire({
                title: "Berhasil!",
                text: "Status order berhasil diubah.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
            });

            // Update local order state
            setLocalOrder(prev => ({ ...prev, status: newStatus }));

            // Call parent callback to refresh data
            if (onOrderUpdate) {
                onOrderUpdate();
            }
        } catch (error) {
            console.error("Error updating order status:", error);

            let errorMessage = "Terjadi kesalahan saat mengubah status order.";
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            await Swal.fire({
                title: "Error!",
                text: errorMessage,
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Handle mark as received
    const handleMarkReceived = async () => {
        console.log('handleMarkReceived called - Before update:', {
            orderId: localOrder.id,
            currentStatus: localOrder.status
        });

        const result = await Swal.fire({
            title: "Konfirmasi",
            text: "Apakah Anda yakin ingin menandai order ini sebagai diterima?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Ya, Tandai Diterima!",
            cancelButtonText: "Batal",
        });

        if (!result.isConfirmed) return;

        try {
            const token =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content") ||
                localStorage.getItem("auth_token") ||
                "4|8hsrBvL2F1UPGwDRqG5o2ojF4W8IeMjwk25uAi0V4887cc02";

            const response = await axios.post(
                `/api/orders/${localOrder.id}/update-status`,
                { status: 'delivered' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            );

            console.log('handleMarkReceived - After API call:', {
                orderId: localOrder.id,
                oldStatus: localOrder.status,
                newStatus: 'delivered',
                response: response.data
            });

            await Swal.fire({
                title: "Berhasil!",
                text: "Order berhasil ditandai sebagai diterima.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
            });

            // Update local order state
            setLocalOrder(prev => ({ ...prev, status: 'delivered' }));

            console.log('handleMarkReceived - After state update:', {
                orderId: localOrder.id,
                updatedStatus: 'delivered'
            });

            // Call parent callback to refresh data
            if (onOrderUpdate) {
                onOrderUpdate();
            }
        } catch (error) {
            console.error("Error marking order as received:", error);

            let errorMessage = "Terjadi kesalahan saat menandai order sebagai diterima.";
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            await Swal.fire({
                title: "Error!",
                text: errorMessage,
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    };

    const validTransitions = getValidStatusTransitions(localOrder.raw_status || localOrder.status);

    return (
        <div className={`border rounded-xl p-4 mb-4 bg-white shadow-sm text-sm ${orderSource.borderColor}`}>
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center text-xs text-gray-600 border-b pb-4 mb-4">
                <div className="grid">
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href={route('cms.orders.show', localOrder.id)}
                            className="text-blue-600 font-semibold text-base hover:text-blue-800"
                        >
                            {localOrder.number}
                        </Link>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${orderSource.bgColor} ${orderSource.textColor}`}>
                            <Icon icon={orderSource.icon} width={12} />
                            {orderSource.label}
                        </span>
                    </div>
                    dari App - {localOrder.sales_channel} ({localOrder.date})
                </div>

                <div className="mt-2 md:mt-0 w-40 flex">
                    <Timeline horizontal className="!gap-8 flex">
                        {[0, 1, 2, 3].map((stepIndex) => {
                            const stepData = getTimelineStepData(stepIndex);
                            return (
                                <TimelineItem key={stepIndex}>
                                    <TimelinePoint
                                        icon={() => (
                                            <div
                                                className="relative group cursor-pointer"
                                                title={stepData.tooltip}
                                            >
                                                <Icon
                                                    icon={stepData.icon}
                                                    className={getTimelineStepColor(
                                                        stepIndex,
                                                        localOrder.status
                                                    )}
                                                    width={20}
                                                    height={20}
                                                />
                                                {/* Custom tooltip */}
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                                    {stepData.tooltip}
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                                </div>
                                            </div>
                                        )}
                                    />
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 grid gap-2">
                    <div>
                        <div className="text-gray-500">Pemesan</div>
                        <div className="font-bold">{localOrder.customer}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Dikirim kepada</div>
                        <div className="font-bold">{localOrder.customer}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Admin</div>
                        <div className="font-bold">{localOrder.admin}</div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-gray-500 mb-1">
                        Status Bayar & Total bayar
                    </div>
                    <div className="border rounded-md p-3">
                        <div className="text-xl font-bold text-gray-800">
                            Rp{localOrder.total.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() =>
                                        setShowStatusDropdown(
                                            !showStatusDropdown
                                        )
                                    }
                                    disabled={
                                        isUpdatingStatus ||
                                        validTransitions.length === 0
                                    }
                                    className={`${statusBadge.bgColor} ${statusBadge.textColor
                                        } text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1 ${validTransitions.length > 0 &&
                                            !isUpdatingStatus
                                            ? "hover:opacity-80 cursor-pointer"
                                            : "cursor-default"
                                        } ${isUpdatingStatus ? "opacity-50" : ""}`}
                                >
                                    {isUpdatingStatus ? (
                                        <Icon
                                            icon="mdi:loading"
                                            width="14"
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Icon
                                            icon={statusBadge.icon}
                                            width="14"
                                        />
                                    )}
                                    {getStatusLabel(localOrder.status)}
                                    {validTransitions.length > 0 &&
                                        !isUpdatingStatus && (
                                            <Icon
                                                icon="mdi:chevron-down"
                                                width="12"
                                            />
                                        )}
                                </button>

                                {showStatusDropdown &&
                                    validTransitions.length > 0 && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                                            {validTransitions.map((status) => {
                                                const statusConfig =
                                                    getStatusBadge(status);
                                                return (
                                                    <button
                                                        key={status}
                                                        onClick={() =>
                                                            handleStatusUpdate(
                                                                status
                                                            )
                                                        }
                                                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 first:rounded-t-md last:rounded-b-md"
                                                    >
                                                        <Icon
                                                            icon={
                                                                statusConfig.icon
                                                            }
                                                            width="14"
                                                            className={
                                                                statusConfig.textColor
                                                            }
                                                        />
                                                        <span className="capitalize">
                                                            {getStatusLabel(status)}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                            </div>
                            {localOrder.payment_bank && !localOrder.payment_url && (
                                <div className="relative group">
                                    <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md cursor-help">
                                        {localOrder.bank}
                                    </span>
                                    {/* Tooltip with bank details */}
                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md p-2 whitespace-nowrap z-10 shadow-lg">
                                        <div className="font-semibold">{localOrder.payment_bank.bank_name}</div>
                                        <div>No. Rek: {localOrder.payment_bank.account_number}</div>
                                        <div>A/n: {localOrder.payment_bank.account_name}</div>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                </div>
                            )}
                            {localOrder.payment_url && (
                                <div className="flex items-center gap-2">
                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                        <Icon icon="mdi:credit-card" width="12" />
                                        Payment Gateway
                                    </span>
                                    {localOrder.payment_status && (
                                        <span className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${localOrder.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                localOrder.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    localOrder.payment_status === 'expired' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            <Icon icon={
                                                localOrder.payment_status === 'paid' ? 'mdi:check-circle' :
                                                    localOrder.payment_status === 'pending' ? 'mdi:clock' :
                                                        localOrder.payment_status === 'expired' ? 'mdi:close-circle' :
                                                            'mdi:help-circle'
                                            } width="12" />
                                            {localOrder.payment_status === 'paid' ? 'Dibayar' :
                                                localOrder.payment_status === 'pending' ? 'Menunggu' :
                                                    localOrder.payment_status === 'expired' ? 'Kedaluwarsa' :
                                                        localOrder.payment_status}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="text-gray-500 mb-1">Kurir</div>
                        <div className="flex items-center gap-3 border rounded-md px-3 py-2">
                            <div className="bg-sky-500 p-2 rounded-lg text-white">
                                <Icon
                                    icon="mdi:package-variant-closed"
                                    width="20"
                                />
                            </div>
                            <div>
                                <div className="font-semibold">
                                    {localOrder.courier}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Resi : {localOrder.resi || "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-gray-500 mb-1">
                        Produk (total {localOrder.products.length} item)
                    </div>
                    <div className="space-y-1">
                        {localOrder.products.map((product, i) => (
                            <Link
                                key={i}
                                href="#"
                                className="text-blue-600 underline block text-sm"
                            >
                                {product}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between border-t mt-4">
                <div className="flex items-center gap-2 mt-4">
                    <Link 
                        href={`/cms/order/print-invoice/${localOrder.id}`}
                        className="flex items-center gap-1 border px-3 py-1 rounded-md text-sm hover:bg-gray-100"
                    >
                        <Icon icon="mdi:printer" width="16" />
                        Print
                    </Link>
                    <button
                        onClick={() => setShowOrderHistory(true)}
                        className="flex items-center gap-1 border px-3 py-1 rounded-md text-sm hover:bg-gray-100"
                    >
                        <Icon icon="mdi:history" width="16" />
                        Lihat Riwayat
                    </button>
                </div>
                <div className="≈mt-6 pt-4 flex flex-wrap justify-end gap-2">
                    {(() => {
                        const shouldShowShipping = localOrder.status === 'Paid' || localOrder.status === 'paid' || localOrder.status === 'shipped' || localOrder.status === 'Dikirim';

                        return shouldShowShipping;
                    })() && (
                            <button
                                onClick={() => setShowShippingModal(true)}
                                className="border border-green-600 text-green-600 px-4 py-1.5 rounded-md hover:bg-green-50 flex items-center gap-2"
                            >
                                <Icon icon="mdi:truck" width="16" />
                                Update Shipping
                            </button>
                        )}
                    {(() => {
                        const shouldShow = localOrder.status !== 'delivered' && localOrder.status !== 'Diterima';

                        return shouldShow;
                    })() && (
                            <button
                                onClick={handleMarkReceived}
                                className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50"
                            >
                                Tandai diterima
                            </button>
                        )}
                    <Link
                        href={route('cms.orders.edit', localOrder.id)}
                        className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50 flex items-center gap-2"
                    >
                        <Icon icon="mdi:pencil" width="16" />
                        Edit Order
                    </Link>
                </div>
            </div>

            {/* Shipping Update Modal */}
            <ShippingUpdateModal
                isOpen={showShippingModal}
                onClose={() => setShowShippingModal(false)}
                order={localOrder}
                onUpdate={() => {
                    if (onOrderUpdate) {
                        onOrderUpdate();
                    }
                }}
            />

            {/* Payment History Modal */}
            <PaymentHistoryModal
                isOpen={showPaymentHistory}
                onClose={() => setShowPaymentHistory(false)}
                order={localOrder}
            />

            {/* Order History Modal */}
            <OrderHistoryModal
                isOpen={showOrderHistory}
                onClose={() => setShowOrderHistory(false)}
                orderId={localOrder.id}
            />
        </div>
    );
}
