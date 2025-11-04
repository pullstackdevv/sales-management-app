<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductVariantController extends Controller
{
    public function index(Request $request, Product $product): JsonResponse
    {
        $variants = $product->variants()
            ->with(['product'])
            ->when($request->search, function ($query, $search) {
                $query->where('variant_label', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $variants
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'variant_label' => 'required|string|max:255',
            'sku' => 'required|string|max:50|unique:product_variants,sku',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $variant = $product->variants()->create([
                ...$validated,
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product variant created successfully',
                'data' => $variant->load('product')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Product $product, ProductVariant $variant): JsonResponse
    {
        if ($variant->product_id !== $product->id) {
            throw ValidationException::withMessages([
                'variant' => ['This variant does not belong to the specified product.']
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $variant->load('product')
        ]);
    }

    public function update(Request $request, Product $product, ProductVariant $variant): JsonResponse
    {
        if ($variant->product_id !== $product->id) {
            throw ValidationException::withMessages([
                'variant' => ['This variant does not belong to the specified product.']
            ]);
        }

        $validated = $request->validate([
            'variant_label' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|required|string|max:50|unique:product_variants,sku,' . $variant->id,
            'price' => 'sometimes|required|numeric|min:0',
            'stock' => 'sometimes|required|integer|min:0',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $variant->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product variant updated successfully',
                'data' => $variant->fresh()->load('product')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Product $product, ProductVariant $variant): JsonResponse
    {
        if ($variant->product_id !== $product->id) {
            throw ValidationException::withMessages([
                'variant' => ['This variant does not belong to the specified product.']
            ]);
        }

        // Check if variant is used in any order
        if ($variant->orderItems()->exists()) {
            throw ValidationException::withMessages([
                'variant' => ['Cannot delete variant that is used in orders.']
            ]);
        }

        try {
            DB::beginTransaction();

            $variant->update(['deleted_by' => Auth::id()]);
            $variant->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product variant deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}