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
        if (Auth::check() && !Auth::user()->hasPermission('customers.create')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to create customers.'
            ], 403);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'nullable|string|email|max:255|unique:customers,email,NULL,id,deleted_at,NULL',
                'phone' => 'required|string|max:20|unique:customers,phone,NULL,id,deleted_at,NULL',
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
                'addresses.*.postal_code' => 'nullable|string|regex:/^\d{5}$/',
                'addresses.*.address_detail' => 'required|string',
                'addresses.*.is_default' => 'boolean',
                'addresses.*.is_dropship' => 'boolean'
            ], [
                'addresses.required' => 'Alamat pengiriman wajib diisi',
                'addresses.*.label.required' => 'Label alamat wajib diisi',
                'addresses.*.recipient_name.required' => 'Nama penerima wajib diisi',
                'addresses.*.recipient_phone.required' => 'Nomor telepon penerima wajib diisi',
                'addresses.*.province.required' => 'Provinsi wajib diisi',
                'addresses.*.city.required' => 'Kota/Kabupaten wajib diisi',
                'addresses.*.district.required' => 'Kecamatan wajib diisi',
                'addresses.*.postal_code.regex' => 'Kode pos harus 5 digit angka',
                'addresses.*.address_detail.required' => 'Alamat lengkap wajib diisi',
                'email.unique' => 'Email sudah terdaftar, gunakan email lain',
                'phone.unique' => 'Nomor telepon sudah terdaftar, gunakan nomor lain'
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
                        'postal_code' => $addressData['postal_code'] ?? null,
                        'address_detail' => $addressData['address_detail'],
                        'is_default' => $addressData['is_default'] ?? ($index === 0),
                        'is_dropship' => $addressData['is_dropship'] ?? false
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
        // if (!Auth::check()) {
        //     return response()->json([
        //         'status' => 'error',
        //         'message' => 'Unauthorized'
        //     ], 401);
        // }
        if (Auth::check() && !Auth::user()->hasPermission('customers.create')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to edit customers.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|nullable|string|email|max:255|unique:customers,email,' . $customer->id . ',id,deleted_at,NULL',
            'phone' => 'sometimes|required|string|max:20|unique:customers,phone,' . $customer->id . ',id,deleted_at,NULL',
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
            'addresses.*.postal_code' => 'nullable|string|regex:/^\d{5}$/',
            'addresses.*.address_detail' => 'required_with:addresses|string',
            'addresses.*.is_default' => 'boolean',
            'addresses.*.is_dropship' => 'boolean'
        ], [
            'phone.unique' => 'Nomor telepon sudah terdaftar, gunakan nomor lain'
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
                        'postal_code' => $addressData['postal_code'] ?? null,
                        'address_detail' => $addressData['address_detail'],
                        'is_default' => $addressData['is_default'] ?? ($index === 0),
                        'is_dropship' => $addressData['is_dropship'] ?? false
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
        if (!Auth::check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 401);
        }
        if (!Auth::user()->hasPermission('customers.delete')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to delete customers.'
            ], 403);
        }

        // Allow soft delete even if customer has orders to preserve relations

        try {
            DB::beginTransaction();

            // Soft delete all addresses to keep order relations intact
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
        if (!Auth::check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 401);
        }
        if (!Auth::user()->hasPermission('customers.toggle_status')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to toggle customer status.'
            ], 403);
        }

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

    /**
     * Guest lookup - search customers by name for checkout
     * Returns masked data (phone/email partially hidden) for privacy
     * User must verify with full phone/email to access full data
     */
    public function guestLookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => 'required|string|min:2',
        ]);

        $search = $validated['search'];

        $customers = Customer::where(function($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
            })
            ->limit(10)
            ->get(['id', 'name', 'phone', 'email']);

        // Return customers with masked phone/email for privacy
        $maskedCustomers = $customers->map(function($customer) {
            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $this->maskPhone($customer->phone),
                'email' => $this->maskEmail($customer->email),
                'has_email' => !empty($customer->email),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $maskedCustomers
        ]);
    }

    /**
     * Guest verify - verify customer ownership and return full data with addresses
     */
    public function guestVerify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer',
            'verification_type' => 'required|in:phone,email',
            'verification_value' => 'required|string',
        ]);

        $customer = Customer::with(['addresses'])->find($validated['customer_id']);

        if (!$customer) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer tidak ditemukan'
            ], 404);
        }

        // Verify based on type
        $isVerified = false;
        if ($validated['verification_type'] === 'phone') {
            $normalizedCustomerPhone = preg_replace('/[^0-9]/', '', $customer->phone);
            $normalizedInputPhone = preg_replace('/[^0-9]/', '', $validated['verification_value']);
            // Also handle +62 vs 0 prefix
            $normalizedCustomerPhone = preg_replace('/^62/', '0', $normalizedCustomerPhone);
            $normalizedInputPhone = preg_replace('/^62/', '0', $normalizedInputPhone);
            $isVerified = $normalizedCustomerPhone === $normalizedInputPhone;
        } else {
            $isVerified = strtolower($customer->email) === strtolower($validated['verification_value']);
        }

        if (!$isVerified) {
            return response()->json([
                'status' => 'error',
                'message' => $validated['verification_type'] === 'phone' 
                    ? 'Nomor HP tidak sesuai dengan data customer'
                    : 'Email tidak sesuai dengan data customer'
            ], 403);
        }

        // Verification successful - return full customer data with addresses
        return response()->json([
            'status' => 'success',
            'data' => $customer
        ]);
    }

    /**
     * Mask phone number for privacy (show first 4 and last 2 digits)
     */
    private function maskPhone(?string $phone): ?string
    {
        if (!$phone) return null;
        $clean = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($clean) <= 6) return $phone;
        return substr($clean, 0, 4) . str_repeat('*', strlen($clean) - 6) . substr($clean, -2);
    }

    /**
     * Mask email for privacy (show first 2 chars and domain)
     */
    private function maskEmail(?string $email): ?string
    {
        if (!$email) return null;
        $parts = explode('@', $email);
        if (count($parts) !== 2) return $email;
        $name = $parts[0];
        $domain = $parts[1];
        if (strlen($name) <= 2) return $email;
        return substr($name, 0, 2) . str_repeat('*', strlen($name) - 2) . '@' . $domain;
    }

    /**
     * Guest store - create new customer (for checkout)
     * Public endpoint for guest registration during checkout
     */
    public function guestStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'category' => 'nullable|string|max:50',
            'line_id' => 'nullable|string|max:100',
            'other_contact' => 'nullable|string|max:255',
            'addresses' => 'nullable|array',
            'addresses.*.label' => 'required_with:addresses|string|max:50',
            'addresses.*.recipient_name' => 'required_with:addresses|string|max:255',
            'addresses.*.recipient_phone' => 'required_with:addresses|string|max:20',
            'addresses.*.address_detail' => 'required_with:addresses|string',
            'addresses.*.city' => 'required_with:addresses|string|max:100',
            'addresses.*.province' => 'required_with:addresses|string|max:100',
            'addresses.*.postal_code' => 'nullable|string|max:10',
            'addresses.*.district' => 'nullable|string|max:100',
            'addresses.*.is_default' => 'nullable|boolean',
        ]);

        try {
            // Check if customer already exists
            $existingCustomer = Customer::where('phone', $validated['phone'])
                ->orWhere(function($query) use ($validated) {
                    if (!empty($validated['email'])) {
                        $query->where('email', $validated['email']);
                    }
                })
                ->first();

            if ($existingCustomer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer dengan email atau nomor HP ini sudah terdaftar'
                ], 422);
            }

            $customer = Customer::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'],
                'category' => $validated['category'] ?? 'Pelanggan',
                'line_id' => $validated['line_id'] ?? null,
                'other_contact' => $validated['other_contact'] ?? null,
                'is_active' => true,
            ]);

            // Create addresses if provided
            if (!empty($validated['addresses'])) {
                foreach ($validated['addresses'] as $index => $addressData) {
                    $customer->addresses()->create([
                        'label' => $addressData['label'],
                        'recipient_name' => $addressData['recipient_name'],
                        'recipient_phone' => $addressData['recipient_phone'],
                        'address_detail' => $addressData['address_detail'],
                        'city' => $addressData['city'],
                        'province' => $addressData['province'],
                        'postal_code' => $addressData['postal_code'] ?? null,
                        'district' => $addressData['district'] ?? null,
                        'is_default' => $index === 0, // First address is default
                    ]);
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $customer->load('addresses'),
                'message' => 'Customer berhasil dibuat'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat customer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guest update - update customer's own data (for checkout)
     * Validates ownership via email/phone before allowing update
     */
    public function guestUpdate(Request $request, $customerId): JsonResponse
    {
        $validated = $request->validate([
            'verify_email' => 'required_without:verify_phone|nullable|email',
            'verify_phone' => 'required_without:verify_email|nullable|string',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'addresses' => 'nullable|array',
            'addresses.*.id' => 'nullable|integer',
            'addresses.*.label' => 'required_with:addresses|string|max:50',
            'addresses.*.recipient_name' => 'required_with:addresses|string|max:255',
            'addresses.*.recipient_phone' => 'required_with:addresses|string|max:20',
            'addresses.*.address_detail' => 'required_with:addresses|string',
            'addresses.*.city' => 'required_with:addresses|string|max:100',
            'addresses.*.province' => 'required_with:addresses|string|max:100',
            'addresses.*.postal_code' => 'nullable|string|max:10',
            'addresses.*.district' => 'nullable|string|max:100',
            'addresses.*.is_default' => 'nullable|boolean',
        ]);

        try {
            // Find customer and verify ownership
            $customer = Customer::find($customerId);
            
            if (!$customer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer tidak ditemukan'
                ], 404);
            }

            // Verify ownership
            $isOwner = false;
            if (!empty($validated['verify_email']) && $customer->email === $validated['verify_email']) {
                $isOwner = true;
            }
            if (!empty($validated['verify_phone'])) {
                $normalizedCustomerPhone = preg_replace('/[^0-9]/', '', $customer->phone);
                $normalizedVerifyPhone = preg_replace('/[^0-9]/', '', $validated['verify_phone']);
                if ($normalizedCustomerPhone === $normalizedVerifyPhone) {
                    $isOwner = true;
                }
            }

            if (!$isOwner) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Verifikasi gagal - email atau nomor HP tidak sesuai'
                ], 403);
            }

            // Update customer basic info if provided
            $updateData = array_filter([
                'name' => $validated['name'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
            ], fn($v) => $v !== null);

            if (!empty($updateData)) {
                $customer->update($updateData);
            }

            // Update addresses if provided
            if (isset($validated['addresses'])) {
                foreach ($validated['addresses'] as $addressData) {
                    if (!empty($addressData['id'])) {
                        // Update existing address
                        $address = $customer->addresses()->find($addressData['id']);
                        if ($address) {
                            $address->update([
                                'label' => $addressData['label'],
                                'recipient_name' => $addressData['recipient_name'],
                                'recipient_phone' => $addressData['recipient_phone'],
                                'address_detail' => $addressData['address_detail'],
                                'city' => $addressData['city'],
                                'province' => $addressData['province'],
                                'postal_code' => $addressData['postal_code'] ?? null,
                                'district' => $addressData['district'] ?? null,
                                'is_default' => $addressData['is_default'] ?? false,
                            ]);
                        }
                    } else {
                        // Create new address
                        $customer->addresses()->create([
                            'label' => $addressData['label'],
                            'recipient_name' => $addressData['recipient_name'],
                            'recipient_phone' => $addressData['recipient_phone'],
                            'address_detail' => $addressData['address_detail'],
                            'city' => $addressData['city'],
                            'province' => $addressData['province'],
                            'postal_code' => $addressData['postal_code'] ?? null,
                            'district' => $addressData['district'] ?? null,
                            'is_default' => $addressData['is_default'] ?? false,
                        ]);
                    }
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $customer->fresh()->load('addresses'),
                'message' => 'Customer berhasil diupdate'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal update customer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guest delete address - delete customer's own address (for checkout)
     * Validates ownership via email/phone before allowing delete
     */
    public function guestDeleteAddress(Request $request, $customerId, $addressId): JsonResponse
    {
        $validated = $request->validate([
            'verify_email' => 'required_without:verify_phone|nullable|email',
            'verify_phone' => 'required_without:verify_email|nullable|string',
        ]);

        try {
            $customer = Customer::find($customerId);
            
            if (!$customer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer tidak ditemukan'
                ], 404);
            }

            // Verify ownership
            $isOwner = false;
            if (!empty($validated['verify_email']) && $customer->email === $validated['verify_email']) {
                $isOwner = true;
            }
            if (!empty($validated['verify_phone'])) {
                $normalizedCustomerPhone = preg_replace('/[^0-9]/', '', $customer->phone);
                $normalizedVerifyPhone = preg_replace('/[^0-9]/', '', $validated['verify_phone']);
                if ($normalizedCustomerPhone === $normalizedVerifyPhone) {
                    $isOwner = true;
                }
            }

            if (!$isOwner) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Verifikasi gagal - email atau nomor HP tidak sesuai'
                ], 403);
            }

            // Find and delete the address
            $address = $customer->addresses()->find($addressId);
            
            if (!$address) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Alamat tidak ditemukan'
                ], 404);
            }

            $address->delete();

            return response()->json([
                'status' => 'success',
                'data' => $customer->fresh()->addresses,
                'message' => 'Alamat berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus alamat: ' . $e->getMessage()
            ], 500);
        }
    }
}
