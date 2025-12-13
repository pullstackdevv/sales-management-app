<?php

namespace App\Http\Controllers;

use App\Http\Requests\Address\StoreRequest;
use App\Http\Requests\Address\UpdateRequest;
use App\Models\CustomerAddress;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Customer $customer): JsonResponse
    {
        $addresses = $customer->addresses()->orderBy('is_default', 'desc')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $addresses
        ]);
    }

    public function store(StoreRequest $request, Customer $customer): JsonResponse
    {
        // If this is the first address, set it as default
        if ($customer->addresses()->count() === 0) {
            $request->merge(['is_default' => true]);
        }

        // If this address is set as default, unset other defaults
        if ($request->is_default) {
            $customer->addresses()->update(['is_default' => false]);
        }

        $address = $customer->addresses()->create($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Address added successfully',
            'data' => $address
        ]);
    }

    public function update(UpdateRequest $request, Customer $customer, CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== $customer->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid address'
            ], 422);
        }

        // If this address is set as default, unset other defaults
        if ($request->is_default) {
            $customer->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        $address->update($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Address updated successfully',
            'data' => $address
        ]);
    }

    public function destroy(Customer $customer, CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== $customer->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid address'
            ], 422);
        }

        if ($address->is_default && $customer->addresses()->count() > 1) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete default address. Set another address as default first'
            ], 422);
        }

        if ($address->orders()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete address that has been used in orders'
            ], 422);
        }

        $address->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Address deleted successfully'
        ]);
    }

    public function setDefault(Customer $customer, CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== $customer->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid address'
            ], 422);
        }

        $customer->addresses()->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return response()->json([
            'status' => 'success',
            'message' => 'Default address updated successfully',
            'data' => $address
        ]);
    }
}