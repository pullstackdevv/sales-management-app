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
use App\Enums\PaymentStatus;
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
        if (!Auth::user()->hasPermission('orders.view')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to view orders.'
            ], 403);
        }
        $orders = Order::with(['customer', 'address', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy', 'salesChannel'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        })
                        ->orWhereHas('items', function ($q) use ($search) {
                            $q->where('product_name_snapshot', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->printed, function ($query, $printed) {
                // Filter only orders that have been printed
                if ($printed) {
                    $query->whereNotNull('printed_at');
                }
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
            ->when($request->start_date || $request->end_date, function ($query) use ($request) {
                try {
                    $start = $request->start_date ? \Carbon\Carbon::parse($request->start_date)->startOfDay() : null;
                    $end = $request->end_date ? \Carbon\Carbon::parse($request->end_date)->endOfDay() : null;

                    if ($start && $end) {
                        $query->where(function ($q) use ($start, $end) {
                            $q->whereBetween('ordered_at', [$start, $end])
                              ->orWhere(function ($qq) use ($start, $end) {
                                  $qq->whereNull('ordered_at')
                                     ->whereBetween('created_at', [$start, $end]);
                              });
                        });
                    } elseif ($start) {
                        $query->where(function ($q) use ($start) {
                            $q->where('ordered_at', '>=', $start)
                              ->orWhere(function ($qq) use ($start) {
                                  $qq->whereNull('ordered_at')
                                     ->where('created_at', '>=', $start);
                              });
                        });
                    } elseif ($end) {
                        $query->where(function ($q) use ($end) {
                            $q->where('ordered_at', '<=', $end)
                              ->orWhere(function ($qq) use ($end) {
                                  $qq->whereNull('ordered_at')
                                     ->where('created_at', '<=', $end);
                              });
                        });
                    }
                } catch (\Exception $e) {
                    // Ignore invalid date formats and skip filtering
                }
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        // Add formatted WIB date field for frontend display
        $orders->getCollection()->transform(function ($order) {
            // Prefer ordered_at if available, fallback to created_at
            $timestamp = $order->ordered_at ?? $order->created_at;

            if ($timestamp) {
                // Use Indonesian locale and Asia/Jakarta timezone
                $formatted = $timestamp
                    ->timezone('Asia/Jakarta')
                    ->locale('id')
                    ->translatedFormat('l, d M Y, H.i');

                $order->date = $formatted . ' WIB';
            } else {
                $order->date = null;
            }

            return $order;
        });

        return response()->json([
            'status' => 'success',
            'data' => $orders
        ]);
    }

    /**
     * Get order histories for a specific customer.
     */
    public function histories(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'search' => 'nullable|string',
            'status' => 'nullable|string',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $orders = Order::with([
                'customer',
                'address',
                'shipping.courier',
                'items.productVariant.product',
                'payments.paymentBank',
                'voucher',
                'createdBy',
                'salesChannel'
            ])
            ->where('customer_id', $validated['customer_id'])
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('items', function ($q) use ($search) {
                            $q->where('product_name_snapshot', 'like', "%{$search}%");
                        });
                });
            })
            ->when($validated['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // Check permission
        if (!Auth::user()->hasPermission('orders.create')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to create orders.'
            ], 403);
        }

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
            'status' => 'nullable|in:pending,processing,paid,shipped,delivered,cancelled',
            'courier_id' => 'nullable|exists:couriers,id',
            'courier_rate_id' => 'nullable|exists:courier_rates,id',
            'service_type' => 'nullable|string|max:100',
            'payment_bank_id' => 'nullable|exists:payment_banks,id',
            'payment_status' => 'nullable|in:pending,paid',
            'amount_paid' => 'nullable|numeric|min:0',
            'proof_image' => 'nullable|string',
            'is_dropship' => 'nullable|boolean'
        ]);

        try {
            DB::beginTransaction();

            // Generate order number
            $orderNumber = 'ORD-' . date('Ymd') . '-' . str_pad(Order::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);

            // Calculate subtotal with discount_price if available
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $variant = ProductVariant::findOrFail($item['product_variant_id']);
                // Use discount_price if available, otherwise use provided price
                $price = $variant->discount_price ?? $item['price'];
                $subtotal += $item['quantity'] * $price;
            }

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
                    'voucher_type' => $voucher ? $voucher->type : null,
                    'total_before_discount' => $totalBeforeDiscount,
                    'shipping_cost' => $validated['shipping_cost'],
                    'can_be_used' => $voucher ? $voucher->canBeUsed($totalBeforeDiscount) : false
                ]);
                
                if ($voucher && $voucher->canBeUsed($totalBeforeDiscount)) {
                    // Pass shipping_cost to calculateDiscount for shipping vouchers
                    $discountAmount = $voucher->calculateDiscount($totalBeforeDiscount, $validated['shipping_cost']);
                    
                    Log::info('OrderController - Voucher discount calculated', [
                        'voucher_code' => $voucher->code,
                        'voucher_type' => $voucher->type,
                        'discount_amount' => $discountAmount,
                        'discount_type' => $voucher->type,
                        'discount_value' => $voucher->value,
                        'shipping_cost' => $validated['shipping_cost']
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
                'ordered_at' => now(),
                'notes' => $validated['notes'] ?? null,
                'is_dropship' => (bool)($validated['is_dropship'] ?? false)
            ]);

            // Create order items and update stock
            foreach ($validated['items'] as $item) {
                $variant = ProductVariant::findOrFail($item['product_variant_id']);

                if ($variant->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Stok tidak mencukupi untuk produk {$variant->product->name} - {$variant->variant_label}. Stok tersedia: {$variant->stock}, diminta: {$item['quantity']}"]
                    ]);
                }

                // Use discount_price if available, otherwise use provided price
                $price = $variant->discount_price ?? $item['price'];
                $subtotal = $item['quantity'] * $price;

                $order->items()->create([
                    'product_variant_id' => $item['product_variant_id'],
                    'product_name_snapshot' => $variant->product->name,
                    'variant_label' => $variant->variant_label,
                    'quantity' => $item['quantity'],
                    'price' => $price,
                    'base_price' => $variant->product->base_price,
                    'subtotal' => $subtotal
                ]);

                // Update stock
                $variant->decrement('stock', $item['quantity']);
                
                // Record stock movement
                $this->recordStockMovement(
                    $item['product_variant_id'],
                    StockMovementType::OUT,
                    $item['quantity'],
                    "Order #{$order->order_number} - {$order->customer->name}",
                    $order->id
                );
            }

            // Create payment record if payment bank is provided (manual payment)
            if (!empty($validated['payment_bank_id'])) {
                $order->payments()->create([
                    'payment_bank_id' => $validated['payment_bank_id'],
                    'amount_paid' => $validated['amount_paid'] ?? $totalPrice,
                    'paid_at' => now(),
                    'proof_image' => $validated['proof_image'] ?? '',
                    'verified_by' => null,
                    'verified_at' => null
                ]);
                // Only set order as paid if request indicates paid
                if (($validated['payment_status'] ?? 'pending') === 'paid') {
                    $order->update([
                        'status' => 'paid',
                        'payment_status' => 'paid'
                    ]);
                }
            }

            // Create shipping record if courier is provided
            if (isset($validated['courier_id'])) {
                $order->shipping()->create([
                    'courier_id' => $validated['courier_id'],
                    'courier_rate_id' => $validated['courier_rate_id'] ?? null,
                    'service_type' => $validated['service_type'] ?? null,
                    'status' => 'pending',
                    'weight' => $order->items->sum(function($i){ return ($i->productVariant->weight ?? 0) * $i->quantity; }),
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
            'data' => $order->load(['customer', 'address', 'shipping.courier', 'shipping.courierRate', 'items.productVariant.product', 'payments.paymentBank', 'createdBy', 'salesChannel', 'voucher'])
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        // Check permission
        if (!Auth::user()->hasPermission('orders.edit')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to edit orders.'
            ], 403);
        }

        $validated = $request->validate([
            'address_id' => 'sometimes|required|exists:customer_addresses,id',
            'sales_channel_id' => 'nullable|exists:sales_channels,id',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'shipping_cost' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:pending,processing,paid,shipped,delivered,cancelled',
            'courier_id' => 'nullable|exists:couriers,id',
            'courier_rate_id' => 'nullable|exists:courier_rates,id',
            'service_type' => 'nullable|string|max:100',
            'payment_bank_id' => 'nullable|exists:payment_banks,id',
            'payment_status' => 'nullable|in:pending,paid',
            'amount_paid' => 'nullable|numeric|min:0',
            'proof_image' => 'nullable|string',
            'printed_at' => 'nullable|date',
            'is_dropship' => 'nullable|boolean',
            'notes' => 'nullable|string|max:255'
        ]);

        // Batasi edit order khusus untuk order dengan payment gateway (memiliki payment_url)
        if (!is_null($order->payment_url)) {
            $allowedStatusUpdates = ['shipped', 'delivered'];
            if (isset($validated['status']) && !in_array($validated['status'], $allowedStatusUpdates)) {
                throw ValidationException::withMessages([
                    'status' => ['Orders with payment gateway can only be updated to shipped or delivered status.']
                ]);
            }
            // Untuk gateway: hanya izinkan perubahan status, field lain diabaikan
            $validated = array_intersect_key($validated, array_flip(['status']));
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

            // Update is_dropship if provided
            if (array_key_exists('is_dropship', $validated)) {
                $order->update(['is_dropship' => (bool)$validated['is_dropship']]);
            }

            // Update items if provided
            if (isset($validated['items'])) {
                // Short-circuit: if items are identical (same variants, qty, price), skip stock operations
                $existingItemsSnapshot = $order->items()->get(['product_variant_id','quantity','price'])->map(function($i){
                    return [
                        'product_variant_id' => (int)$i->product_variant_id,
                        'quantity' => (int)$i->quantity,
                        'price' => (float)$i->price,
                    ];
                })->sortBy('product_variant_id')->values()->toArray();
                $incomingItemsSnapshot = collect($validated['items'])->map(function($i){
                    return [
                        'product_variant_id' => (int)$i['product_variant_id'],
                        'quantity' => (int)$i['quantity'],
                        'price' => (float)$i['price'],
                    ];
                })->sortBy('product_variant_id')->values()->toArray();

                if ($existingItemsSnapshot === $incomingItemsSnapshot) {
                    // Still update subtotals in case of rounding changes, but do not touch stock
                    foreach ($order->items as $item) {
                        $match = collect($validated['items'])->firstWhere('product_variant_id', $item->product_variant_id);
                        if ($match) {
                            $item->update([
                                'price' => (float)$match['price'],
                                'subtotal' => (int)$match['quantity'] * (float)$match['price'],
                            ]);
                        }
                    }
                    $calculatedSubtotal = $order->items()->sum(DB::raw('quantity * price'));
                } else {
                $existingItems = $order->items()->get()->keyBy('product_variant_id');
                $incomingItems = collect($validated['items'])->keyBy('product_variant_id');

                // Handle removals and decreases
                foreach ($existingItems as $pvId => $oldItem) {
                    $variant = $oldItem->productVariant;
                    if (!$incomingItems->has($pvId)) {
                        // Item removed: return full quantity
                        $variant->increment('stock', $oldItem->quantity);
                        $this->recordStockMovement(
                            $pvId,
                            StockMovementType::IN,
                            $oldItem->quantity,
                            "Order #{$order->order_number} item removed - Stock returned",
                            $order->id
                        );
                        $oldItem->delete();
                        continue;
                    }

                    $newItem = $incomingItems->get($pvId);
                    $delta = (int)$newItem['quantity'] - (int)$oldItem->quantity;
                    // Update price/subtotal regardless of delta
                    $oldItem->update([
                        'price' => $newItem['price'],
                        'subtotal' => (int)$newItem['quantity'] * (float)$newItem['price']
                    ]);

                    if ($delta > 0) {
                        // Quantity increased: decrease stock by delta and record OUT
                        if ($variant->stock < $delta) {
                            throw ValidationException::withMessages([
                                'items' => ["Stok tidak mencukupi untuk produk {$variant->product->name} - {$variant->variant_label}. Stok tersedia: {$variant->stock}, tambahan diminta: {$delta}"]
                            ]);
                        }
                        $variant->decrement('stock', $delta);
                        $this->recordStockMovement(
                            $pvId,
                            StockMovementType::OUT,
                            $delta,
                            "Order #{$order->order_number} qty increased",
                            $order->id
                        );
                        $oldItem->update(['quantity' => (int)$newItem['quantity']]);
                    } elseif ($delta < 0) {
                        // Quantity decreased: return stock by -delta and record IN
                        $variant->increment('stock', -$delta);
                        $this->recordStockMovement(
                            $pvId,
                            StockMovementType::IN,
                            -$delta,
                            "Order #{$order->order_number} qty decreased - Stock returned",
                            $order->id
                        );
                        $oldItem->update(['quantity' => (int)$newItem['quantity']]);
                    }
                    // If delta == 0: no stock movement
                }

                // Handle additions
                foreach ($incomingItems as $pvId => $newItem) {
                    if ($existingItems->has($pvId)) continue;
                    $variant = ProductVariant::findOrFail($pvId);
                    if ($variant->stock < (int)$newItem['quantity']) {
                        throw ValidationException::withMessages([
                            'items' => ["Stok tidak mencukupi untuk produk {$variant->product->name} - {$variant->variant_label}. Stok tersedia: {$variant->stock}, diminta: {$newItem['quantity']}"]
                        ]);
                    }
                    $order->items()->create([
                        'product_variant_id' => $pvId,
                        'product_name_snapshot' => $variant->product->name,
                        'variant_label' => $variant->variant_label,
                        'quantity' => (int)$newItem['quantity'],
                        'price' => (float)$newItem['price'],
                        'base_price' => $variant->product->base_price,
                        'subtotal' => (int)$newItem['quantity'] * (float)$newItem['price']
                    ]);
                    $variant->decrement('stock', (int)$newItem['quantity']);
                    $this->recordStockMovement(
                        $pvId,
                        StockMovementType::OUT,
                        (int)$newItem['quantity'],
                        "Order #{$order->order_number} item added",
                        $order->id
                    );
                }

                // Recalculate subtotal from current items after updates
                $subtotal = $order->items()->sum(DB::raw('quantity * price'));
                $calculatedSubtotal = $subtotal;
                }
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

                // Sync payment_status for manual orders (no payment_url)
                if (is_null($order->payment_url)) {
                    if ($validated['status'] === 'paid') {
                        $order->update(['payment_status' => PaymentStatus::PAID]);
                    } elseif ($validated['status'] === 'cancelled') {
                        $order->update(['payment_status' => PaymentStatus::CANCELLED]);
                    }
                }
            }

            // Update or create payment record if payment bank is provided (manual payment)
            if (!empty($validated['payment_bank_id'])) {
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
                if (($validated['payment_status'] ?? 'pending') === 'paid') {
                    $order->update([
                        'status' => 'paid',
                        'payment_status' => 'paid'
                    ]);
                }
            }

            // Update or create shipping record if courier is provided
            if (isset($validated['courier_id'])) {
                $order->shipping()->updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'courier_id' => $validated['courier_id'],
                        'courier_rate_id' => $validated['courier_rate_id'] ?? $order->shipping->courier_rate_id ?? null,
                        'service_type' => $validated['service_type'] ?? $order->shipping->service_type ?? null,
                        'status' => $order->shipping->status ?? 'pending',
                        'weight' => $order->items->sum(function($i){ return ($i->productVariant->weight ?? 0) * $i->quantity; }),
                        'tracking_number' => $order->shipping->tracking_number ?? '',
                        'shipped_at' => $order->shipping->shipped_at ?? now()
                    ]
                );
            }

            // Update printed_at if provided
            if (isset($validated['printed_at'])) {
                $order->update(['printed_at' => $validated['printed_at']]);
            }

            // Update notes if provided (manual orders only)
            if (isset($validated['notes']) && is_null($order->payment_url)) {
                $order->update(['notes' => $validated['notes']]);
            }

            // Update timestamp
            $order->touch();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order updated successfully',
                'data' => $order->fresh()->load(['customer', 'shipping.courier', 'shipping.courierRate', 'items.productVariant.product', 'payments.paymentBank', 'createdBy', 'salesChannel'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Order $order): JsonResponse
    {
        // Check permission
        if (!Auth::user()->hasPermission('orders.delete')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to delete orders.'
            ], 403);
        }

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
        // Check permission
        if (!Auth::user()->hasPermission('orders.update_status')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to update order status.'
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,processing,paid,shipped,delivered,cancelled'
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

            // When status is paid for manual orders, sync payment_status to paid
            if ($validated['status'] === 'paid' && is_null($order->payment_url)) {
                $order->update([
                    'payment_status' => PaymentStatus::PAID
                ]);
            }

            // When status is cancelled for manual orders, sync payment_status to cancelled
            if ($validated['status'] === 'cancelled' && is_null($order->payment_url)) {
                $order->update([
                    'payment_status' => PaymentStatus::CANCELLED
                ]);
            }

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
                        "Order #{$order->order_number} cancelled - Stock returned"
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
    private function recordStockMovement($productVariantId, $type, $quantity, $note, $orderId = null)
    {
        StockMovement::create([
            'product_variant_id' => $productVariantId,
            'order_id' => $orderId,
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
                    'shipped_at' => $shipping->shipped_at->setTimezone(config('app.timezone'))->toIso8601String()
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
