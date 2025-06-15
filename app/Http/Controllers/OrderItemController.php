<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderItemController extends Controller
{
    public function index(Request $request, Order $order): JsonResponse
    {
        $items = $order->items()
            ->with(['productVariant.product', 'createdBy'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('productVariant', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $items
        ]);
    }

    public function store(Request $request, Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => ['Cannot add items to cancelled order.']
            ]);
        }

        $validated = $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            // Check if variant is already in order
            $existingItem = $order->items()
                ->where('product_variant_id', $validated['product_variant_id'])
                ->first();

            if ($existingItem) {
                throw ValidationException::withMessages([
                    'product_variant_id' => ['This variant is already in the order.']
                ]);
            }

            // Check stock availability
            $variant = ProductVariant::findOrFail($validated['product_variant_id']);
            if ($variant->stock < $validated['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => ['Insufficient stock for this variant.']
                ]);
            }

            $item = $order->items()->create([
                ...$validated,
                'subtotal' => $validated['quantity'] * $validated['price'],
                'created_by' => Auth::id()
            ]);

            // Update order total
            $order->update([
                'total_amount' => $order->items()->sum('subtotal'),
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order item added successfully',
                'data' => $item->load(['productVariant.product', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Order $order, OrderItem $item): JsonResponse
    {
        if ($item->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'item' => ['This item does not belong to the specified order.']
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $item->load(['productVariant.product', 'createdBy'])
        ]);
    }

    public function update(Request $request, Order $order, OrderItem $item): JsonResponse
    {
        if ($item->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'item' => ['This item does not belong to the specified order.']
            ]);
        }

        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => ['Cannot update items in cancelled order.']
            ]);
        }

        $validated = $request->validate([
            'quantity' => 'sometimes|required|integer|min:1',
            'price' => 'sometimes|required|numeric|min:0',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            // Check stock availability if quantity is being updated
            if (isset($validated['quantity'])) {
                $variant = $item->productVariant;
                $currentQuantity = $item->quantity;
                $newQuantity = $validated['quantity'];
                
                if ($variant->stock + $currentQuantity < $newQuantity) {
                    throw ValidationException::withMessages([
                        'quantity' => ['Insufficient stock for this variant.']
                    ]);
                }
            }

            $item->update([
                ...$validated,
                'subtotal' => ($validated['quantity'] ?? $item->quantity) * ($validated['price'] ?? $item->price),
                'updated_by' => Auth::id()
            ]);

            // Update order total
            $order->update([
                'total_amount' => $order->items()->sum('subtotal'),
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order item updated successfully',
                'data' => $item->fresh()->load(['productVariant.product', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Order $order, OrderItem $item): JsonResponse
    {
        if ($item->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'item' => ['This item does not belong to the specified order.']
            ]);
        }

        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => ['Cannot delete items from cancelled order.']
            ]);
        }

        try {
            DB::beginTransaction();

            $item->update(['deleted_by' => Auth::id()]);
            $item->delete();

            // Update order total
            $order->update([
                'total_amount' => $order->items()->sum('subtotal'),
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Order item deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
} 