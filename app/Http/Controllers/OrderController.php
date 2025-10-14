<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\CourierRate;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\Shipping;
use App\Models\StockMovement;
use App\Enums\StockMovementType;
use App\Http\Requests\Order\StoreRequest;
use App\Http\Requests\Order\UpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with(['customer', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy', 'salesChannel'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->source, function ($query, $source) {
                if ($source === 'Manual') {
                    // Manual orders don't have payment_url
                    $query->whereNull('payment_url');
                } elseif ($source === 'Web Order') {
                    // Web orders have payment_url
                    $query->whereNotNull('payment_url');
                }
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $orders
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'address_id' => 'required|exists:customer_addresses,id',
            'sales_channel_id' => 'nullable|exists:sales_channels,id',
            'voucher_id' => 'nullable|exists:vouchers,id',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'shipping_cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:255',
            'status' => 'nullable|in:pending,paid,shipped,cancelled',
            'courier_id' => 'nullable|exists:couriers,id',
            'payment_bank_id' => 'nullable|exists:payment_banks,id',
            'payment_status' => 'nullable|in:pending,paid',
            'amount_paid' => 'nullable|numeric|min:0',
            'proof_image' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            // Generate order number
            $orderNumber = 'ORD-' . date('Ymd') . '-' . str_pad(Order::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);

            // Calculate subtotal
            $subtotal = collect($validated['items'])->sum(function ($item) {
                return $item['quantity'] * $item['price'];
            });

            // Calculate total before discount
            $totalBeforeDiscount = $subtotal + $validated['shipping_cost'];

            // Apply voucher discount if voucher_id is provided
            $discountAmount = 0;
            if (isset($validated['voucher_id'])) {
                $voucher = \App\Models\Voucher::find($validated['voucher_id']);
                
                Log::info('OrderController - Voucher validation', [
                    'voucher_id' => $validated['voucher_id'],
                    'voucher_found' => $voucher ? true : false,
                    'voucher_code' => $voucher ? $voucher->code : null,
                    'total_before_discount' => $totalBeforeDiscount,
                    'can_be_used' => $voucher ? $voucher->canBeUsed($totalBeforeDiscount) : false
                ]);
                
                if ($voucher && $voucher->canBeUsed($totalBeforeDiscount)) {
                    $discountAmount = $voucher->calculateDiscount($totalBeforeDiscount);
                    
                    Log::info('OrderController - Voucher discount calculated', [
                        'voucher_code' => $voucher->code,
                        'discount_amount' => $discountAmount,
                        'discount_type' => $voucher->type,
                        'discount_value' => $voucher->value
                    ]);
                }
            } else {
                Log::info('OrderController - No voucher_id provided in request');
            }

            // Calculate final total price after discount
            $totalPrice = $totalBeforeDiscount - $discountAmount;
            
            Log::info('OrderController - Order totals', [
                'subtotal' => $subtotal,
                'shipping_cost' => $validated['shipping_cost'],
                'total_before_discount' => $totalBeforeDiscount,
                'discount_amount' => $discountAmount,
                'final_total_price' => $totalPrice
            ]);

            // Create order
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $validated['customer_id'],
                'address_id' => $validated['address_id'],
                'user_id' => Auth::id(),
                'sales_channel_id' => $validated['sales_channel_id'] ?? null,
                'voucher_id' => $validated['voucher_id'] ?? null,
                'total_price' => $totalPrice,
                'discount_amount' => $discountAmount,
                'shipping_cost' => $validated['shipping_cost'],
                'status' => $validated['status'] ?? 'pending',
                'payment_status' => $validated['payment_status'] ?? 'pending',
                'ordered_at' => now()
            ]);

            // Create order items and update stock
            foreach ($validated['items'] as $item) {
                $variant = ProductVariant::findOrFail($item['product_variant_id']);

                if ($variant->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Stok tidak mencukupi untuk produk {$variant->product->name} - {$variant->variant_label}. Stok tersedia: {$variant->stock}, diminta: {$item['quantity']}"]
                    ]);
                }

                $order->items()->create([
                    'product_variant_id' => $item['product_variant_id'],
                    'product_name_snapshot' => $variant->product->name,
                    'variant_label' => $variant->variant_label,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'base_price' => $variant->product->base_price,
                    'subtotal' => $item['quantity'] * $item['price']
                ]);

                // Update stock
                $variant->decrement('stock', $item['quantity']);
                
                // Record stock movement
                $this->recordStockMovement(
                    $item['product_variant_id'],
                    StockMovementType::OUT,
                    $item['quantity'],
                    "Order #{$order->id} - {$order->customer->name}"
                );
            }

            // Create payment record if payment data is provided
            if (isset($validated['payment_bank_id']) && ($validated['payment_status'] ?? 'pending') === 'paid') {
                $order->payments()->create([
                    'payment_bank_id' => $validated['payment_bank_id'],
                    'amount_paid' => $validated['amount_paid'] ?? $totalPrice,
                    'paid_at' => now(),
                    'proof_image' => $validated['proof_image'] ?? '',
                    'verified_by' => null, // Will be set when admin verifies
                    'verified_at' => null
                ]);
                
                // Update order status and payment status when payment is made
                $order->update([
                    'status' => 'paid',
                    'payment_status' => 'paid'
                ]);
            } else {
                // Remove payment record if payment_bank_id is not provided or payment_status is not paid
                $order->payments()->delete();
                
                // Update order status back to pending if no payment
                $order->update([
                    'status' => 'pending',
                    'payment_status' => 'pending'
                ]);
            }

            // Create shipping record if courier is provided
            if (isset($validated['courier_id'])) {
                $order->shipping()->create([
                    'courier_id' => $validated['courier_id'],
                    'tracking_number' => '', // Will be filled when shipped
                    'shipped_at' => now()
                ]);
            }

            // Note: Voucher logic removed for manual orders
            // Vouchers are only handled in web orders with payment gateway

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order created successfully',
                'data' => $order->load(['customer', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy', 'salesChannel'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $order->load(['customer', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy', 'salesChannel'])
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'address_id' => 'sometimes|required|exists:customer_addresses,id',
            'sales_channel_id' => 'nullable|exists:sales_channels,id',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'shipping_cost' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:pending,paid,shipped,cancelled',
            'courier_id' => 'nullable|exists:couriers,id',
            'payment_bank_id' => 'nullable|exists:payment_banks,id',
            'payment_status' => 'nullable|in:pending,paid',
            'amount_paid' => 'nullable|numeric|min:0',
            'proof_image' => 'nullable|string'
        ]);

        // Batasi edit order berdasarkan status dan payment gateway
        if ($order->payments()->exists()) {
            // Jika order memiliki payment gateway, hanya izinkan update status ke shipped/delivered
            if (in_array($order->status, ['paid', 'pending', 'cancelled'])) {
                $allowedStatusUpdates = ['shipped', 'delivered'];
                if (isset($validated['status']) && !in_array($validated['status'], $allowedStatusUpdates)) {
                    throw ValidationException::withMessages([
                        'status' => ['Orders with payment gateway can only be updated to shipped or delivered status.']
                    ]);
                }
                // Hanya izinkan update status, tidak boleh edit field lain
                $validated = array_intersect_key($validated, array_flip(['status']));
            }
        }

        try {
            DB::beginTransaction();
            
            // Initialize subtotal variable
            $calculatedSubtotal = null;

            // Update address if provided
            if (isset($validated['address_id'])) {
                $order->update(['address_id' => $validated['address_id']]);
            }

            // Update sales channel if provided
            if (isset($validated['sales_channel_id'])) {
                $order->update(['sales_channel_id' => $validated['sales_channel_id']]);
            }

            // Update items if provided
            if (isset($validated['items'])) {
                // Delete existing items and restore stock
                foreach ($order->items as $item) {
                    $variant = $item->productVariant;
                    $variant->increment('stock', $item->quantity);
                    
                    // Record stock movement for item removal
                    $this->recordStockMovement(
                        $item->product_variant_id,
                        StockMovementType::IN,
                        $item->quantity,
                        "Order #{$order->id} items updated - Stock returned"
                    );
                    
                    $item->delete();
                }

                // Calculate new subtotal
                $subtotal = collect($validated['items'])->sum(function ($item) {
                    return $item['quantity'] * $item['price'];
                });

                // Create new items and update stock
                foreach ($validated['items'] as $item) {
                    $variant = ProductVariant::findOrFail($item['product_variant_id']);

                    if ($variant->stock < $item['quantity']) {
                        throw ValidationException::withMessages([
                            'items' => ["Stok tidak mencukupi untuk produk {$variant->product->name} - {$variant->variant_label}. Stok tersedia: {$variant->stock}, diminta: {$item['quantity']}"]
                        ]);
                    }

                    $order->items()->create([
                        'product_variant_id' => $item['product_variant_id'],
                        'product_name_snapshot' => $variant->product->name,
                        'variant_label' => $variant->variant_label,
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'base_price' => $variant->product->base_price,
                        'subtotal' => $item['quantity'] * $item['price']
                    ]);

                    // Update stock
                    $variant->decrement('stock', $item['quantity']);
                    
                    // Record stock movement
                    $this->recordStockMovement(
                        $item['product_variant_id'],
                        StockMovementType::OUT,
                        $item['quantity'],
                        "Order #{$order->id} updated - {$order->customer->name}"
                    );
                }

                // Store subtotal for later total calculation (as variable, not database field)
                $calculatedSubtotal = $subtotal;
            }

            // Update shipping cost if provided
            if (isset($validated['shipping_cost'])) {
                $order->shipping_cost = $validated['shipping_cost'];
            }
            
            // Calculate final total_price once at the end
            $finalSubtotal = $calculatedSubtotal ?? $order->items->sum(function($item) {
                return $item->quantity * $item->price;
            });
            
            $finalTotal = $finalSubtotal + $order->shipping_cost;
            
            $order->update([
                'total_price' => $finalTotal
            ]);

            // Update status if provided
            if (isset($validated['status'])) {
                $order->update(['status' => $validated['status']]);
            }

            // Update or create payment record if payment data is provided
            if (isset($validated['payment_bank_id']) && ($validated['payment_status'] ?? 'pending') === 'paid') {
                $order->payments()->updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'payment_bank_id' => $validated['payment_bank_id'],
                        'amount_paid' => $validated['amount_paid'] ?? $finalTotal,
                        'paid_at' => now(),
                        'proof_image' => $validated['proof_image'] ?? '',
                        'verified_by' => null,
                        'verified_at' => null
                    ]
                );
                
                // Update order status and payment status when payment is made
                $order->update([
                    'status' => 'paid',
                    'payment_status' => 'paid'
                ]);
            }

            // Update or create shipping record if courier is provided
            if (isset($validated['courier_id'])) {
                $order->shipping()->updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'courier_id' => $validated['courier_id'],
                        'tracking_number' => $order->shipping->tracking_number ?? '',
                        'shipped_at' => $order->shipping->shipped_at ?? now()
                    ]
                );
            }

            // Update timestamp
            $order->touch();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order updated successfully',
                'data' => $order->fresh()->load(['customer', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy', 'salesChannel'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Order $order): JsonResponse
    {
        if ($order->status !== 'pending') {
            throw ValidationException::withMessages([
                'order' => ['Can only delete pending orders.']
            ]);
        }

        try {
            DB::beginTransaction();

            // Restore stock
            foreach ($order->items as $item) {
                $variant = $item->productVariant;
                $variant->increment('stock', $item->quantity);
            }

            // Delete related records
            $order->items()->delete();
            $order->payments()->delete();
            if ($order->shipping) {
                $order->shipping->delete();
            }

            $order->update(['deleted_by' => Auth::id()]);
            $order->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,paid,shipped,delivered,cancelled'
        ]);

        if ($order->status === $validated['status']) {
            throw ValidationException::withMessages([
                'status' => ['Order is already in this status.']
            ]);
        }

        // Validasi: status cancelled hanya bisa diterapkan pada order manual input
        if ($validated['status'] === 'cancelled' && !is_null($order->payment_url)) {
            throw ValidationException::withMessages([
                'status' => ['Status dibatalkan hanya dapat diterapkan pada order manual input.']
            ]);
        }

        try {
            DB::beginTransaction();

            $order->update([
                'status' => $validated['status'],
                'updated_by' => Auth::id()
            ]);

            // If order is cancelled, restore stock
            if ($validated['status'] === 'cancelled') {
                foreach ($order->items as $item) {
                    $variant = $item->productVariant;
                    $variant->increment('stock', $item->quantity);
                    
                    // Record stock movement for cancellation
                    $this->recordStockMovement(
                        $item->product_variant_id,
                        StockMovementType::IN,
                        $item->quantity,
                        "Order #{$order->id} cancelled - Stock returned"
                    );
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order status updated successfully',
                'data' => $order->fresh()->load(['customer', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Record stock movement for order operations
     */
    private function recordStockMovement($productVariantId, $type, $quantity, $note)
    {
        StockMovement::create([
            'product_variant_id' => $productVariantId,
            'type' => $type,
            'quantity' => $quantity,
            'note' => $note,
            'created_by' => Auth::id()
        ]);
    }

    public function generateShippingLabel(Order $order): JsonResponse
    {
        if (!$order->shipping) {
            throw ValidationException::withMessages([
                'order' => ['Order has no shipping information.']
            ]);
        }

        // Load all necessary relationships for shipping label
        $order->load([
            'customer', 
            'address', 
            'shipping.courier', 
            'items.productVariant.product',
            'salesChannel',
            'voucher',
            'createdBy'
        ]);

        // Prepare detailed data for React printing
        $shippingLabelData = [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'total_price' => $order->total_price,
                'discount_amount' => $order->discount_amount,
                'shipping_cost' => $order->shipping_cost,
                'ordered_at' => $order->ordered_at->format('Y-m-d H:i:s'),
                'notes' => $order->notes ?? null
            ],
            'customer' => [
                'id' => $order->customer->id,
                'name' => $order->customer->name,
                'email' => $order->customer->email,
                'phone' => $order->customer->phone
            ],
            'shipping_address' => [
                'recipient_name' => $order->address->recipient_name,
                'phone' => $order->address->phone,
                'address_line_1' => $order->address->address_line_1,
                'address_line_2' => $order->address->address_line_2,
                'city' => $order->address->city,
                'state' => $order->address->state,
                'postal_code' => $order->address->postal_code,
                'country' => $order->address->country ?? 'Indonesia'
            ],
            'courier' => [
                'name' => $order->shipping->courier->name,
                'code' => $order->shipping->courier->code,
                'service_type' => $order->shipping->service_type ?? null,
                'tracking_number' => $order->shipping->tracking_number ?? null,
                'estimated_delivery' => $order->shipping->estimated_delivery ?? null
            ],
            'items' => $order->items->map(function ($item) {
                return [
                    'product_name' => $item->product_name_snapshot,
                    'variant_label' => $item->variant_label,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'subtotal' => $item->subtotal,
                    'sku' => $item->productVariant->sku ?? null,
                    'weight' => $item->productVariant->weight ?? null
                ];
            }),
            'sales_channel' => $order->salesChannel ? [
                'name' => $order->salesChannel->name,
                'code' => $order->salesChannel->code,
                'platform' => $order->salesChannel->platform
            ] : null,
            'voucher' => $order->voucher ? [
                'code' => $order->voucher->code,
                'name' => $order->voucher->name,
                'type' => $order->voucher->type,
                'value' => $order->voucher->value
            ] : null,
            'created_by' => [
                'name' => $order->createdBy->name,
                'email' => $order->createdBy->email
            ],
            'company_info' => [
                'name' => config('app.name', 'Sales Management App'),
                'address' => 'Alamat Perusahaan', // Bisa diambil dari config atau database
                'phone' => '+62 xxx-xxxx-xxxx',
                'email' => 'info@company.com'
            ],
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'barcode_data' => $order->order_number // Data untuk generate barcode di frontend
        ];

        return response()->json([
            'status' => 'success',
            'message' => 'Shipping label data retrieved successfully',
            'data' => $shippingLabelData
        ]);
    }

    public function printInvoice(Order $order)
    {
        $order->load(['customer', 'customer.address', 'items.productVariant.product', 'payments', 'shipping.courier']);
        
        $pdf = PDF::loadView('orders.invoice', [
            'order' => $order,
            'date' => Carbon::now()->format('d/m/Y H:i:s')
        ]);

        return $pdf->stream("invoice-{$order->id}.pdf");
    }

    public function printLabel(Order $order)
    {
        $order->load(['customer', 'customer.address', 'items.productVariant.product', 'shipping.courier']);
        
        $pdf = PDF::loadView('orders.shipping-label', [
            'order' => $order,
            'date' => Carbon::now()->format('d/m/Y H:i:s')
        ]);

        return $pdf->stream("shipping-label-{$order->id}.pdf");
    }

    public function calculateShipping(Request $request)
    {
        $request->validate([
            'courier_id' => 'required|exists:couriers,id',
            'origin_city' => 'required|string',
            'destination_city' => 'required|string',
            'items' => 'required|array',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1'
        ]);

        $courierRate = CourierRate::where('courier_id', $request->courier_id)
            ->where('origin_city', $request->origin_city)
            ->where('destination_city', $request->destination_city)
            ->first();

        if (!$courierRate) {
            return response()->json([
                'status' => 'error',
                'message' => 'Shipping rate not found for the selected route'
            ], 404);
        }

        // Calculate total weight from order items
        $totalWeight = 0;
        foreach ($request->items as $item) {
            $variant = ProductVariant::find($item['product_variant_id']);
            if ($variant && $variant->weight) {
                $totalWeight += $variant->weight * $item['quantity'];
            }
        }

        // Ensure minimum weight
        $totalWeight = max($totalWeight, $courierRate->min_weight ?? 0);
        
        // Check maximum weight limit
        if ($courierRate->max_weight && $totalWeight > $courierRate->max_weight) {
            return response()->json([
                'status' => 'error',
                'message' => 'Total weight exceeds maximum limit for this courier service'
            ], 400);
        }

        // Calculate shipping cost
        $shippingCost = $courierRate->base_price + ($totalWeight * $courierRate->price_per_kg);

        return response()->json([
            'status' => 'success',
            'data' => [
                'rate' => $shippingCost,
                'base_price' => $courierRate->base_price,
                'price_per_kg' => $courierRate->price_per_kg,
                'total_weight' => $totalWeight,
                'estimated_days' => $courierRate->estimated_days
            ]
        ]);
    }

    /**
     * Update shipping information for an order
     */
    public function updateShipping(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'courier_id' => 'required|exists:couriers,id',
            'tracking_number' => 'required|string|max:100'
        ]);

        // Check if order already has shipping record
        if ($order->shipping) {
            // Update existing shipping record
            $order->shipping->update([
                'courier_id' => $request->courier_id,
                'tracking_number' => $request->tracking_number,
                'shipped_at' => now()
            ]);
            $shipping = $order->shipping;
        } else {
            // Create new shipping record
            $shipping = $order->shipping()->create([
                'courier_id' => $request->courier_id,
                'tracking_number' => $request->tracking_number,
                'shipped_at' => now()
            ]);
        }

        // Load courier relationship for response
        $shipping->load('courier');

        // Update order status to shipped if not already
        if ($order->status !== 'shipped' && $order->status !== 'delivered') {
            $order->update(['status' => 'shipped']);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Shipping information updated successfully',
            'data' => [
                'shipping' => [
                    'id' => $shipping->id,
                    'courier_id' => $shipping->courier_id,
                    'courier' => [
                        'id' => $shipping->courier->id,
                        'name' => $shipping->courier->name
                    ],
                    'tracking_number' => $shipping->tracking_number,
                    'shipped_at' => $shipping->shipped_at->toISOString()
                ],
                'order' => [
                    'id' => $order->id,
                    'status' => $order->status
                ]
            ]
        ]);
    }

    /**
     * Get audit history for an order.
     */
    public function auditHistory(Order $order): JsonResponse
    {
        try {
            $auditHistory = $order->getAuditHistory();

            return response()->json([
                'status' => 'success',
                'data' => $auditHistory
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve audit history: ' . $e->getMessage()
            ], 500);
        }
    }
}