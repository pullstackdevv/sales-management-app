<?php

namespace App\Helpers;

use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\Log;

class NotificationHelper
{
    /**
     * Create notification for new order
     * 
     * @param Order $order - Order with customer and address relations loaded
     * @return Notification|null
     */
    public static function newOrder($order)
    {
        try {
            return Notification::createNewOrder($order);
        } catch (\Exception $e) {
            Log::error('Failed to create new order notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create notification for low stock
     * 
     * @param ProductVariant $variant
     * @param Product $product
     * @return Notification|null
     */
    public static function lowStock($variant, $product)
    {
        try {
            return Notification::createLowStock($variant, $product);
        } catch (\Exception $e) {
            Log::error('Failed to create low stock notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create notification for expired order
     * 
     * @param Order $order - Order with customer and address relations loaded
     * @return Notification|null
     */
    public static function orderExpired($order)
    {
        try {
            return Notification::createOrderExpired($order);
        } catch (\Exception $e) {
            Log::error('Failed to create order expired notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create notification for order status change
     * 
     * @param Order $order
     * @param string $oldStatus
     * @param string $newStatus
     * @return Notification|null
     */
    public static function orderStatusChanged($order, $oldStatus, $newStatus)
    {
        try {
            $customerName = $order->customer->name ?? $order->address->name ?? 'Guest';
            
            $statusLabels = [
                'pending' => 'Menunggu',
                'processing' => 'Diproses',
                'shipped' => 'Dikirim',
                'delivered' => 'Terkirim',
                'completed' => 'Selesai',
                'cancelled' => 'Dibatalkan',
            ];

            $newStatusLabel = $statusLabels[$newStatus] ?? $newStatus;

            return Notification::create([
                'type' => 'order_status_changed',
                'title' => 'Status Pesanan Berubah',
                'message' => "Pesanan {$order->order_number} berubah menjadi {$newStatusLabel}",
                'icon' => 'solar:refresh-circle-bold',
                'color' => $newStatus === 'cancelled' ? 'red' : 'green',
                'link' => "/cms/order/edit/{$order->id}",
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $customerName,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create order status changed notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create notification for payment received
     * 
     * @param Order $order
     * @return Notification|null
     */
    public static function paymentReceived($order)
    {
        try {
            $customerName = $order->customer->name ?? $order->address->name ?? 'Guest';
            
            return Notification::create([
                'type' => 'payment_received',
                'title' => 'Pembayaran Diterima',
                'message' => "Pembayaran untuk pesanan {$order->order_number} telah diterima",
                'icon' => 'solar:wallet-money-bold',
                'color' => 'green',
                'link' => "/cms/order/edit/{$order->id}",
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $customerName,
                    'amount' => $order->total_price,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create payment received notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create custom notification
     * 
     * @param string $type
     * @param string $title
     * @param string $message
     * @param string $icon - Iconify icon name (e.g., 'solar:bell-bold')
     * @param string $color - Color name (blue, green, red, amber, gray, purple)
     * @param string|null $link
     * @param array $data
     * @return Notification|null
     */
    public static function custom($type, $title, $message, $icon = 'solar:bell-bold', $color = 'blue', $link = null, $data = [])
    {
        try {
            return Notification::create([
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'icon' => $icon,
                'color' => $color,
                'link' => $link,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create custom notification: ' . $e->getMessage());
            return null;
        }
    }
}
