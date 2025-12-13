<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoucherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vouchers = Voucher::with(['creator'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'active') {
                    $query->active();
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                } elseif ($status === 'expired') {
                    $query->where('end_date', '<', now());
                }
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $vouchers
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'minimum_amount' => 'nullable|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean'
        ]);

        // Validate percentage value
        if ($validated['type'] === 'percentage' && $validated['value'] > 100) {
            throw ValidationException::withMessages([
                'value' => ['Percentage value cannot be greater than 100.']
            ]);
        }

        try {
            DB::beginTransaction();

            $voucher = Voucher::create([
                ...$validated,
                'used_count' => 0,
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Voucher created successfully',
                'data' => $voucher->load('creator')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Voucher $voucher): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $voucher->load(['creator', 'orders' => function ($query) {
                $query->with(['customer', 'items'])->latest()->limit(10);
            }])
        ]);
    }

    public function update(Request $request, Voucher $voucher): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50|unique:vouchers,code,' . $voucher->id,
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:500',
            'type' => 'sometimes|required|in:percentage,fixed',
            'value' => 'sometimes|required|numeric|min:0',
            'minimum_amount' => 'nullable|numeric|min:0',
            'maximum_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'is_active' => 'boolean'
        ]);

        // Validate percentage value
        if (isset($validated['type']) && $validated['type'] === 'percentage' && isset($validated['value']) && $validated['value'] > 100) {
            throw ValidationException::withMessages([
                'value' => ['Percentage value cannot be greater than 100.']
            ]);
        }

        try {
            DB::beginTransaction();

            $voucher->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Voucher updated successfully',
                'data' => $voucher->fresh()->load('creator')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Voucher $voucher): JsonResponse
    {
        if ($voucher->orders()->exists()) {
            throw ValidationException::withMessages([
                'voucher' => ['Cannot delete voucher that has been used in orders.']
            ]);
        }

        try {
            DB::beginTransaction();

            $voucher->update(['deleted_by' => Auth::id()]);
            $voucher->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Voucher deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleStatus(Voucher $voucher): JsonResponse
    {
        try {
            DB::beginTransaction();

            $voucher->update([
                'is_active' => !$voucher->is_active,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Voucher status updated successfully',
                'data' => $voucher->fresh()->load('creator')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function validateVoucher(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'order_amount' => 'required|numeric|min:0'
        ]);

        $voucher = Voucher::where('code', $validated['code'])->first();

        if (!$voucher) {
            return response()->json([
                'status' => 'error',
                'message' => 'Voucher not found'
            ], 404);
        }

        if (!$voucher->canBeUsed($validated['order_amount'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Voucher is not valid or cannot be used for this order'
            ], 422);
        }

        $discount = $voucher->calculateDiscount($validated['order_amount']);

        return response()->json([
            'status' => 'success',
            'data' => [
                'voucher' => $voucher,
                'discount_amount' => $discount,
                'final_amount' => $validated['order_amount'] - $discount
            ]
        ]);
    }

    public function getActiveVouchers(): JsonResponse
    {
        $vouchers = Voucher::available()
            ->select('id', 'code', 'name', 'type', 'value', 'minimum_amount', 'maximum_discount')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $vouchers
        ]);
    }
}