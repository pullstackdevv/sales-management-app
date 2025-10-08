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
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'nullable|string|email|max:255|unique:customers,email,NULL,id,deleted_at,NULL',
                'phone' => 'required|string|max:20',
                'line_id' => 'nullable|string|max:255',
                'other_contact' => 'nullable|string|max:255',
                'category' => 'required|string|max:255',
                'addresses' => 'required|array|min:1',
                'addresses.*.label' => 'required|string|max:255',
                'addresses.*.recipient_name' => 'required|string|max:255',
                'addresses.*.recipient_phone' => 'required|string|max:20',
                'addresses.*.province' => 'required|string|max:255',
                'addresses.*.city' => 'required|string|max:255',
                'addresses.*.district' => 'required|string|max:255',
                'addresses.*.postal_code' => 'required|string|max:10',
                'addresses.*.address_detail' => 'required|string',
                'addresses.*.is_default' => 'boolean'
            ], [
                'addresses.required' => 'Alamat pengiriman wajib diisi',
                'addresses.*.label.required' => 'Label alamat wajib diisi',
                'addresses.*.recipient_name.required' => 'Nama penerima wajib diisi',
                'addresses.*.recipient_phone.required' => 'Nomor telepon penerima wajib diisi',
                'addresses.*.province.required' => 'Provinsi wajib diisi',
                'addresses.*.city.required' => 'Kota/Kabupaten wajib diisi',
                'addresses.*.district.required' => 'Kecamatan wajib diisi',
                'addresses.*.postal_code.required' => 'Kode pos wajib diisi',
                'addresses.*.address_detail.required' => 'Alamat lengkap wajib diisi',
                'email.unique' => 'Email sudah terdaftar, gunakan email lain'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation Error',
                'errors' => $e->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create customer
            $customerData = collect($validated)->except('addresses')->toArray();
            $customerData['created_by'] = Auth::id() ?? null; // Allow null for public API
            $customer = Customer::create($customerData);

            // Create addresses if provided
            if (isset($validated['addresses']) && !empty($validated['addresses'])) {
                foreach ($validated['addresses'] as $index => $addressData) {
                    $customer->addresses()->create([
                        'label' => $addressData['label'],
                        'recipient_name' => $addressData['recipient_name'],
                        'phone' => $addressData['recipient_phone'],
                        'province' => $addressData['province'],
                        'city' => $addressData['city'],
                        'district' => $addressData['district'],
                        'postal_code' => $addressData['postal_code'],
                        'address_detail' => $addressData['address_detail'],
                        'is_default' => $addressData['is_default'] ?? ($index === 0) // First address is default if not specified
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Customer created successfully',
                'data' => $customer->fresh()->load(['addresses', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'status' => 'error',
                'message' => 'Server Error: ' . $e->getMessage(),
                'errors' => [$e->getMessage()]
            ], 500);
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
            'addresses' => 'sometimes|nullable|array',
            'addresses.*.id' => 'sometimes|nullable|integer|exists:customer_addresses,id',
            'addresses.*.label' => 'required_with:addresses|string|max:255',
            'addresses.*.recipient_name' => 'required_with:addresses|string|max:255',
            'addresses.*.recipient_phone' => 'required_with:addresses|string|max:20',
            'addresses.*.province' => 'required_with:addresses|string|max:255',
            'addresses.*.city' => 'required_with:addresses|string|max:255',
            'addresses.*.district' => 'required_with:addresses|string|max:255',
            'addresses.*.postal_code' => 'required_with:addresses|string|max:10',
            'addresses.*.address_detail' => 'required_with:addresses|string',
            'addresses.*.is_default' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            // Update customer basic info
            $customerData = collect($validated)->except('addresses')->toArray();
            $customerData['updated_by'] = Auth::id();
            $customer->update($customerData);

            // Update addresses if provided
            if (isset($validated['addresses']) && !empty($validated['addresses'])) {
                // Delete existing addresses
                $customer->addresses()->delete();
                
                // Create new addresses
                foreach ($validated['addresses'] as $index => $addressData) {
                    $customer->addresses()->create([
                        'label' => $addressData['label'],
                        'recipient_name' => $addressData['recipient_name'],
                        'phone' => $addressData['recipient_phone'],
                        'province' => $addressData['province'],
                        'city' => $addressData['city'],
                        'district' => $addressData['district'],
                        'postal_code' => $addressData['postal_code'],
                        'address_detail' => $addressData['address_detail'],
                        'is_default' => $addressData['is_default'] ?? ($index === 0) // First address is default if not specified
                    ]);
                }
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

    /**
     * Get customer addresses
     */
    public function addresses(Customer $customer): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $customer->addresses()->orderBy('is_default', 'desc')->orderBy('created_at', 'asc')->get()
        ]);
    }

    /**
     * Delete specific customer address
     */
    public function deleteAddress(Customer $customer, $addressId): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Find the address
            $address = $customer->addresses()->findOrFail($addressId);
            
            // Check if this is the only address
            $addressCount = $customer->addresses()->count();
            if ($addressCount <= 1) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer harus memiliki minimal satu alamat'
                ], 400);
            }

            // If deleting default address, set another address as default
            if ($address->is_default) {
                $newDefaultAddress = $customer->addresses()
                    ->where('id', '!=', $addressId)
                    ->first();
                
                if ($newDefaultAddress) {
                    $newDefaultAddress->update(['is_default' => true]);
                }
            }

            // Delete the address
            $address->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Alamat berhasil dihapus',
                'data' => $customer->addresses()->orderBy('is_default', 'desc')->orderBy('created_at', 'asc')->get()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Alamat tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat menghapus alamat'
            ], 500);
        }
    }
}