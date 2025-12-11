<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Helpers\ResponseFormatter;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\StockMovement;
use App\Enums\StockMovementType;
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
            // Normalize types for validation
            $input = $request->all();
            if (array_key_exists('address_phone', $input) && $input['address_phone'] !== null) {
                $input['address_phone'] = (string) $input['address_phone'];
            }
            if (array_key_exists('guest_phone', $input) && $input['guest_phone'] !== null) {
                $input['guest_phone'] = (string) $input['guest_phone'];
            }
            if (array_key_exists('address_name', $input) && $input['address_name'] !== null) {
                $input['address_name'] = (string) $input['address_name'];
            }
            if (array_key_exists('address_postal_code', $input)) {
                $input['address_postal_code'] = $input['address_postal_code'] === null ? null : (string) $input['address_postal_code'];
            }

            // Validate request
            $validator = Validator::make($input, [
                'items' => 'required|array|min:1',
                'items.*.product_variant_id' => 'required|exists:product_variants,id',
                'items.*.quantity' => 'required|integer|min:1',
                'shipping_cost' => 'required|numeric|min:0',
                'voucher_id' => 'nullable|exists:vouchers,id',
                'notes' => 'nullable|string|max:1000',
                'customer_id' => 'nullable|exists:customers,id',
                'is_dropship' => 'nullable|boolean',
                // Optional shipping info from checkout
                'courier_id' => 'nullable|exists:couriers,id',
                'courier_rate_id' => 'nullable|exists:courier_rates,id',
                'service_type' => 'nullable|string|max:50',
                
                // Guest checkout fields (email optional; phone required and used to reuse/create customer)
                'guest_email' => 'nullable|email',
                'guest_phone' => 'required_without:user_id|string|max:20',
                'guest_name' => 'required_without:user_id|string|max:255',
                
                // Address fields
                'address_id' => 'nullable|exists:customer_addresses,id',
                'address_name' => 'required_without:address_id|string|max:255',
                'address_phone' => 'required_without:address_id|string|string|max:20',
                'address_street' => 'required_without:address_id|string',
                'address_city' => 'required_without:address_id|string|max:100',
                'address_province' => 'required_without:address_id|string|max:100',
                'address_postal_code' => 'nullable|string|regex:/^\d{5}$/',
            ]);

            if ($validator->fails()) {
                return ResponseFormatter::error(
                    'Validation Error',
                    $validator->errors(),
                    422
                );
            }

            // Merge normalized input back into request for downstream usage
            $request->merge($input);

            DB::beginTransaction();

            $user = Auth::user();
            $isGuest = !$user;
            
            // Handle customer and address
            $customerId = $request->customer_id;
            $addressId = null;
            
            if (!$isGuest) {
                // Logged in user
                $customerId = $customerId ?: ($user->customer?->id);

                // If the logged-in user does not have a linked customer, create one using guest payload
                if (!$customerId) {
                    $email = $request->guest_email ?? ($user->email ?? null);
                    $name = $request->guest_name ?? ($user->name ?? 'Web Customer');
                    $phone = $request->guest_phone ?? ($user->phone ?? '');

                    // Ensure email is not null to satisfy unique constraint; fallback to synthesized email if needed
                    if (!$email) {
                        $email = strtolower(Str::slug($name, '.')) . '@guest.local';
                    }

                    $customer = Customer::firstOrCreate(
                        ['email' => $email],
                        [
                            'name' => $name,
                            'phone' => $phone,
                            'email' => $email,
                        ]
                    );
                    $customerId = $customer->id;
                }
                
                if ($request->address_id) {
                    // Use provided address_id directly (dropship uses selected address)
                    $addressId = $request->address_id;
                } else {
                    // Create new address for logged in user (map to CustomerAddress fields)
                    $address = CustomerAddress::create([
                        'customer_id' => $customerId,
                        'label' => $request->address_label ?? 'Alamat Web Order',
                        'recipient_name' => $request->address_name,
                        'phone' => $request->address_phone,
                        'address_detail' => $request->address_street,
                        'city' => $request->address_city,
                        'province' => $request->address_province,
                        'district' => $request->address_district ?? '',
                        'postal_code' => $request->address_postal_code,
                        'is_default' => false,
                    ]);
                    $addressId = $address->id;
                }
            } else {
                // Guest checkout - create or reuse customer
                if ($customerId) {
                    $customer = Customer::find($customerId);
                    if (!$customer) {
                        return ResponseFormatter::error('Customer tidak ditemukan', [], 422);
                    }
                } else {
                    $customer = Customer::firstOrCreate(
                        ['phone' => $request->guest_phone],
                        [
                            'name' => $request->guest_name,
                            'phone' => $request->guest_phone,
                            'email' => $request->guest_email,
                        ]
                    );
                    $customerId = $customer->id;
                }

                if ($request->address_id) {
                    // Use provided address_id directly (avoid creating duplicate address)
                    $addressId = $request->address_id;
                } else {
                    // Create address for guest (map to CustomerAddress fields)
                    $address = CustomerAddress::create([
                        'customer_id' => $customerId,
                        'label' => $request->address_label ?? 'Alamat Web Order',
                        'recipient_name' => $request->address_name,
                        'phone' => $request->address_phone,
                        'address_detail' => $request->address_street,
                        'city' => $request->address_city,
                        'province' => $request->address_province,
                        'district' => $request->address_district ?? '',
                        'postal_code' => $request->address_postal_code,
                        'is_default' => false,
                    ]);
                    $addressId = $address->id;
                }
            }

            // Calculate total price
            $totalPrice = 0;
            $orderItems = [];
            
            foreach ($request->items as $item) {
                $variant = ProductVariant::findOrFail($item['product_variant_id']);
                // Use discount_price if available, otherwise use regular price
                $price = $variant->discount_price ?? $variant->price;
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
                    'base_price' => $variant->base_price,
                    'subtotal' => $subtotal,
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
                
                // Calculate discount with shipping cost for shipping vouchers
                $discountAmount = $voucher->calculateDiscount($totalPrice, $request->shipping_cost);
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
                'is_dropship' => (bool) ($request->is_dropship ?? false),
            ]);

            // If courier info provided, create shipping record in pending state
            if ($request->courier_id) {
                $order->shipping()->create([
                    'courier_id' => $request->courier_id,
                    'courier_rate_id' => $request->courier_rate_id,
                    'service_type' => $request->service_type,
                    'status' => 'pending',
                    'tracking_number' => '',
                    'weight' => $order->items->sum(function($i){ return ($i->productVariant->weight ?? 0) * $i->quantity; }),
                    'notes' => 'Marketplace checkout',
                    'created_by' => $isGuest ? null : $user->id,
                    'shipped_at' => now()
                ]);
            }

            // Create order items and update stock
            foreach ($orderItems as $item) {
                OrderItem::create(array_merge($item, ['order_id' => $order->id]));
                
                // Update stock
                $variant = ProductVariant::findOrFail($item['product_variant_id']);
                $variant->decrement('stock', $item['quantity']);

                // Record stock movement (OUT) for marketplace/web order
                StockMovement::create([
                    'product_variant_id' => $item['product_variant_id'],
                    'order_id' => $order->id,
                    'type' => StockMovementType::OUT,
                    'quantity' => $item['quantity'],
                    'note' => "Order #{$order->order_number} - Web Order",
                    'created_by' => $variant->created_by
                ]);
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
     * Get user orders (based on session customer data)
     */
    public function getUserOrders(Request $request)
    {
        try {
            // Get customer data from session
            $sessionCustomer = $request->session()->get('checkout.customer');
            
            // If no session data, show form to collect customer data
            if (!$sessionCustomer || (!isset($sessionCustomer['phone']) && !isset($sessionCustomer['email']))) {
                if (!$request->expectsJson() && !$request->wantsJson()) {
                    return inertia('Marketplace/MyOrders', [
                        'orders' => [
                            'data' => [],
                            'current_page' => 1,
                            'last_page' => 1,
                            'total' => 0
                        ],
                        'needsCustomerData' => true
                    ]);
                }
                
                return ResponseFormatter::error(
                    'Customer data required',
                    [],
                    400
                );
            }

            // Build query to find orders by customer phone or email
            $query = Order::with(['items.productVariant.product']);
            
            if (isset($sessionCustomer['phone']) && $sessionCustomer['phone']) {
                $query->where('customer_phone', $sessionCustomer['phone']);
            } elseif (isset($sessionCustomer['email']) && $sessionCustomer['email']) {
                $query->where('customer_email', $sessionCustomer['email']);
            }

            // Apply filters
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('search') && $request->search) {
                $query->where('order_number', 'like', '%' . $request->search . '%');
            }

            $orders = $query->orderBy('created_at', 'desc')->paginate(10);

            // Return Inertia page for browser requests
            if (!$request->expectsJson() && !$request->wantsJson()) {
                return inertia('Marketplace/MyOrders', [
                    'orders' => $orders,
                    'needsCustomerData' => false
                ]);
            }

            // Return JSON for AJAX/API requests
            return ResponseFormatter::success(
                'Orders retrieved successfully',
                $orders
            );

        } catch (\Exception $e) {
            \Log::error('Error getting user orders: ' . $e->getMessage());
            
            if ($request->expectsJson() || $request->wantsJson()) {
                return ResponseFormatter::error(
                    'Failed to get orders',
                    [],
                    500
                );
            }
            return redirect()->route('marketplace.home')->with('error', 'Failed to load orders');
        }
    }

    /**
     * Create payment for order with selected gateway
     */
    public function createPayment(Request $request, $orderNumber)
    {
        try {
            // Use unified PaymentController instead of individual gateway controllers
            $paymentController = new PaymentController();
            return $paymentController->createPayment($request, $orderNumber);

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
            // Use unified PaymentController instead of individual gateway controllers
            $paymentController = new PaymentController();
            return $paymentController->checkPaymentStatus($orderNumber);

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

    /**
     * Show track orders page (public)
     */
    public function trackOrdersPage()
    {
        return inertia('Marketplace/TrackOrders');
    }

    /**
     * Search orders by order number, email, or phone (public)
     */
    public function searchTrackOrders(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'search_query' => 'required|string|min:3',
                'status' => 'nullable|in:pending,paid,processing,shipped,delivered,cancelled',
            ]);

            if ($validator->fails()) {
                return ResponseFormatter::error(
                    'Validation Error',
                    $validator->errors(),
                    422
                );
            }

            $queryTerm = $request->search_query;

            // Search by order number, email (guest or customer), or phone (guest or customer)
            $ordersQuery = Order::with([
                    'items.productVariant.product',
                    'address',
                    'shipping.courier',
                    'payments.paymentBank',
                    'voucher',
                    'createdBy'
                ])
                ->where(function($q) use ($queryTerm) {
                    $q->where('order_number', 'like', "%{$queryTerm}%")
                      ->orWhere('guest_email', 'like', "%{$queryTerm}%")
                      ->orWhere('guest_phone', 'like', "%{$queryTerm}%")
                      ->orWhereHas('customer', function($cq) use ($queryTerm) {
                          $cq->where('email', 'like', "%{$queryTerm}%")
                             ->orWhere('phone', 'like', "%{$queryTerm}%");
                      });
                });

            if ($request->filled('status')) {
                $ordersQuery->where('status', $request->status);
            }

            $orders = $ordersQuery->orderBy('created_at', 'desc')->paginate(10);

            return ResponseFormatter::success(
                'Orders found',
                $orders
            );

        } catch (\Exception $e) {
            return ResponseFormatter::error(
                'Failed to search orders',
                [],
                500
            );
        }
    }
}
