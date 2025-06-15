<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\CourierRate;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\Shipping;
use App\Http\Requests\Order\StoreRequest;
use App\Http\Requests\Order\UpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with(['customer', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy'])
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
            'shipping_address_id' => 'required|exists:customer_addresses,id',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'shipping_cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            // Generate order number
            $orderNumber = 'ORD-' . date('Ymd') . '-' . str_pad(Order::whereDate('created_at', today())->count() + 1, 4, '0', STR_PAD_LEFT);

            // Calculate subtotal
            $subtotal = collect($validated['items'])->sum(function ($item) {
                return $item['quantity'] * $item['price'];
            });

            // Create order
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $validated['customer_id'],
                'shipping_address_id' => $validated['shipping_address_id'],
                'subtotal' => $subtotal,
                'shipping_cost' => $validated['shipping_cost'],
                'total' => $subtotal + $validated['shipping_cost'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id()
            ]);

            // Create order items and update stock
            foreach ($validated['items'] as $item) {
                $variant = ProductVariant::findOrFail($item['product_variant_id']);

                if ($variant->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Insufficient stock for {$variant->name}"]
                    ]);
                }

                $order->items()->create([
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'subtotal' => $item['quantity'] * $item['price']
                ]);

                // Update stock
                $variant->decrement('stock', $item['quantity']);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order created successfully',
                'data' => $order->load(['customer', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy'])
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
            'data' => $order->load(['customer', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy'])
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        if ($order->status !== 'pending') {
            throw ValidationException::withMessages([
                'order' => ['Can only update pending orders.']
            ]);
        }

        $validated = $request->validate([
            'shipping_address_id' => 'sometimes|required|exists:customer_addresses,id',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'shipping_cost' => 'sometimes|required|numeric|min:0',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            // Update shipping address if provided
            if (isset($validated['shipping_address_id'])) {
                $order->update(['shipping_address_id' => $validated['shipping_address_id']]);
            }

            // Update items if provided
            if (isset($validated['items'])) {
                // Delete existing items and restore stock
                foreach ($order->items as $item) {
                    $variant = $item->productVariant;
                    $variant->increment('stock', $item->quantity);
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
                            'items' => ["Insufficient stock for {$variant->name}"]
                        ]);
                    }

                    $order->items()->create([
                        'product_variant_id' => $item['product_variant_id'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'subtotal' => $item['quantity'] * $item['price']
                    ]);

                    // Update stock
                    $variant->decrement('stock', $item['quantity']);
                }

                // Update order totals
                $order->update([
                    'subtotal' => $subtotal,
                    'total' => $subtotal + ($validated['shipping_cost'] ?? $order->shipping_cost)
                ]);
            }

            // Update shipping cost if provided
            if (isset($validated['shipping_cost'])) {
                $order->update([
                    'shipping_cost' => $validated['shipping_cost'],
                    'total' => $order->subtotal + $validated['shipping_cost']
                ]);
            }

            // Update notes if provided
            if (isset($validated['notes'])) {
                $order->update(['notes' => $validated['notes']]);
            }

            $order->update(['updated_by' => Auth::id()]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order updated successfully',
                'data' => $order->fresh()->load(['customer', 'shipping.courier', 'items.productVariant.product', 'payments.paymentBank', 'createdBy'])
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
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled'
        ]);

        if ($order->status === $validated['status']) {
            throw ValidationException::withMessages([
                'status' => ['Order is already in this status.']
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

    public function generateShippingLabel(Order $order): JsonResponse
    {
        if (!$order->shipping) {
            throw ValidationException::withMessages([
                'order' => ['Order has no shipping information.']
            ]);
        }

        $pdf = PDF::loadView('orders.shipping-label', [
            'order' => $order->load(['customer', 'shipping.courier', 'items.productVariant.product'])
        ]);

        $filename = "shipping-label-{$order->order_number}.pdf";
        Storage::put("public/shipping-labels/{$filename}", $pdf->output());

        return response()->json([
            'status' => 'success',
            'message' => 'Shipping label generated successfully',
            'data' => [
                'url' => Storage::url("shipping-labels/{$filename}")
            ]
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
            'destination_city' => 'required|string'
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

        return response()->json([
            'status' => 'success',
            'data' => [
                'rate' => $courierRate->rate,
                'estimated_days' => $courierRate->estimated_days
            ]
        ]);
    }
} 