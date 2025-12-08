import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch notifications on mount and periodically
    useEffect(() => {
        fetchNotifications();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
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
            const response = await api.get("/notifications");
            if (response.data.success) {
                setNotifications(response.data.data.notifications);
                setUnreadCount(response.data.data.unread_count);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await api.post(`/notifications/mark-read/${notificationId}`);
            // Update local state
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
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

    const handleNotificationClick = (notif) => {
        if (!notif.is_read) {
            handleMarkAsRead(notif.id);
        }
        if (notif.link) {
            window.location.href = notif.link;
        }
    };

    const getNotificationStyle = (type, color) => {
        const styles = {
            new_order: { bg: "bg-blue-100", text: "text-blue-600", icon: "solar:cart-check-bold" },
            low_stock: { bg: "bg-amber-100", text: "text-amber-600", icon: "solar:box-minimalistic-bold" },
            order_expired: { bg: "bg-gray-100", text: "text-gray-600", icon: "solar:clock-circle-bold" },
        };
        
        // Override with color if provided
        if (color === 'red') {
            return { bg: "bg-red-100", text: "text-red-600", icon: styles[type]?.icon || "solar:bell-bold" };
        }
        
        return styles[type] || { bg: "bg-gray-100", text: "text-gray-600", icon: "solar:bell-bold" };
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Baru saja";
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        
        return date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
            >
                <Icon icon="solar:bell-outline" className="text-xl text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon icon="solar:bell-bold" className="text-blue-500 text-lg" />
                                <span className="font-semibold text-gray-800 text-sm">Notifikasi</span>
                                {unreadCount > 0 && (
                                    <span className="bg-red-100 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={loading}
                                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                                >
                                    {loading ? "..." : "Baca semua"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-80">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Icon icon="solar:bell-off-outline" className="text-4xl text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
                            </div>
                        ) : (
                            notifications.map((notif, index) => {
                                const style = getNotificationStyle(notif.type, notif.color);
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all ${
                                            !notif.is_read ? "bg-blue-50/40" : ""
                                        } ${index !== notifications.length - 1 ? "border-b border-gray-50" : ""}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                                                <Icon icon={notif.icon || style.icon} className={`text-lg ${style.text}`} />
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-medium text-gray-800 leading-tight">
                                                        {notif.title}
                                                    </p>
                                                    {!notif.is_read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {formatTime(notif.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
