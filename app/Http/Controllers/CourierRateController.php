<?php

namespace App\Http\Controllers;

use App\Models\Courier;
use App\Models\CourierRate;
use App\Http\Requests\CourierRate\StoreRequest;
use App\Http\Requests\CourierRate\UpdateRequest;
use Illuminate\Http\Request;

class CourierRateController extends Controller
{
    public function index(Request $request)
    {
        $query = CourierRate::with('courier')
            ->when($request->courier_id, function($q) use ($request) {
                return $q->where('courier_id', $request->courier_id);
            })
            ->when($request->origin_city, function($q) use ($request) {
                return $q->where('origin_city', 'like', "%{$request->origin_city}%");
            })
            ->when($request->destination_city, function($q) use ($request) {
                return $q->where('destination_city', 'like', "%{$request->destination_city}%");
            });

        $rates = $query->latest()->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $rates
        ]);
    }

    public function store(StoreRequest $request)
    {
        // Check if rate already exists for the same route
        $exists = CourierRate::where('courier_id', $request->courier_id)
            ->where('origin_city', $request->origin_city)
            ->where('destination_city', $request->destination_city)
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rate already exists for this route'
            ], 422);
        }

        $rate = CourierRate::create($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Courier rate created successfully',
            'data' => $rate->load('courier')
        ]);
    }

    public function show(CourierRate $rate)
    {
        return response()->json([
            'status' => 'success',
            'data' => $rate->load('courier')
        ]);
    }

    public function update(UpdateRequest $request, CourierRate $rate)
    {
        // Check if rate already exists for the same route (excluding current rate)
        $exists = CourierRate::where('courier_id', $request->courier_id)
            ->where('origin_city', $request->origin_city)
            ->where('destination_city', $request->destination_city)
            ->where('id', '!=', $rate->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rate already exists for this route'
            ], 422);
        }

        $rate->update($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Courier rate updated successfully',
            'data' => $rate->load('courier')
        ]);
    }

    public function destroy(CourierRate $rate)
    {
        if ($rate->shippings()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete rate that has been used in shipping'
            ], 422);
        }

        $rate->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Courier rate deleted successfully'
        ]);
    }
} 