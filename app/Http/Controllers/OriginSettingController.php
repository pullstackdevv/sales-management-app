<?php

namespace App\Http\Controllers;

use App\Models\OriginSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OriginSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $origins = OriginSetting::orderBy('store_name')->get();
        return response()->json([
            'success' => true,
            'data' => $origins
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
            'store_name' => 'required|string|max:255',
            'origin_address' => 'required|string',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $origin = OriginSetting::create($validated);
        return response()->json([
            'success' => true,
            'data' => $origin,
            'message' => 'Origin setting created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(OriginSetting $originSetting): JsonResponse
    {
        return response()->json($originSetting);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(OriginSetting $originSetting)
    {
        // Not needed for API
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, OriginSetting $originSetting): JsonResponse
    {
        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'origin_address' => 'required|string',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $originSetting->update($validated);
        return response()->json([
            'success' => true,
            'data' => $originSetting,
            'message' => 'Origin setting updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OriginSetting $originSetting): JsonResponse
    {
        $originSetting->delete();
        return response()->json(['message' => 'Origin setting deleted successfully']);
    }
}
