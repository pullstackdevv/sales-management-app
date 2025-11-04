<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\SalesChannel;
use App\Models\PaymentBank;
use App\Models\Courier;
use App\Models\OrderPayment;
use App\Models\Shipping;
use App\Enums\OrderStatus;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = Customer::all();
        $productVariants = ProductVariant::all();
        $salesChannels = SalesChannel::all();
        $paymentBanks = PaymentBank::all();
        $couriers = Courier::all();

        $orders = [
            [
                'customer_id' => $customers->random()->id,
                'address_id' => 1, // Will be set properly later
                'user_id' => 1,
                'order_number' => 'ORD-' . date('Ymd') . '-001',
                'ordered_at' => Carbon::now()->subDays(10),
                'status' => OrderStatus::SHIPPED,
                'total_price' => 0, // Will be calculated
                'shipping_cost' => 15000,
            ],
            [
                'customer_id' => $customers->random()->id,
                'address_id' => 1,
                'user_id' => 1,
                'order_number' => 'ORD-' . date('Ymd') . '-002',
                'ordered_at' => Carbon::now()->subDays(8),
                'status' => OrderStatus::PAID,
                'total_price' => 0,
                'shipping_cost' => 20000,
            ],
            [
                'customer_id' => $customers->random()->id,
                'address_id' => 1,
                'user_id' => 1,
                'order_number' => 'ORD-' . date('Ymd') . '-003',
                'ordered_at' => Carbon::now()->subDays(5),
                'status' => OrderStatus::SHIPPED,
                'total_price' => 0,
                'shipping_cost' => 25000,
            ],
            [
                'customer_id' => $customers->random()->id,
                'address_id' => 1,
                'user_id' => 1,
                'order_number' => 'ORD-' . date('Ymd') . '-004',
                'ordered_at' => Carbon::now()->subDays(3),
                'status' => OrderStatus::PENDING,
                'total_price' => 0,
                'shipping_cost' => 18000,
            ],
            [
                'customer_id' => $customers->random()->id,
                'address_id' => 1,
                'user_id' => 1,
                'order_number' => 'ORD-' . date('Ymd') . '-005',
                'ordered_at' => Carbon::now()->subDays(1),
                'status' => OrderStatus::PAID,
                'total_price' => 0,
                'shipping_cost' => 12000,
            ],
        ];

        foreach ($orders as $orderData) {
            // Set proper address_id for the customer
            $customer = Customer::find($orderData['customer_id']);
            $address = $customer->addresses()->first();
            $orderData['address_id'] = $address ? $address->id : 1;
            
            $order = Order::create($orderData);
            
            // Create order items
            $itemCount = rand(1, 4);
            $totalPrice = 0;
            
            for ($i = 0; $i < $itemCount; $i++) {
                $variant = $productVariants->random();
                $quantity = rand(1, 3);
                $price = $variant->price;
                $total = $price * $quantity;
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'product_name_snapshot' => $variant->product->name,
                    'variant_label' => $variant->variant_label,
                    'quantity' => $quantity,
                    'price' => $price,
                    'subtotal' => $total,
                ]);
                
                $totalPrice += $total;
            }
            
            // Update order total
            $order->update([
                'total_price' => $totalPrice + $order->shipping_cost,
            ]);
            
            // Create payment if order is not pending
            if ($order->status !== OrderStatus::PENDING) {
                OrderPayment::create([
                    'order_id' => $order->id,
                    'payment_bank_id' => $paymentBanks->random()->id,
                    'amount_paid' => $order->total_price,
                    'paid_at' => $order->ordered_at->addHours(rand(1, 24)),
                    'proof_image' => 'payment_proof_' . $order->id . '.jpg',
                    'verified_by' => 1,
                    'verified_at' => $order->ordered_at->addHours(rand(2, 25)),
                ]);
            }
            
            // Create shipping if order is shipped
            if ($order->status === OrderStatus::SHIPPED) {
                Shipping::create([
                    'order_id' => $order->id,
                    'courier_id' => $couriers->random()->id,
                    'tracking_number' => 'TRK' . rand(100000, 999999),
                    'shipped_at' => $order->ordered_at->addDays(rand(1, 3)),
                    'delivered_at' => $order->ordered_at->addDays(rand(2, 5)),
                ]);
            }
        }
    }
}