<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

    public function storefront(Request $request): JsonResponse
    {
        $products = Product::with(['variants' => function($query) {
                $query->where('is_active', true)
                      ->where('is_storefront', true);
            }])
            ->where('is_storefront', true)
            ->where('is_active', true)
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->category, function($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->sort, function ($query, $sort) {
                switch ($sort) {
                    case 'name':
                        $query->orderBy('name', 'asc');
                        break;
                    case 'price_asc':
                        $query->orderBy(
                            \DB::raw('(SELECT MIN(price) FROM product_variants WHERE product_variants.product_id = products.id AND product_variants.is_active = 1 AND product_variants.is_storefront = 1)'),
                            'asc'
                        );
                        break;
                    case 'price_desc':
                        $query->orderBy(
                            \DB::raw('(SELECT MIN(price) FROM product_variants WHERE product_variants.product_id = products.id AND product_variants.is_active = 1 AND product_variants.is_storefront = 1)'),
                            'desc'
                        );
                        break;
                    case 'stock':
                        $query->orderBy(
                            \DB::raw('(SELECT SUM(stock) FROM product_variants WHERE product_variants.product_id = products.id AND product_variants.is_active = 1 AND product_variants.is_storefront = 1)'),
                            'desc'
                        );
                        break;
                    default:
                        $query->latest();
                }
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => [
                'data' => ProductResource::collection($products->items()),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:products,sku',
            'description' => 'nullable|string',
            'category' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'boolean',
            'is_storefront' => 'boolean',
            'variants' => 'required|array|min:1',
            'variants.*.variant_label' => 'required|string|max:255',
            'variants.*.sku' => 'required|string|max:255|unique:product_variants,sku',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.base_price' => 'required|numeric|min:0',
            'variants.*.weight' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
            'variants.*.is_active' => 'boolean',
            'variants.*.is_storefront' => 'boolean',
            'variants.*.image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        try {
            DB::beginTransaction();

            $product = Product::create([
                'name' => $validated['name'],
                'sku' => $validated['sku'],
                'description' => $validated['description'],
                'category' => $validated['category'],
                'image' => $imagePath,
                'is_active' => $validated['is_active'] ?? true,
                'is_storefront' => $validated['is_storefront'] ?? true,
                'created_by' => Auth::id()
            ]);

            foreach ($validated['variants'] as $index => $variant) {
                // Handle variant image upload (if provided)
                $variantImagePath = null;
                if ($request->hasFile("variants.$index.image")) {
                    try {
                        // Ensure directory exists
                        if (!Storage::disk('public')->exists('product-variants')) {
                            Storage::disk('public')->makeDirectory('product-variants');
                        }
                        
                        $variantImagePath = $request->file("variants.$index.image")->store('product-variants', 'public');
                    } catch (\Exception $e) {
                        throw new \Exception("The variants.$index.image failed to upload: " . $e->getMessage());
                    }
                }

                $product->variants()->create([
                    'variant_label' => $variant['variant_label'],
                    'sku' => $variant['sku'],
                    'price' => $variant['price'],
                    'base_price' => $variant['base_price'],
                    'weight' => $variant['weight'] ?? null,
                    'stock' => $variant['stock'],
                    'is_active' => $variant['is_active'] ?? true,
                    'is_storefront' => $variant['is_storefront'] ?? true,
                    'image' => $variantImagePath,
                    'created_by' => Auth::id()
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product created successfully',
                'data' => new ProductResource($product->load(['variants', 'createdBy']))
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
            'data' => new ProductResource($product->load(['variants', 'createdBy']))
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        // Custom validation for variants SKU
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|required|string|max:100|unique:products,sku,' . $product->id,
            'description' => 'nullable|string',
            'category' => 'sometimes|required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'boolean',
            'is_storefront' => 'boolean',
            'variants' => 'sometimes|required|array|min:1',
            'variants.*.id' => 'sometimes|required|exists:product_variants,id',
            'variants.*.variant_label' => 'required|string|max:255',
            'variants.*.sku' => 'required|string|max:50',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.base_price' => 'required|numeric|min:0',
            'variants.*.weight' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
            'variants.*.is_active' => 'boolean',
            'variants.*.is_storefront' => 'boolean',
            'variants.*.image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        // Additional validation for variant SKU uniqueness
        if ($request->has('variants')) {
            foreach ($request->variants as $index => $variant) {
                $query = ProductVariant::where('sku', $variant['sku']);
                
                // If variant has ID, exclude it from uniqueness check
                if (isset($variant['id'])) {
                    $query->where('id', '!=', $variant['id']);
                }
                
                if ($query->exists()) {
                    throw ValidationException::withMessages([
                        "variants.{$index}.sku" => ['The SKU has already been taken.']
                    ]);
                }
            }
        }

        // Handle image upload
        $imagePath = $product->image; // Keep existing image by default
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }
            $imagePath = $request->file('image')->store('products', 'public');
        }

        try {
            DB::beginTransaction();

            $product->update([
                'name' => $validated['name'] ?? $product->name,
                'sku' => $validated['sku'] ?? $product->sku,
                'description' => $validated['description'] ?? $product->description,
                'category' => $validated['category'] ?? $product->category,
                'image' => $imagePath,
                'is_active' => $validated['is_active'] ?? $product->is_active,
                'is_storefront' => $validated['is_storefront'] ?? $product->is_storefront,
                'updated_by' => Auth::id()
            ]);

            if (isset($validated['variants'])) {
                // Delete variants that are not in the request
                $variantIds = collect($validated['variants'])->pluck('id')->filter();
                $product->variants()->whereNotIn('id', $variantIds)->delete();

                // Update or create variants (with image handling)
                foreach ($validated['variants'] as $index => $variant) {
                    if (isset($variant['id'])) {
                        $variantModel = $product->variants()->where('id', $variant['id'])->firstOrFail();
                        $variantImagePath = $variantModel->image;
                        if ($request->hasFile("variants.$index.image")) {
                            try {
                                // Ensure directory exists
                                if (!Storage::disk('public')->exists('product-variants')) {
                                    Storage::disk('public')->makeDirectory('product-variants');
                                }
                                
                                if ($variantImagePath && Storage::disk('public')->exists($variantImagePath)) {
                                    Storage::disk('public')->delete($variantImagePath);
                                }
                                $variantImagePath = $request->file("variants.$index.image")->store('product-variants', 'public');
                            } catch (\Exception $e) {
                                throw new \Exception("The variants.$index.image failed to upload: " . $e->getMessage());
                            }
                        }

                        $variantModel->update([
                            'variant_label' => $variant['variant_label'],
                            'sku' => $variant['sku'],
                            'price' => $variant['price'],
                            'base_price' => $variant['base_price'],
                            'weight' => $variant['weight'] ?? null,
                            'stock' => $variant['stock'],
                            'is_active' => $variant['is_active'] ?? true,
                            'is_storefront' => $variant['is_storefront'] ?? true,
                            'image' => $variantImagePath,
                            'updated_by' => Auth::id()
                        ]);
                    } else {
                        $variantImagePath = null;
                        if ($request->hasFile("variants.$index.image")) {
                            try {
                                // Ensure directory exists
                                if (!Storage::disk('public')->exists('product-variants')) {
                                    Storage::disk('public')->makeDirectory('product-variants');
                                }
                                
                                $variantImagePath = $request->file("variants.$index.image")->store('product-variants', 'public');
                            } catch (\Exception $e) {
                                throw new \Exception("The variants.$index.image failed to upload: " . $e->getMessage());
                            }
                        }
                        $product->variants()->create([
                            'variant_label' => $variant['variant_label'],
                            'sku' => $variant['sku'],
                            'price' => $variant['price'],
                            'base_price' => $variant['base_price'],
                            'weight' => $variant['weight'] ?? null,
                            'stock' => $variant['stock'],
                            'is_active' => $variant['is_active'] ?? true,
                            'is_storefront' => $variant['is_storefront'] ?? true,
                            'image' => $variantImagePath,
                            'created_by' => Auth::id()
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product updated successfully',
                'data' => new ProductResource($product->load(['variants', 'createdBy']))
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

            // Delete product image if exists
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }

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