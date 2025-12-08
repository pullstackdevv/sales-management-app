import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";

const StockNotification = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch notifications on mount and periodically
    useEffect(() => {
        fetchNotifications();
        
        // Refresh every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get("/notifications/low-stock");
            if (response.data.success) {
                setNotifications(response.data.data.notifications);
                setUnreadCount(response.data.data.unread_count);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const handleMarkAsRead = async (variantId) => {
        try {
            await api.post(`/notifications/mark-read/${variantId}`);
            // Update local state
            setNotifications(prev => 
                prev.map(n => n.id === variantId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await api.post("/notifications/mark-all-read");
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStockBadgeColor = (stock) => {
        if (stock === 0) return "bg-red-100 text-red-700";
        return "bg-yellow-100 text-yellow-700";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
            >
                <Icon icon="solar:bell-linear" className="text-xl text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-2">
                            <Icon icon="solar:box-minimalistic-outline" className="text-orange-500" />
                            <span className="font-semibold text-sm">Stok Rendah</span>
                            {unreadCount > 0 && (
                                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                                    {unreadCount} baru
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                disabled={loading}
                                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                                {loading ? "..." : "Tandai semua dibaca"}
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-72">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <Icon icon="solar:check-circle-outline" className="text-4xl text-green-500 mx-auto mb-2" />
                                <p className="text-sm">Semua stok aman!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                    className={`px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                                        !notif.is_read ? "bg-blue-50" : ""
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full ${getStockBadgeColor(notif.stock)}`}>
                                            <Icon 
                                                icon={notif.stock === 0 ? "solar:danger-triangle-outline" : "solar:info-circle-outline"} 
                                                className="text-lg" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {notif.product_name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {notif.variant_label} • {notif.variant_sku}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStockBadgeColor(notif.stock)}`}>
                                                    Stok: {notif.stock}
                                                </span>
                                                {!notif.is_read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t bg-gray-50">
                            <a 
                                href="/cms/product/data" 
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                            >
                                Lihat semua produk
                                <Icon icon="solar:arrow-right-linear" />
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StockNotification;
