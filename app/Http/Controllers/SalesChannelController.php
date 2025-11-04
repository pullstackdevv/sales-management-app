<?php

namespace App\Http\Controllers;

use App\Models\SalesChannel;
use Illuminate\Http\Request;

class SalesChannelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SalesChannel::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('platform', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $salesChannels = $query->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $salesChannels
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:sales_channels,code',
            'platform' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean'
        ]);

        $salesChannel = SalesChannel::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Sales channel created successfully',
            'data' => $salesChannel
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(SalesChannel $salesChannel)
    {
        $salesChannel->load(['orders' => function ($query) {
            $query->latest()->take(10);
        }]);

        return response()->json([
            'status' => 'success',
            'data' => $salesChannel
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SalesChannel $salesChannel)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:sales_channels,code,' . $salesChannel->id,
            'platform' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean'
        ]);

        $salesChannel->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Sales channel updated successfully',
            'data' => $salesChannel->fresh()
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SalesChannel $salesChannel)
    {
        // Check if sales channel has orders
        if ($salesChannel->orders()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete sales channel that has orders'
            ], 422);
        }

        $salesChannel->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Sales channel deleted successfully'
        ]);
    }

    /**
     * Toggle the active status of the sales channel.
     */
    public function toggleStatus(SalesChannel $salesChannel)
    {
        $salesChannel->update([
            'is_active' => !$salesChannel->is_active
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Sales channel status updated successfully',
            'data' => $salesChannel->fresh()
        ]);
    }

    /**
     * Get sales channels for API/select options.
     */
    public function getOptions()
    {
        $salesChannels = SalesChannel::active()
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return response()->json($salesChannels);
    }
}