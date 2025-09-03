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
        // $customers = Customer::with(['addresses', 'orders' => function($q) {
        //         $q->select('id', 'customer_id', 'total_amount', 'status', 'created_at')
        //             ->latest()
        //             ->limit(5);
        //     }])
        //     ->withCount(['orders', 'addresses'])
        //     ->when($request->search, function($query, $search) {
        //         $query->where('name', 'like', "%{$search}%")
        //             ->orWhere('phone', 'like', "%{$search}%")
        //             ->orWhere('email', 'like', "%{$search}%");
        //     })
            $customers = Customer::with(['addresses'])
            ->withCount(['addresses'])
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
            'email' => 'required|string|email|max:255|unique:customers,email,NULL,id,deleted_at,NULL',
            'phone' => 'required|string|max:20',
            'line_id' => 'nullable|string|max:255',
            'other_contact' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'address' => 'nullable|array',
            'address.label' => 'required_with:address|string|max:255',
            'address.name' => 'required_with:address|string|max:255',
            'address.phone' => 'required_with:address|string|max:20',
            'address.province' => 'required_with:address|string|max:255',
            'address.city' => 'required_with:address|string|max:255',
            'address.district' => 'required_with:address|string|max:255',
            'address.postal_code' => 'required_with:address|string|max:10',
            'address.address' => 'required_with:address|string',
            'address.address_detail' => 'required_with:address|string',
            'address.recipient_name' => 'required_with:address|string|max:255',
            'address.is_default' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $customer = Customer::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'line_id' => $validated['line_id'] ?? null,
                'other_contact' => $validated['other_contact'] ?? null,
                'category' => $validated['category'] ?? null,
                'created_by' => Auth::id()
            ]);

            // Create default address if provided
            if (isset($validated['address'])) {
                $customer->addresses()->create([
                    ...$validated['address'],
                    'is_default' => true
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

    public function edit(Customer $customer): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $customer->load('addresses')
        ]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|nullable|string|email|max:255|unique:customers,email,' . $customer->id . ',id,deleted_at,NULL',
            'phone' => 'sometimes|required|string|max:20',
            'line_id' => 'sometimes|nullable|string|max:255',
            'other_contact' => 'sometimes|nullable|string|max:255',
            'category' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|nullable|array',
            'address.label' => 'required_with:address|string|max:255',
            'address.name' => 'required_with:address|string|max:255',
            'address.phone' => 'required_with:address|string|max:20',
            'address.province' => 'required_with:address|string|max:255',
            'address.city' => 'required_with:address|string|max:255',
            'address.district' => 'required_with:address|string|max:255',
            'address.postal_code' => 'required_with:address|string|max:10',
            'address.address' => 'required_with:address|string',
            'address.address_detail' => 'required_with:address|string',
            'address.recipient_name' => 'required_with:address|string|max:255',
            'address.is_default' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            // Update customer basic info
            $customerData = collect($validated)->except('address')->toArray();
            $customerData['updated_by'] = Auth::id();
            $customer->update($customerData);

            // Update or create address if provided
            if (isset($validated['address'])) {
                // Delete existing addresses and create new one
                $customer->addresses()->delete();
                $customer->addresses()->create([
                    ...$validated['address'],
                    'is_default' => true
                ]);
            }

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