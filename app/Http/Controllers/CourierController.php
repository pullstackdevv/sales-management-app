<?php

namespace App\Http\Controllers;

use App\Models\Courier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CourierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $couriers = Courier::with(['createdBy'])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $couriers
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'cost' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $courier = Courier::create([
                ...$validated,
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Courier created successfully',
                'data' => $courier->load('createdBy')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Courier $courier): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $courier->load(['createdBy', 'rates'])
        ]);
    }

    public function update(Request $request, Courier $courier): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:50',
            'cost' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $courier->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Courier updated successfully',
                'data' => $courier->fresh()->load('createdBy')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Courier $courier): JsonResponse
    {
        // Check if courier is used in any shipping
        if ($courier->shippings()->exists()) {
            throw ValidationException::withMessages([
                'courier' => ['Cannot delete courier that is used in shipping.']
            ]);
        }

        try {
            DB::beginTransaction();

            $courier->update(['deleted_by' => Auth::id()]);
            $courier->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Courier deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleStatus(Courier $courier): JsonResponse
    {
        try {
            DB::beginTransaction();

            $courier->update([
                'is_active' => !$courier->is_active,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Courier status updated successfully',
                'data' => $courier->fresh()->load('createdBy')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}