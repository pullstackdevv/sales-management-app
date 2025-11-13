<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $categories = ProductCategory::with(['createdBy', 'updatedBy'])
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->is_active !== null, function($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $categories
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:product_categories,name',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        try {
            $category = ProductCategory::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'slug' => Str::slug($validated['name']),
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => Auth::id()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Product category created successfully',
                'data' => $category->load(['createdBy', 'updatedBy'])
            ], 201);
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(ProductCategory $productCategory): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $productCategory->load(['createdBy', 'updatedBy', 'products'])
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProductCategory $productCategory): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:product_categories,name,' . $productCategory->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        try {
            $productCategory->update([
                'name' => $validated['name'] ?? $productCategory->name,
                'description' => $validated['description'] ?? $productCategory->description,
                'slug' => isset($validated['name']) ? Str::slug($validated['name']) : $productCategory->slug,
                'is_active' => $validated['is_active'] ?? $productCategory->is_active,
                'updated_by' => Auth::id()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Product category updated successfully',
                'data' => $productCategory->fresh()->load(['createdBy', 'updatedBy'])
            ]);
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductCategory $productCategory): JsonResponse
    {
        // Check if category has products
        if ($productCategory->products()->exists()) {
            throw ValidationException::withMessages([
                'category' => ['Cannot delete category that has products.']
            ]);
        }

        try {
            $productCategory->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Product category deleted successfully'
            ]);
        } catch (\Exception $e) {
            throw $e;
        }
    }
}
