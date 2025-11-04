<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Shipping;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShippingController extends Controller
{
    public function index(Request $request, Order $order): JsonResponse
    {
        $shipping = $order->shipping()
            ->with(['courier', 'createdBy'])
            ->when($request->search, function ($query, $search) {
                $query->where('tracking_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $shipping
        ]);
    }

    public function store(Request $request, Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => ['Cannot add shipping to cancelled order.']
            ]);
        }

        if ($order->shipping()->exists()) {
            throw ValidationException::withMessages([
                'order' => ['Shipping information already exists for this order.']
            ]);
        }

        $validated = $request->validate([
            'courier_id' => 'required|exists:couriers,id',
            'courier_rate_id' => 'required|exists:courier_rates,id',
            'tracking_number' => 'required|string|max:50',
            'shipping_date' => 'required|date',
            'estimated_arrival' => 'required|date|after:shipping_date',
            'shipping_cost' => 'required|numeric|min:0',
            'weight' => 'required|numeric|min:0',
            'dimensions' => 'required|array',
            'dimensions.length' => 'required|numeric|min:0',
            'dimensions.width' => 'required|numeric|min:0',
            'dimensions.height' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            $shipping = $order->shipping()->create([
                ...$validated,
                'status' => 'pending',
                'created_by' => Auth::id()
            ]);

            // Update order status
            $order->update([
                'status' => 'shipped',
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Shipping information added successfully',
                'data' => $shipping->load(['courier', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Order $order, Shipping $shipping): JsonResponse
    {
        if ($shipping->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'shipping' => ['This shipping information does not belong to the specified order.']
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $shipping->load(['courier', 'createdBy'])
        ]);
    }

    public function update(Request $request, Order $order, Shipping $shipping): JsonResponse
    {
        if ($shipping->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'shipping' => ['This shipping information does not belong to the specified order.']
            ]);
        }

        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => ['Cannot update shipping information for cancelled order.']
            ]);
        }

        $validated = $request->validate([
            'courier_id' => 'sometimes|required|exists:couriers,id',
            'courier_rate_id' => 'sometimes|required|exists:courier_rates,id',
            'tracking_number' => 'sometimes|required|string|max:50',
            'shipping_date' => 'sometimes|required|date',
            'estimated_arrival' => 'sometimes|required|date|after:shipping_date',
            'shipping_cost' => 'sometimes|required|numeric|min:0',
            'weight' => 'sometimes|required|numeric|min:0',
            'dimensions' => 'sometimes|required|array',
            'dimensions.length' => 'required_with:dimensions|numeric|min:0',
            'dimensions.width' => 'required_with:dimensions|numeric|min:0',
            'dimensions.height' => 'required_with:dimensions|numeric|min:0',
            'status' => 'sometimes|required|in:pending,shipped,delivered,returned',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            $shipping->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            // Update order status if shipping status is delivered
            if (isset($validated['status']) && $validated['status'] === 'delivered') {
                $order->update([
                    'status' => 'completed',
                    'updated_by' => Auth::id()
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Shipping information updated successfully',
                'data' => $shipping->fresh()->load(['courier', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Order $order, Shipping $shipping): JsonResponse
    {
        if ($shipping->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'shipping' => ['This shipping information does not belong to the specified order.']
            ]);
        }

        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => ['Cannot delete shipping information for cancelled order.']
            ]);
        }

        if ($shipping->status === 'delivered') {
            throw ValidationException::withMessages([
                'shipping' => ['Cannot delete shipping information for delivered order.']
            ]);
        }

        try {
            DB::beginTransaction();

            $shipping->update(['deleted_by' => Auth::id()]);
            $shipping->delete();

            // Update order status
            $order->update([
                'status' => 'processing',
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Shipping information deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
} 