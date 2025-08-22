import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Timeline, TimelineItem, TimelinePoint } from "flowbite-react";

export default function OrderCard({ order, onOrderUpdate }) {
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const dropdownRef = useRef(null);

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
        if (orderStatus === "cancelled") {
            return "text-red-500";
        }

        const statusSteps = {
            pending: 0,
            paid: 1,
            shipped: 2,
            delivered: 3,
        };

        const currentStep = statusSteps[orderStatus] || 0;
        return stepIndex <= currentStep ? "text-green-500" : "text-gray-300";
    };

    const statusBadge = getStatusBadge(order.status);

    // Get valid status transitions - allow all status changes
    const getValidStatusTransitions = (currentStatus) => {
        const allStatuses = ["pending", "paid", "shipped", "cancelled"];
        // Return all statuses except the current one
        return allStatuses.filter((status) => status !== currentStatus);
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
                `/api/orders/${order.id}/update-status`,
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

    const validTransitions = getValidStatusTransitions(order.status);

    return (
        <div className="border rounded-xl p-4 mb-4 bg-white shadow-sm text-sm">
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center text-xs text-gray-600 border-b pb-4 mb-4">
                <div className="grid">
                    <Link
                        href={`/order/detail/${order.id}`}
                        className="text-blue-600 font-semibold text-base hover:text-blue-800"
                    >
                        {order.number}
                    </Link>{" "}
                    dari App - {order.channel} ({order.date})
                </div>

                <div className="mt-2 md:mt-0 w-40 flex">
                    <Timeline horizontal className="!gap-8 flex">
                        <TimelineItem>
                            <TimelinePoint
                                icon={() => (
                                    <Icon
                                        icon="material-symbols:inventory-2"
                                        className={getTimelineStepColor(
                                            0,
                                            order.status
                                        )}
                                        width={20}
                                    />
                                )}
                            />
                        </TimelineItem>
                        <TimelineItem>
                            <TimelinePoint
                                icon={() => (
                                    <Icon
                                        icon="material-symbols:local-shipping-outline"
                                        className={getTimelineStepColor(
                                            1,
                                            order.status
                                        )}
                                        width={20}
                                    />
                                )}
                            />
                        </TimelineItem>
                        <TimelineItem>
                            <TimelinePoint
                                icon={() => (
                                    <Icon
                                        icon="material-symbols:send-outline"
                                        className={getTimelineStepColor(
                                            2,
                                            order.status
                                        )}
                                        width={20}
                                    />
                                )}
                            />
                        </TimelineItem>
                        <TimelineItem>
                            <TimelinePoint
                                icon={() => (
                                    <Icon
                                        icon="material-symbols:home-outline"
                                        className={getTimelineStepColor(
                                            3,
                                            order.status
                                        )}
                                        width={20}
                                    />
                                )}
                            />
                        </TimelineItem>
                    </Timeline>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 grid gap-2">
                    <div>
                        <div className="text-gray-500">Pemesan</div>
                        <div className="font-bold">{order.customer}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Dikirim kepada</div>
                        <div className="font-bold">{order.customer}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Admin</div>
                        <div className="font-bold">{order.admin}</div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-gray-500 mb-1 flex justify-between">
                        <span>Status Bayar & Total bayar</span>
                        <Link
                            href="#"
                            className="text-blue-600 text-sm font-medium"
                        >
                            Lihat Riwayat
                        </Link>
                    </div>
                    <div className="border rounded-md p-3">
                        <div className="text-xl font-bold text-gray-800">
                            Rp{order.total.toLocaleString("id-ID")}
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
                                    className={`${statusBadge.bgColor} ${
                                        statusBadge.textColor
                                    } text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1 ${
                                        validTransitions.length > 0 &&
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
                                    {order.status}
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
                                                            {status}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                            </div>
                            <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md">
                                {order.bank}
                            </span>
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
                                    {order.courier}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Resi : {order.resi || "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-gray-500 mb-1">
                        Produk (total {order.products.length} item)
                    </div>
                    <div className="space-y-1">
                        {order.products.map((product, i) => (
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
                        href={`/order/print-invoice/${order.id}`}
                        className="flex items-center gap-1 border px-3 py-1 rounded-md text-sm hover:bg-gray-100"
                    >
                        <Icon icon="mdi:printer" width="16" />
                        Print
                    </Link>
                </div>
                <div className="≈mt-6 pt-4 flex flex-wrap justify-end gap-2">
                    {!order.resi && (
                        <button className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50">
                            Update Resi
                        </button>
                    )}
                    <button className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50">
                        Tandai diterima
                    </button>
                    <Link
                        href={`/order/edit/${order.id}`}
                        className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50 flex items-center gap-2"
                    >
                        <Icon icon="mdi:pencil" width="16" />
                        Edit Order
                    </Link>
                </div>
            </div>
        </div>
    );
}
