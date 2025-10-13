<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Helpers\ResponseFormatter;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Midtrans\Snap;

class WebOrderController extends Controller
{
    /**
     * Create order from web (supports both logged in users and guests)
     */
    public function createOrder(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'items' => 'required|array|min:1',
                'items.*.product_variant_id' => 'required|exists:product_variants,id',
                'items.*.quantity' => 'required|integer|min:1',
                'shipping_cost' => 'required|numeric|min:0',
                'voucher_id' => 'nullable|exists:vouchers,id',
                'notes' => 'nullable|string|max:1000',
                
                // Guest checkout fields (required if user not logged in)
                'guest_email' => 'required_without:user_id|email',
                'guest_phone' => 'required_without:user_id|string|max:20',
                'guest_name' => 'required_without:user_id|string|max:255',
                
                // Address fields
                'address_id' => 'nullable|exists:customer_addresses,id',
                'address_name' => 'required_without:address_id|string|max:255',
                'address_phone' => 'required_without:address_id|string|max:20',
                'address_street' => 'required_without:address_id|string',
                'address_city' => 'required_without:address_id|string|max:100',
                'address_province' => 'required_without:address_id|string|max:100',
                'address_postal_code' => 'required_without:address_id|string|max:10',
            ]);

            if ($validator->fails()) {
                return ResponseFormatter::error(
                    'Validation Error',
                    $validator->errors(),
                    422
                );
            }

            DB::beginTransaction();

            $user = Auth::user();
            $isGuest = !$user;
            
            // Handle customer and address
            $customerId = null;
            $addressId = null;
            
            if (!$isGuest) {
                // Logged in user
                $customerId = $user->customer?->id;
                
                if ($request->address_id) {
                    $addressId = $request->address_id;
                } else {
                    // Create new address for logged in user
                    $address = CustomerAddress::create([
                        'customer_id' => $customerId,
                        'name' => $request->address_name,
                        'phone' => $request->address_phone,
                        'street' => $request->address_street,
                        'city' => $request->address_city,
                        'province' => $request->address_province,
                        'postal_code' => $request->address_postal_code,
                    ]);
                    $addressId = $address->id;
                }
            } else {
                // Guest checkout - create customer if not exists
                $customer = Customer::firstOrCreate(
                    ['email' => $request->guest_email],
                    [
                        'name' => $request->guest_name,
                        'phone' => $request->guest_phone,
                        'email' => $request->guest_email,
                    ]
                );
                $customerId = $customer->id;
                
                // Create address for guest
                $address = CustomerAddress::create([
                    'customer_id' => $customerId,
                    'name' => $request->guest_name,
                    'phone' => $request->guest_phone,
                    'street' => $request->address_street,
                    'city' => $request->address_city,
                    'province' => $request->address_province,
                    'postal_code' => $request->address_postal_code,
                ]);
                $addressId = $address->id;
            }

            // Calculate total price
            $totalPrice = 0;
            $orderItems = [];
            
            foreach ($request->items as $item) {
                $variant = ProductVariant::findOrFail($item['product_variant_id']);
                $price = $variant->price;
                $productName = $variant->product->name . ' - ' . $variant->variant_label;
                
                // Check stock availability
                if ($variant->stock < $item['quantity']) {
                    return ResponseFormatter::error(
                        'Stok tidak mencukupi untuk produk: ' . $variant->product->name,
                        [],
                        400
                    );
                }
                
                $subtotal = $price * $item['quantity'];
                $totalPrice += $subtotal;
                
                $orderItems[] = [
                    'product_variant_id' => $item['product_variant_id'],
                    'product_name_snapshot' => $productName,
                    'variant_label' => $variant->variant_label,
                    'quantity' => $item['quantity'],
                    'price' => $price,
                    'base_price' => $variant->product->base_price,
                    'total_price' => $subtotal,
                ];
            }
            
            // Add shipping cost
            $totalPrice += $request->shipping_cost;
            
            // Apply voucher discount if any
            $discountAmount = 0;
            $voucher = null;
            if ($request->voucher_id) {
                $voucher = Voucher::findOrFail($request->voucher_id);
                
                // Validate voucher can be used
                if (!$voucher->canBeUsed($totalPrice)) {
                    return ResponseFormatter::error(
                        'Voucher tidak dapat digunakan untuk pesanan ini',
                        [
                            'voucher_code' => $voucher->code,
                            'minimum_amount' => $voucher->minimum_amount,
                            'current_amount' => $totalPrice,
                            'is_valid' => $voucher->isValid()
                        ],
                        422
                    );
                }
                
                $discountAmount = $voucher->calculateDiscount($totalPrice);
                $totalPrice -= $discountAmount;
            }

            // Create order
            $order = Order::create([
                'order_number' => 'WEB-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                'customer_id' => $customerId,
                'address_id' => $addressId,
                'user_id' => $isGuest ? null : $user->id,
                'total_price' => $totalPrice,
                'discount_amount' => $discountAmount,
                'shipping_cost' => $request->shipping_cost,
                'status' => 'pending',
                'ordered_at' => now(),
                'voucher_id' => $request->voucher_id,
                'guest_email' => $isGuest ? $request->guest_email : null,
                'guest_phone' => $isGuest ? $request->guest_phone : null,
                'notes' => $request->notes,
                'payment_status' => PaymentStatus::PENDING,
            ]);

            // Create order items and update stock
            foreach ($orderItems as $item) {
                OrderItem::create(array_merge($item, ['order_id' => $order->id]));
                
                // Update stock
                $variant = ProductVariant::findOrFail($item['product_variant_id']);
                $variant->decrement('stock', $item['quantity']);
            }

            // Note: Voucher used_count will be updated when payment is confirmed
            // This prevents counting vouchers for unpaid orders

            DB::commit();

            return ResponseFormatter::success(
                'Order created successfully',
                $order->load(['items.productVariant.product', 'customer', 'address'])
            );

        } catch (\Exception $e) {
            DB::rollBack();
            return ResponseFormatter::error(
                'Gagal membuat order: ' . $e->getMessage(),
                [],
                500
            );
        }
    }

    /**
     * Get order details
     */
    public function getOrder(Request $request, $orderNumber)
    {
        try {
            $order = Order::where('order_number', $orderNumber)
                ->with(['items.productVariant.product', 'customer', 'address'])
                ->first();

            if (!$order) {
                return ResponseFormatter::error(
                    'Order not found',
                    [],
                    404
                );
            }

            // Check if user has access to this order
            $user = Auth::user();
            if ($user) {
                // Logged in user can only see their own orders
                if ($order->user_id !== $user->id) {
                    return ResponseFormatter::error(
                        'Unauthorized',
                        [],
                        403
                    );
                }
            } else {
                // Guest can access order with email verification
                $validator = Validator::make($request->all(), [
                    'email' => 'required|email'
                ]);

                if ($validator->fails() || $order->guest_email !== $request->email) {
                    return ResponseFormatter::error(
                        'Unauthorized',
                        [],
                        403
                    );
                }
            }

            return ResponseFormatter::success(
                'Order retrieved successfully',
                $order
            );

        } catch (\Exception $e) {
            return ResponseFormatter::error(
                'Failed to get order',
                [],
                500
            );
        }
    }

    /**
     * Get user orders (for logged in users)
     */
    public function getUserOrders(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return ResponseFormatter::error(
                    'Unauthorized',
                    [],
                    401
                );
            }

            $orders = Order::where('user_id', $user->id)
                ->with(['items.productVariant.product'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            return ResponseFormatter::success(
                'Orders retrieved successfully',
                $orders
            );

        } catch (\Exception $e) {
            return ResponseFormatter::error(
                'Failed to get orders',
                [],
                500
            );
        }
    }

    /**
     * Create payment for order with selected gateway
     */
    public function createPayment(Request $request, $orderNumber)
    {
        try {
            $validator = Validator::make($request->all(), [
                'payment_gateway' => 'required|in:midtrans,xendit',
            ]);

            if ($validator->fails()) {
                return ResponseFormatter::error(
                    'Validation Error',
                    $validator->errors(),
                    422
                );
            }

            $order = Order::where('order_number', $orderNumber)
                ->with(['customer', 'address', 'items.productVariant.product'])
                ->first();

            if (!$order) {
                return ResponseFormatter::error(
                    'Order not found',
                    [],
                    404
                );
            }

            if ($order->isPaid()) {
                return ResponseFormatter::error(
                    'Order already paid',
                    [],
                    400
                );
            }

            // Route to appropriate payment gateway
            $paymentGateway = $request->payment_gateway;
            
            if ($paymentGateway === 'midtrans') {
                $midtransController = new MidtransController();
                return $midtransController->createPayment($request, $orderNumber);
            } elseif ($paymentGateway === 'xendit') {
                $xenditController = new XenditController();
                return $xenditController->createPayment($request, $orderNumber);
            }

            return ResponseFormatter::error(
                'Invalid payment gateway',
                [],
                400
            );

        } catch (\Exception $e) {
            return ResponseFormatter::error(
                'Failed to create payment: ' . $e->getMessage(),
                [],
                500
            );
        }
    }

    /**
     * Check payment status for order
     */
    public function checkPaymentStatus(Request $request, $orderNumber)
    {
        try {
            $order = Order::where('order_number', $orderNumber)->first();

            if (!$order) {
                return ResponseFormatter::error(
                    'Order not found',
                    [],
                    404
                );
            }

            // Determine which gateway was used based on payment_token or payment_url
            if ($order->payment_token && strpos($order->payment_url, 'midtrans') !== false) {
                $midtransController = new MidtransController();
                return $midtransController->checkPaymentStatus($request, $orderNumber);
            } elseif ($order->payment_token && strpos($order->payment_url, 'xendit') !== false) {
                $xenditController = new XenditController();
                return $xenditController->checkPaymentStatus($request, $orderNumber);
            }

            return ResponseFormatter::success(
                'Payment status retrieved',
                [
                    'order_number' => $order->order_number,
                    'payment_status' => $order->payment_status,
                    'order_status' => $order->status,
                ]
            );

        } catch (\Exception $e) {
            return ResponseFormatter::error(
                'Failed to check payment status: ' . $e->getMessage(),
                [],
                500
            );
        }
    }

    /**
     * Update voucher used count when payment is confirmed
     * This method should be called from payment gateway webhooks
     */
    public static function updateVoucherUsedCount($orderId)
    {
        try {
            $order = Order::with('voucher')->find($orderId);
            
            if ($order && $order->voucher && $order->isPaid()) {
                $order->voucher->increment('used_count');
                return true;
            }
            
            return false;
        } catch (\Exception $e) {
            \Log::error('Failed to update voucher used count: ' . $e->getMessage());
            return false;
        }
    }
}
