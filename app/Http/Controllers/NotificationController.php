<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationRead;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the current user.
     */
    public function getNotifications(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Auto-generate low stock notifications
        $this->autoGenerateLowStockNotifications();

        // Get notifications from last 7 days, ordered by newest first
        $notifications = Notification::where('created_at', '>=', now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        // Get read notification IDs for this user
        $readNotificationIds = NotificationRead::where('user_id', $user->id)
            ->whereIn('notification_id', $notifications->pluck('id'))
            ->pluck('notification_id')
            ->toArray();

        // Map notifications with read status
        $mappedNotifications = $notifications->map(function ($notif) use ($readNotificationIds) {
            return [
                'id' => $notif->id,
                'type' => $notif->type,
                'title' => $notif->title,
                'message' => $notif->message,
                'icon' => $notif->icon,
                'color' => $notif->color,
                'link' => $notif->link,
                'data' => $notif->data,
                'created_at' => $notif->created_at,
                'is_read' => in_array($notif->id, $readNotificationIds),
            ];
        });

        // Count unread
        $unreadCount = $mappedNotifications->where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $mappedNotifications,
                'unread_count' => $unreadCount,
                'total_count' => $mappedNotifications->count(),
            ]
        ]);
    }

    /**
     * Mark a notification as read for the current user.
     */
    public function markAsRead(Request $request, $notificationId)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Check if notification exists
        $notification = Notification::find($notificationId);
        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }

        // Create or update read status
        NotificationRead::updateOrCreate(
            [
                'user_id' => $user->id,
                'notification_id' => $notificationId,
            ],
            [
                'read_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read'
        ]);
    }

    /**
     * Mark all notifications as read for the current user.
     */
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get all notification IDs from last 7 days
        $notificationIds = Notification::where('created_at', '>=', now()->subDays(7))
            ->pluck('id');

        // Mark all as read
        foreach ($notificationIds as $notificationId) {
            NotificationRead::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'notification_id' => $notificationId,
                ],
                [
                    'read_at' => now(),
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }

    /**
     * Generate low stock notifications.
     * This should be called periodically (e.g., via scheduler or after stock changes).
     */
    public function generateLowStockNotifications()
    {
        $created = $this->autoGenerateLowStockNotifications();

        return response()->json([
            'success' => true,
            'message' => "Generated {$created} low stock notifications"
        ]);
    }

    /**
     * Auto-generate low stock notifications for variants with stock < 2
     */
    private function autoGenerateLowStockNotifications(): int
    {
        $lowStockVariants = ProductVariant::with(['product:id,name'])
            ->where('stock', '<', 2)
            ->where('is_active', true)
            ->get();

        $created = 0;
        foreach ($lowStockVariants as $variant) {
            if ($variant->product) {
                $notification = Notification::createLowStock($variant, $variant->product);
                if ($notification->wasRecentlyCreated) {
                    $created++;
                }
            }
        }

        return $created;
    }
}
