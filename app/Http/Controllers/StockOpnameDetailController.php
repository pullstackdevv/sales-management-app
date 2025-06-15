<?php

namespace App\Http\Controllers;

use App\Models\StockOpname;
use App\Models\StockOpnameDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockOpnameDetailController extends Controller
{
    public function index(Request $request, StockOpname $stockOpname): JsonResponse
    {
        $details = $stockOpname->details()
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
            'data' => $details
        ]);
    }

    public function store(Request $request, StockOpname $stockOpname): JsonResponse
    {
        if ($stockOpname->is_finalized) {
            throw ValidationException::withMessages([
                'stock_opname' => ['Cannot add details to finalized stock opname.']
            ]);
        }

        $validated = $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'system_stock' => 'required|integer|min:0',
            'actual_stock' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            // Check if variant is already in stock opname
            $existingDetail = $stockOpname->details()
                ->where('product_variant_id', $validated['product_variant_id'])
                ->first();

            if ($existingDetail) {
                throw ValidationException::withMessages([
                    'product_variant_id' => ['This variant is already in the stock opname.']
                ]);
            }

            $detail = $stockOpname->details()->create([
                ...$validated,
                'difference' => $validated['actual_stock'] - $validated['system_stock'],
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock opname detail added successfully',
                'data' => $detail->load(['productVariant.product', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(StockOpname $stockOpname, StockOpnameDetail $detail): JsonResponse
    {
        if ($detail->stock_opname_id !== $stockOpname->id) {
            throw ValidationException::withMessages([
                'detail' => ['This detail does not belong to the specified stock opname.']
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $detail->load(['productVariant.product', 'createdBy'])
        ]);
    }

    public function update(Request $request, StockOpname $stockOpname, StockOpnameDetail $detail): JsonResponse
    {
        if ($detail->stock_opname_id !== $stockOpname->id) {
            throw ValidationException::withMessages([
                'detail' => ['This detail does not belong to the specified stock opname.']
            ]);
        }

        if ($stockOpname->is_finalized) {
            throw ValidationException::withMessages([
                'stock_opname' => ['Cannot update details in finalized stock opname.']
            ]);
        }

        $validated = $request->validate([
            'system_stock' => 'sometimes|required|integer|min:0',
            'actual_stock' => 'sometimes|required|integer|min:0',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            if (isset($validated['system_stock']) || isset($validated['actual_stock'])) {
                $systemStock = $validated['system_stock'] ?? $detail->system_stock;
                $actualStock = $validated['actual_stock'] ?? $detail->actual_stock;
                $validated['difference'] = $actualStock - $systemStock;
            }

            $detail->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock opname detail updated successfully',
                'data' => $detail->fresh()->load(['productVariant.product', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(StockOpname $stockOpname, StockOpnameDetail $detail): JsonResponse
    {
        if ($detail->stock_opname_id !== $stockOpname->id) {
            throw ValidationException::withMessages([
                'detail' => ['This detail does not belong to the specified stock opname.']
            ]);
        }

        if ($stockOpname->is_finalized) {
            throw ValidationException::withMessages([
                'stock_opname' => ['Cannot delete details from finalized stock opname.']
            ]);
        }

        try {
            DB::beginTransaction();

            $detail->update(['deleted_by' => Auth::id()]);
            $detail->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock opname detail deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
} 