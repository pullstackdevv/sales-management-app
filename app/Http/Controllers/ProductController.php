<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::with(['variants'])
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->category, function($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $products
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'description' => 'nullable|string',
            'category' => 'required|string|max:255',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'variants' => 'required|array|min:1',
            'variants.*.variant_label' => 'required|string|max:255',
            'variants.*.sku' => 'required|string|max:50|unique:product_variants,sku',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
            'variants.*.is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $product = Product::create([
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'description' => $validated['description'],
                'category' => $validated['category'],
                'base_price' => $validated['base_price'],
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => Auth::id()
            ]);

            foreach ($validated['variants'] as $variant) {
                $product->variants()->create([
                    ...$variant,
                    'created_by' => Auth::id()
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product created successfully',
                'data' => $product->load(['variants', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $product->load(['variants', 'createdBy'])
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|required|string|max:100|unique:products,sku,' . $product->id,
            'description' => 'nullable|string',
            'category' => 'sometimes|required|string|max:255',
            'base_price' => 'sometimes|required|numeric|min:0',
            'is_active' => 'boolean',
            'variants' => 'sometimes|required|array|min:1',
            'variants.*.id' => 'sometimes|required|exists:product_variants,id',
            'variants.*.variant_label' => 'required|string|max:255',
            'variants.*.sku' => 'required|string|max:50|unique:product_variants,sku',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
            'variants.*.is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $product->update([
                'name' => $validated['name'] ?? $product->name,
                'sku' => $validated['sku'] ?? $product->sku,
                'description' => $validated['description'] ?? $product->description,
                'category' => $validated['category'] ?? $product->category,
                'base_price' => $validated['base_price'] ?? $product->base_price,
                'is_active' => $validated['is_active'] ?? $product->is_active,
                'updated_by' => Auth::id()
            ]);

            if (isset($validated['variants'])) {
                // Delete variants that are not in the request
                $variantIds = collect($validated['variants'])->pluck('id')->filter();
                $product->variants()->whereNotIn('id', $variantIds)->delete();

                // Update or create variants
                foreach ($validated['variants'] as $variant) {
                    if (isset($variant['id'])) {
                        $product->variants()->where('id', $variant['id'])->update([
                            ...$variant,
                            'updated_by' => Auth::id()
                        ]);
                    } else {
                        $product->variants()->create([
                            ...$variant,
                            'created_by' => Auth::id()
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product updated successfully',
                'data' => $product->fresh()->load(['variants', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Product $product): JsonResponse
    {
        try {
            if ($product->variants()->whereHas('orderItems')->exists()) {
                throw ValidationException::withMessages([
                    'product' => ['Cannot delete product that has been ordered.']
                ]);
            }

            if ($product->variants()->whereHas('stockMovements')->exists()) {
                throw ValidationException::withMessages([
                    'product' => ['Cannot delete product that has stock movements.']
                ]);
            }

            DB::beginTransaction();

            // Delete all variants
            $product->variants()->delete();
            
            // Delete the product
            $product->update(['deleted_by' => Auth::id()]);
            $product->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}