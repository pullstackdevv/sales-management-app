<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    const TYPE_NEW_ORDER = 'new_order';
    const TYPE_LOW_STOCK = 'low_stock';
    const TYPE_ORDER_EXPIRED = 'order_expired';
    const TYPE_ORDER_STATUS_CHANGED = 'order_status_changed';
    const TYPE_PAYMENT_RECEIVED = 'payment_received';

    protected $fillable = [
        'type',
        'title',
        'message',
        'icon',
        'color',
        'link',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    // Relationships
    public function reads()
    {
        return $this->hasMany(NotificationRead::class);
    }

    /**
     * Check if notification is read by a specific user
     */
    public function isReadBy($userId)
    {
        return $this->reads()->where('user_id', $userId)->exists();
    }

    /**
     * Create a new order notification
     */
    public static function createNewOrder($order)
    {
        $customerName = $order->customer->name ?? $order->address->name ?? 'Guest';
        
        return self::create([
            'type' => self::TYPE_NEW_ORDER,
            'title' => 'Pesanan Baru',
            'message' => "{$customerName} memesan produk",
            'icon' => 'solar:cart-check-bold',
            'color' => 'blue',
            'link' => "/cms/order/edit/{$order->id}",
            'data' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $customerName,
            ],
        ]);
    }

    /**
     * Create a low stock notification
     */
    public static function createLowStock($productVariant, $product)
    {
        // Check if notification already exists for this variant
        $existing = self::where('type', self::TYPE_LOW_STOCK)
            ->whereJsonContains('data->product_variant_id', $productVariant->id)
            ->where('created_at', '>=', now()->subHours(24))
            ->first();

        if ($existing) {
            return $existing;
        }

        return self::create([
            'type' => self::TYPE_LOW_STOCK,
            'title' => 'Stok Rendah',
            'message' => "Stok {$product->name} ({$productVariant->variant_label}) tersisa {$productVariant->stock}",
            'icon' => 'solar:box-minimalistic-bold',
            'color' => $productVariant->stock === 0 ? 'red' : 'amber',
            'link' => "/cms/product/edit/{$product->id}",
            'data' => [
                'product_id' => $product->id,
                'product_variant_id' => $productVariant->id,
                'product_name' => $product->name,
                'variant_label' => $productVariant->variant_label,
                'stock' => $productVariant->stock,
            ],
        ]);
    }

    /**
     * Create an order expired notification
     */
    public static function createOrderExpired($order)
    {
        $customerName = $order->customer->name ?? $order->address->name ?? 'Guest';
        
        return self::create([
            'type' => self::TYPE_ORDER_EXPIRED,
            'title' => 'Transaksi Expired',
            'message' => "Transaksi {$order->order_number} expired karena tidak ada pembayaran",
            'icon' => 'solar:clock-circle-bold',
            'color' => 'gray',
            'link' => "/cms/order/edit/{$order->id}",
            'data' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $customerName,
            ],
        ]);
    }
}
