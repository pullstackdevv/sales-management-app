<?php

namespace App\Http\Controllers;

use App\Models\PaymentBank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentBankController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $banks = PaymentBank::with(['createdBy'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('account_number', 'like', "%{$search}%")
                        ->orWhere('account_name', 'like', "%{$search}%");
                });
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $banks
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $bank = PaymentBank::create([
                ...$validated,
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Payment bank created successfully',
                'data' => $bank->load('createdBy')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(PaymentBank $bank): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $bank->load('createdBy')
        ]);
    }

    public function update(Request $request, PaymentBank $bank): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'account_number' => 'sometimes|required|string|max:255',
            'account_name' => 'sometimes|required|string|max:255',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $bank->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Payment bank updated successfully',
                'data' => $bank->fresh()->load('createdBy')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(PaymentBank $bank): JsonResponse
    {
        if ($bank->payments()->exists()) {
            throw ValidationException::withMessages([
                'bank' => ['Cannot delete bank that has payments.']
            ]);
        }

        try {
            DB::beginTransaction();

            $bank->update(['deleted_by' => Auth::id()]);
            $bank->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Payment bank deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleStatus(PaymentBank $bank): JsonResponse
    {
        try {
            DB::beginTransaction();

            $bank->update([
                'is_active' => !$bank->is_active,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Payment bank status updated successfully',
                'data' => $bank->fresh()->load('createdBy')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
} 