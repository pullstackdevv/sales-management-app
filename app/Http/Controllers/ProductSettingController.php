<?php

namespace App\Http\Controllers;

use App\Models\ProductSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ProductSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $settings = ProductSetting::orderBy('setting_name')->get();
        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Not needed for API
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'setting_name' => 'required|string|max:255|unique:product_settings',
            'setting_value' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $setting = ProductSetting::create($validated);
        return response()->json([
            'success' => true,
            'data' => $setting,
            'message' => 'Product setting created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ProductSetting $productSetting): JsonResponse
    {
        return response()->json($productSetting);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductSetting $productSetting)
    {
        // Not needed for API
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProductSetting $productSetting): JsonResponse
    {
        $validated = $request->validate([
            'setting_name' => ['required', 'string', 'max:255', Rule::unique('product_settings')->ignore($productSetting->id)],
            'setting_value' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $productSetting->update($validated);
        return response()->json([
            'success' => true,
            'data' => $productSetting,
            'message' => 'Product setting updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductSetting $productSetting): JsonResponse
    {
        $productSetting->delete();
        return response()->json(['message' => 'Product setting deleted successfully']);
    }
}
