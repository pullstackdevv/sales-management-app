<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customers = Customer::with(['addresses', 'orders' => function($q) {
                $q->select('id', 'customer_id', 'total_amount', 'status', 'created_at')
                    ->latest()
                    ->limit(5);
            }])
            ->withCount(['orders', 'addresses'])
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $customers
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:customers',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|array',
            'address.name' => 'required_with:address|string|max:255',
            'address.phone' => 'required_with:address|string|max:20',
            'address.province' => 'required_with:address|string|max:255',
            'address.city' => 'required_with:address|string|max:255',
            'address.district' => 'required_with:address|string|max:255',
            'address.postal_code' => 'required_with:address|string|max:10',
            'address.address' => 'required_with:address|string',
            'address.is_default' => 'boolean',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $customer = Customer::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => Auth::id()
            ]);

            // Create default address if provided
            if (isset($validated['address'])) {
                $customer->addresses()->create([
                    ...$validated['address'],
                    'is_default' => true,
                    'created_by' => Auth::id()
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Customer created successfully',
                'data' => $customer->load(['addresses', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $customer->load([
                'addresses',
                'orders' => function($q) {
                    $q->with(['items', 'payments', 'shipping'])
                        ->latest();
                }
            ])
        ]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:customers,email,' . $customer->id,
            'phone' => 'sometimes|required|string|max:20',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $customer->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Customer updated successfully',
                'data' => $customer->fresh()->load(['addresses', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Customer $customer): JsonResponse
    {
        if ($customer->orders()->exists()) {
            throw ValidationException::withMessages([
                'customer' => ['Cannot delete customer that has orders.']
            ]);
        }

        try {
            DB::beginTransaction();

            // Delete all addresses
            $customer->addresses()->delete();
            
            // Delete the customer
            $customer->update(['deleted_by' => Auth::id()]);
            $customer->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Customer deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleStatus(Customer $customer): JsonResponse
    {
        try {
            DB::beginTransaction();

            $customer->update([
                'is_active' => !$customer->is_active,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Customer status updated successfully',
                'data' => $customer->fresh()->load(['addresses', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
} 