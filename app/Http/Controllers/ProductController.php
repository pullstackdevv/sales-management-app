<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Enums\StockMovementType;
use App\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Jobs\ImportProductsJob;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!Auth::user()->hasPermission('products.view')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to view products.'
            ], 403);
        }
        $products = Product::with(['variants', 'categories', 'tags'])
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->category_ids, function($query, $ids) {
                $ids = is_array($ids) ? $ids : [$ids];
                $query->whereHas('categories', function($q) use ($ids) {
                    $q->whereIn('product_categories.id', $ids);
                });
            })
            ->when($request->tag_ids, function($query, $ids) {
                $ids = is_array($ids) ? $ids : [$ids];
                $query->whereHas('tags', function($q) use ($ids) {
                    $q->whereIn('tags.id', $ids);
                });
            })
            ->when($request->no_base_price, function($query) {
                $query->whereHas('variants', function($q) {
                    $q->whereNull('base_price')->orWhere('base_price', 0);
                });
            })
            ->when($request->category, function($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->has_discount, function($query, $hasDiscount) {
                if ($hasDiscount) {
                    $query->whereHas('variants', function($q) {
                        $q->whereNotNull('discount_price')->where('discount_price', '>', 0);
                    });
                }
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $direction = $request->sort_direction ?? 'asc';
                switch ($sortBy) {
                    case 'stock':
                        $query->orderBy(
                            \DB::raw('(SELECT SUM(stock) FROM product_variants WHERE product_variants.product_id = products.id)'),
                            $direction
                        );
                        break;
                    case 'price':
                        $query->orderBy(
                            \DB::raw('(SELECT MIN(price) FROM product_variants WHERE product_variants.product_id = products.id)'),
                            $direction
                        );
                        break;
                    case 'name':
                        $query->orderBy('name', $direction);
                        break;
                    case 'created_at':
                        $query->orderBy('created_at', $direction);
                        break;
                    default:
                        $query->orderBy($sortBy, $direction);
                }
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
            }, 'categories', 'tags'])
            ->where('is_storefront', true)
            ->where('is_active', true)
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->category_ids, function($query, $ids) {
                $ids = is_array($ids) ? $ids : [$ids];
                $query->whereHas('categories', function($q) use ($ids) {
                    $q->whereIn('product_categories.id', $ids);
                });
            })
            ->when($request->tag_ids, function($query, $ids) {
                $ids = is_array($ids) ? $ids : [$ids];
                $query->whereHas('tags', function($q) use ($ids) {
                    $q->whereIn('tags.id', $ids);
                });
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
        // Check permission
        if (!Auth::user()->hasPermission('products.create')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to create products.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:product_categories,id',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:product_categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'boolean',
            'is_storefront' => 'boolean',
            'variants' => 'required|array|min:1',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'variants.*.variant_label' => 'required|string|max:255',
            'variants.*.sku' => 'nullable|string|max:255',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.base_price' => 'required|numeric|min:0',
            'variants.*.discount_price' => 'nullable|numeric|min:0',
            'variants.*.marketplace_price' => 'nullable|numeric|min:0',
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
                'description' => $validated['description'],
                'category' => $validated['category'] ?? (function() use ($validated) {
                    if (!empty($validated['category_ids'])) {
                        $first = \App\Models\ProductCategory::find($validated['category_ids'][0]);
                        return $first ? $first->name : '';
                    }
                    return '';
                })(),
                'category_id' => $validated['category_id'] ?? (function() use ($validated) {
                    return !empty($validated['category_ids']) ? $validated['category_ids'][0] : null;
                })(),
                'image' => $imagePath,
                'is_active' => $validated['is_active'] ?? true,
                'is_storefront' => $validated['is_storefront'] ?? true,
                'created_by' => Auth::id()
            ]);

            if (!empty($validated['category_ids'])) {
                $product->categories()->sync($validated['category_ids']);
            } elseif (!empty($validated['category_id'])) {
                $product->categories()->sync([$validated['category_id']]);
            }

            if (!empty($validated['tag_ids'])) {
                $product->tags()->sync($validated['tag_ids']);
            }

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

                $prefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $product->name), 0, 6));
                $seq = str_pad($index + 1, 3, '0', STR_PAD_LEFT);
                $rand = strtoupper(Str::random(4));
                $baseSku = $variant['sku'] ?? ($prefix . '-' . $seq . '-' . $rand);
                $skuCandidate = $baseSku;
                while (ProductVariant::where('sku', $skuCandidate)->exists()) {
                    $rand = strtoupper(Str::random(4));
                    $skuCandidate = $prefix . '-' . $seq . '-' . $rand;
                }

                $variantModel = $product->variants()->create([
                    'variant_label' => $variant['variant_label'],
                    'sku' => $skuCandidate,
                    'price' => $variant['price'],
                    'base_price' => $variant['base_price'],
                    'discount_price' => $variant['discount_price'] ?? null,
                    'marketplace_price' => $variant['marketplace_price'] ?? null,
                    'weight' => $variant['weight'] ?? null,
                    'stock' => $variant['stock'],
                    'is_active' => $variant['is_active'] ?? true,
                    'is_storefront' => $variant['is_storefront'] ?? true,
                    'image' => $variantImagePath,
                    'created_by' => Auth::id()
                ]);

                if (($variant['stock'] ?? 0) > 0) {
                    StockMovement::create([
                        'product_variant_id' => $variantModel->id,
                        'type' => StockMovementType::IN,
                        'quantity' => (int) $variant['stock'],
                        'note' => 'initial stock',
                        'created_by' => Auth::id()
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product created successfully',
                'data' => new ProductResource($product->load(['variants', 'createdBy', 'categories']))
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
            'data' => new ProductResource($product->load(['variants', 'createdBy', 'categories', 'tags']))
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        // Check permission
        if (!Auth::user()->hasPermission('products.edit')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to edit products.'
            ], 403);
        }

        if ($request->has('tag_ids') && is_string($request->input('tag_ids'))) {
            $decodedTagIds = json_decode($request->input('tag_ids'), true);
            $request->merge(['tag_ids' => is_array($decodedTagIds) ? $decodedTagIds : []]);
        }

        // Custom validation for variants SKU
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:product_categories,id',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:product_categories,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'boolean',
            'is_storefront' => 'boolean',
            'variants' => 'sometimes|required|array|min:1',
            'variants.*.id' => 'sometimes|required|exists:product_variants,id',
            'variants.*.variant_label' => 'required|string|max:255',
            'variants.*.sku' => 'nullable|string|max:50',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.base_price' => 'required|numeric|min:0',
            'variants.*.discount_price' => 'nullable|numeric|min:0',
            'variants.*.marketplace_price' => 'nullable|numeric|min:0',
            'variants.*.weight' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'required|integer|min:0',
            'variants.*.is_active' => 'boolean',
            'variants.*.is_storefront' => 'boolean',
            'variants.*.image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        // Additional validation for variant SKU uniqueness
        if ($request->has('variants')) {
            foreach ($request->variants as $index => $variant) {
                if (isset($variant['sku']) && $variant['sku'] !== null && $variant['sku'] !== '') {
                    $query = ProductVariant::where('sku', $variant['sku']);
                
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
                'description' => $validated['description'] ?? $product->description,
                'category' => $validated['category'] ?? (function() use ($validated, $product) {
                    if (!empty($validated['category_ids'])) {
                        $first = \App\Models\ProductCategory::find($validated['category_ids'][0]);
                        return $first ? $first->name : $product->category;
                    }
                    return $product->category;
                })(),
                'category_id' => $validated['category_id'] ?? (function() use ($validated, $product) {
                    return !empty($validated['category_ids']) ? $validated['category_ids'][0] : $product->category_id;
                })(),
                'image' => $imagePath,
                'is_active' => $validated['is_active'] ?? $product->is_active,
                'is_storefront' => $validated['is_storefront'] ?? $product->is_storefront,
                'updated_by' => Auth::id()
            ]);

            if (!empty($validated['category_ids'])) {
                $product->categories()->sync($validated['category_ids']);
            } elseif (!empty($validated['category_id'])) {
                $product->categories()->sync([$validated['category_id']]);
            }

            if (array_key_exists('tag_ids', $validated)) {
                $product->tags()->sync($validated['tag_ids'] ?? []);
            }

            if (isset($validated['variants'])) {
                $isOwner = Auth::user()->roles()->where('name', 'owner')->exists();
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
                            'base_price' => $isOwner ? $variant['base_price'] : $variantModel->base_price,
                            'discount_price' => $variant['discount_price'] ?? null,
                            'marketplace_price' => $variant['marketplace_price'] ?? $variantModel->marketplace_price,
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
                        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $product->name), 0, 6));
                        $seq = str_pad($index + 1, 3, '0', STR_PAD_LEFT);
                        $rand = strtoupper(Str::random(4));
                        $baseSku = $variant['sku'] ?? ($prefix . '-' . $seq . '-' . $rand);
                        $skuCandidate = $baseSku;
                        while (ProductVariant::where('sku', $skuCandidate)->exists()) {
                            $rand = strtoupper(Str::random(4));
                            $skuCandidate = $prefix . '-' . $seq . '-' . $rand;
                        }

                        $variantModel = $product->variants()->create([
                            'variant_label' => $variant['variant_label'],
                            'sku' => $skuCandidate,
                            'price' => $variant['price'],
                            'base_price' => $isOwner ? $variant['base_price'] : 0,
                            'discount_price' => $variant['discount_price'] ?? null,
                            'marketplace_price' => $variant['marketplace_price'] ?? null,
                            'weight' => $variant['weight'] ?? null,
                            'stock' => $variant['stock'] ?? 0,
                            'is_active' => $variant['is_active'] ?? true,
                            'is_storefront' => $variant['is_storefront'] ?? true,
                            'image' => $variantImagePath,
                            'created_by' => Auth::id()
                        ]);

                        if ((int)($variant['stock'] ?? 0) > 0) {
                            StockMovement::create([
                                'product_variant_id' => $variantModel->id,
                                'type' => StockMovementType::IN,
                                'quantity' => (int) $variant['stock'],
                                'note' => 'initial stock',
                                'created_by' => Auth::id()
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Product updated successfully',
                'data' => new ProductResource($product->load(['variants', 'createdBy', 'categories', 'tags']))
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function import(Request $request): JsonResponse
    {
        // Check permission
        if (!Auth::user()->hasPermission('products.import')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have permission to import products.'
            ], 403);
        }

        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimetypes:application/zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel|max:10240'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $userId = Auth::id();

            $fileName = 'products_' . time() . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('temp', $fileName, 'local');

            $jobId = uniqid('product_import_', true);

            ImportProductsJob::dispatch($filePath, $userId, $jobId);

            cache()->put("product_import_job_{$jobId}", [
                'id' => $jobId,
                'status' => 'queued',
                'message' => 'Import job has been queued for processing',
                'created_at' => now()->toISOString()
            ], now()->addHours(24));

            $activeJobIds = cache()->get('active_product_import_jobs', []);
            $activeJobIds[] = $jobId;
            cache()->put('active_product_import_jobs', $activeJobIds, now()->addHours(24));

            return response()->json([
                'success' => true,
                'message' => 'Import job has been queued for processing',
                'data' => [
                    'job_id' => $jobId,
                    'status' => 'queued'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Product import failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Import failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function importStatus(string $jobId): JsonResponse
    {
        try {
            $status = cache()->get("product_import_job_{$jobId}");

            if (!$status) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found or expired'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $status
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get product import status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get import status'
            ], 500);
        }
    }

    public function activeImports(Request $request): JsonResponse
    {
        try {
            $activeImports = [];
            $activeJobIds = cache()->get('active_product_import_jobs', []);

            foreach ($activeJobIds as $jobId) {
                $status = cache()->get("product_import_job_{$jobId}");
                if ($status && isset($status['status']) && in_array($status['status'], ['queued', 'processing'])) {
                    $activeImports[] = $status;
                } else {
                    $activeJobIds = array_filter($activeJobIds, function($id) use ($jobId) {
                        return $id !== $jobId;
                    });
                    cache()->put('active_product_import_jobs', array_values($activeJobIds), now()->addHours(24));
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'active_imports' => $activeImports,
                    'count' => count($activeImports)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get active product imports: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get active imports',
                'data' => [
                    'active_imports' => [],
                    'count' => 0
                ]
            ], 500);
        }
    }

    public function importTemplate()
    {
        try {
            $path = base_path('resources/import_templates/product_import_template.xlsx');
            if (!file_exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template file not found'
                ], 404);
            }

            return response()->download($path, 'product_import_template.xlsx');
        } catch (\Exception $e) {
            Log::error('Failed to download product import template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to download template'
            ], 500);
        }
    }

    public function destroy(Product $product): JsonResponse
    {
        // Check permission
        if (!Auth::user()->hasPermission('products.delete')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to delete products.'
            ], 403);
        }

        try {
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

    public function syncTags(Request $request, Product $product): JsonResponse
    {
        if (!Auth::user()->hasPermission('products.edit')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to edit products.'
            ], 403);
        }

        $validated = $request->validate([
            'tag_ids' => 'required|array',
            'tag_ids.*' => 'exists:tags,id',
        ]);

        $product->tags()->sync($validated['tag_ids']);

        return response()->json([
            'status' => 'success',
            'message' => 'Tags updated successfully',
            'data' => new ProductResource($product->load(['tags']))
        ]);
    }
}
