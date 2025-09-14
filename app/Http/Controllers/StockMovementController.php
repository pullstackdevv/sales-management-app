<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockMovementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $movements = StockMovement::with(['productVariant.product', 'createdBy'])
            ->when($request->product_variant_id, function ($query, $variantId) {
                $query->where('product_variant_id', $variantId);
            })
            ->when($request->search, function ($query, $search) {
                $query->whereHas('productVariant', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $movements
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            $movement = StockMovement::create([
                'product_variant_id' => $validated['product_variant_id'],
                'type' => $validated['type'],
                'quantity' => $validated['quantity'],
                'note' => $validated['notes'] ?? null,
                'created_by' => Auth::id()
            ]);

            // Update product variant stock
            $variant = $movement->productVariant;
            if ($validated['type'] === 'in') {
                $variant->increment('stock', $validated['quantity']);
            } elseif ($validated['type'] === 'out') {
                if ($variant->stock < $validated['quantity']) {
                    throw ValidationException::withMessages([
                        'quantity' => ['Insufficient stock for this variant.']
                    ]);
                }
                $variant->decrement('stock', $validated['quantity']);
            } else {
                $variant->update(['stock' => $validated['quantity']]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock movement created successfully',
                'data' => $movement->load(['productVariant.product', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(StockMovement $stockMovement): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $stockMovement->load(['productVariant.product', 'createdBy'])
        ]);
    }

    public function update(Request $request, StockMovement $stockMovement): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            $stockMovement->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock movement updated successfully',
                'data' => $stockMovement->fresh()->load(['productVariant.product', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(StockMovement $stockMovement): JsonResponse
    {
        // Check if movement is from stock opname
        if ($stockMovement->stock_opname_detail_id) {
            throw ValidationException::withMessages([
                'movement' => ['Cannot delete stock movement from stock opname.']
            ]);
        }

        try {
            DB::beginTransaction();

            // Revert stock change
            $variant = $stockMovement->productVariant;
            if ($stockMovement->type === 'in') {
                if ($variant->stock < $stockMovement->quantity) {
                    throw ValidationException::withMessages([
                        'movement' => ['Cannot delete movement: insufficient stock to revert.']
                    ]);
                }
                $variant->decrement('stock', $stockMovement->quantity);
            } elseif ($stockMovement->type === 'out') {
                $variant->increment('stock', $stockMovement->quantity);
            }

            $stockMovement->update(['deleted_by' => Auth::id()]);
            $stockMovement->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock movement deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}