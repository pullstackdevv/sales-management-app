<?php

namespace App\Http\Controllers;

use App\Models\ProductVariant;
use App\Models\UserNotificationRead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get low stock notifications for the current user.
     * Returns product variants with stock < 2 and their read status.
     */
    public function getLowStockNotifications(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get product variants with stock < 2
        $lowStockVariants = ProductVariant::with(['product:id,name'])
            ->where('stock', '<', 2)
            ->where('is_active', true)
            ->orderBy('stock', 'asc')
            ->get(['id', 'product_id', 'variant_label', 'sku', 'stock', 'updated_at']);

        // Get read status for this user
        $readNotifications = UserNotificationRead::where('user_id', $user->id)
            ->whereIn('product_variant_id', $lowStockVariants->pluck('id'))
            ->pluck('product_variant_id')
            ->toArray();

        // Map notifications with read status
        $notifications = $lowStockVariants->map(function ($variant) use ($readNotifications) {
            return [
                'id' => $variant->id,
                'product_name' => $variant->product->name ?? 'Unknown Product',
                'variant_label' => $variant->variant_label,
                'variant_sku' => $variant->sku,
                'stock' => $variant->stock,
                'updated_at' => $variant->updated_at,
                'is_read' => in_array($variant->id, $readNotifications),
            ];
        });

        // Count unread
        $unreadCount = $notifications->where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
                'total_count' => $notifications->count(),
            ]
        ]);
    }

    /**
     * Mark a notification as read for the current user.
     */
    public function markAsRead(Request $request, $variantId)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Check if variant exists
        $variant = ProductVariant::find($variantId);
        if (!$variant) {
            return response()->json([
                'success' => false,
                'message' => 'Product variant not found'
            ], 404);
        }

        // Create or update read status
        UserNotificationRead::updateOrCreate(
            [
                'user_id' => $user->id,
                'product_variant_id' => $variantId,
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
     * Mark all low stock notifications as read for the current user.
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

        // Get all low stock variant IDs
        $lowStockVariantIds = ProductVariant::where('stock', '<', 2)
            ->where('is_active', true)
            ->pluck('id');

        // Mark all as read
        foreach ($lowStockVariantIds as $variantId) {
            UserNotificationRead::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'product_variant_id' => $variantId,
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
}
