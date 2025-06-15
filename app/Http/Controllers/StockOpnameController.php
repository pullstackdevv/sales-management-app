<?php

namespace App\Http\Controllers;

use App\Models\StockOpname;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockOpnameController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $stockOpnames = StockOpname::with(['createdBy', 'details.productVariant'])
            ->when($request->search, function ($query, $search) {
                $query->where('notes', 'like', "%{$search}%");
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
            'data' => $stockOpnames
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:255',
            'status' => 'required|in:draft,finalized',
            'details' => 'required|array',
            'details.*.product_variant_id' => 'required|exists:product_variants,id',
            'details.*.system_stock' => 'required|integer|min:0',
            'details.*.actual_stock' => 'required|integer|min:0',
            'details.*.notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            $stockOpname = StockOpname::create([
                'notes' => $validated['notes'],
                'status' => $validated['status'],
                'created_by' => Auth::id()
            ]);

            foreach ($validated['details'] as $detail) {
                $stockOpname->details()->create([
                    ...$detail,
                    'created_by' => Auth::id()
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock opname created successfully',
                'data' => $stockOpname->load(['createdBy', 'details.productVariant'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(StockOpname $stockOpname): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $stockOpname->load(['createdBy', 'details.productVariant'])
        ]);
    }

    public function update(Request $request, StockOpname $stockOpname): JsonResponse
    {
        if ($stockOpname->status === 'finalized') {
            throw ValidationException::withMessages([
                'status' => ['Cannot update finalized stock opname.']
            ]);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:255',
            'status' => 'required|in:draft,finalized',
            'details' => 'sometimes|required|array',
            'details.*.product_variant_id' => 'required|exists:product_variants,id',
            'details.*.system_stock' => 'required|integer|min:0',
            'details.*.actual_stock' => 'required|integer|min:0',
            'details.*.notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            $stockOpname->update([
                'notes' => $validated['notes'],
                'status' => $validated['status'],
                'updated_by' => Auth::id()
            ]);

            if (isset($validated['details'])) {
                // Delete existing details
                $stockOpname->details()->delete();

                // Create new details
                foreach ($validated['details'] as $detail) {
                    $stockOpname->details()->create([
                        ...$detail,
                        'created_by' => Auth::id()
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock opname updated successfully',
                'data' => $stockOpname->fresh()->load(['createdBy', 'details.productVariant'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(StockOpname $stockOpname): JsonResponse
    {
        if ($stockOpname->status === 'finalized') {
            throw ValidationException::withMessages([
                'status' => ['Cannot delete finalized stock opname.']
            ]);
        }

        try {
            DB::beginTransaction();

            // Delete all details
            $stockOpname->details()->delete();
            
            // Delete the stock opname
            $stockOpname->update(['deleted_by' => Auth::id()]);
            $stockOpname->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock opname deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function finalize(StockOpname $stockOpname): JsonResponse
    {
        if ($stockOpname->status === 'finalized') {
            throw ValidationException::withMessages([
                'status' => ['Stock opname is already finalized.']
            ]);
        }

        try {
            DB::beginTransaction();

            // Update stock for each variant
            foreach ($stockOpname->details as $detail) {
                $variant = $detail->productVariant;
                $difference = $detail->actual_stock - $detail->system_stock;

                if ($difference !== 0) {
                    // Create stock movement for adjustment
                    $variant->stockMovements()->create([
                        'type' => 'adjustment',
                        'quantity' => abs($difference),
                        'notes' => 'Stock adjustment from stock opname #' . $stockOpname->id,
                        'created_by' => Auth::id()
                    ]);

                    // Update variant stock
                    $variant->update([
                        'stock' => $detail->actual_stock,
                        'updated_by' => Auth::id()
                    ]);
                }
            }

            // Update stock opname status
            $stockOpname->update([
                'status' => 'finalized',
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock opname finalized successfully',
                'data' => $stockOpname->fresh()->load(['createdBy', 'details.productVariant'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
} 