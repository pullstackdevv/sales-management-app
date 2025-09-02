<?php

namespace App\Http\Controllers;

use App\Models\CourierRate;
use App\Models\Courier;
use App\Jobs\ImportCourierRatesJob;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class CourierRateController extends Controller
{
    /**
     * Get courier rates with filters
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Validate request parameters
            $validator = Validator::make($request->all(), [
                'courier_id' => 'nullable|integer|exists:couriers,id',
                'courier_name' => 'nullable|string|max:100',
                'province' => 'nullable|string|max:100',
                'city' => 'nullable|string|max:100',
                'district' => 'nullable|string|max:100',
                'service_type' => 'nullable|string|in:ECO,REG,ONS,SDS,TRC,T15,T25,T60',
                'origin_city' => 'nullable|string|max:100',
                'min_price' => 'nullable|numeric|min:0',
                'max_price' => 'nullable|numeric|min:0',
                'max_days' => 'nullable|integer|min:1',
                'is_available' => 'nullable|boolean',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'sort_by' => 'nullable|string|in:base_price,estimated_days,destination_province,destination_city,service_type',
                'sort_order' => 'nullable|string|in:asc,desc'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Build query
            $query = CourierRate::with('courier')
                ->select('courier_rates.*');

            // Apply filters
            $this->applyFilters($query, $request);

            // Apply sorting
            $sortBy = $request->get('sort_by', 'base_price');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $rates = $query->paginate($perPage);

            // Transform data
            $transformedRates = $rates->getCollection()->map(function ($rate) {
                return $this->transformRate($rate);
            });

            return response()->json([
                'success' => true,
                'message' => 'Courier rates retrieved successfully',
                'data' => [
                    'rates' => $transformedRates,
                    'pagination' => [
                        'current_page' => $rates->currentPage(),
                        'last_page' => $rates->lastPage(),
                        'per_page' => $rates->perPage(),
                        'total' => $rates->total(),
                        'from' => $rates->firstItem(),
                        'to' => $rates->lastItem()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve courier rates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get courier rate by ID
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $rate = CourierRate::with('courier')->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Courier rate retrieved successfully',
                'data' => $this->transformRate($rate)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Courier rate not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get available destinations
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function destinations(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'courier_id' => 'nullable|integer|exists:couriers,id',
                'province' => 'nullable|string|max:100',
                'city' => 'nullable|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = CourierRate::select(
                'destination_province',
                'destination_city',
                'destination_district'
            )->distinct();

            if ($request->has('courier_id')) {
                $query->where('courier_id', $request->courier_id);
            }

            if ($request->has('province')) {
                $query->where('destination_province', 'like', '%' . $request->province . '%');
            }

            if ($request->has('city')) {
                $query->where('destination_city', 'like', '%' . $request->city . '%');
            }

            $destinations = $query->orderBy('destination_province')
                ->orderBy('destination_city')
                ->orderBy('destination_district')
                ->get()
                ->groupBy('destination_province')
                ->map(function ($provinces) {
                    return $provinces->groupBy('destination_city')
                        ->map(function ($cities) {
                            return $cities->pluck('destination_district')->toArray();
                        });
                });

            return response()->json([
                'success' => true,
                'message' => 'Destinations retrieved successfully',
                'data' => $destinations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve destinations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available service types
     *
     * @return JsonResponse
     */
    public function serviceTypes(): JsonResponse
    {
        try {
            $serviceTypes = CourierRate::select('service_type')
                ->distinct()
                ->orderBy('service_type')
                ->pluck('service_type')
                ->toArray();

            $serviceDescriptions = [
                'ECO' => 'Economy Service',
                'REG' => 'Regular Service',
                'ONS' => 'One Night Service',
                'SDS' => 'Same Day Service',
                'TRC' => 'Trucking Service',
                'T15' => 'Trucking 15kg',
                'T25' => 'Trucking 25kg',
                'T60' => 'Trucking 60kg'
            ];

            $services = collect($serviceTypes)->map(function ($type) use ($serviceDescriptions) {
                return [
                    'code' => $type,
                    'name' => $serviceDescriptions[$type] ?? $type,
                    'description' => $serviceDescriptions[$type] ?? 'Service type: ' . $type
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Service types retrieved successfully',
                'data' => $services
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve service types',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply filters to query
     *
     * @param Builder $query
     * @param Request $request
     * @return void
     */
    private function applyFilters(Builder $query, Request $request): void
    {
        // Courier filter
        if ($request->has('courier_id')) {
            $query->where('courier_id', $request->courier_id);
        }

        if ($request->has('courier_name')) {
            $query->whereHas('courier', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->courier_name . '%');
            });
        }

        // Location filters
        if ($request->has('province')) {
            $query->where('destination_province', 'like', '%' . $request->province . '%');
        }

        if ($request->has('city')) {
            $query->where('destination_city', 'like', '%' . $request->city . '%');
        }

        if ($request->has('district')) {
            $query->where('destination_district', 'like', '%' . $request->district . '%');
        }

        if ($request->has('origin_city')) {
            $query->where('origin_city', 'like', '%' . $request->origin_city . '%');
        }

        // Service type filter
        if ($request->has('service_type')) {
            $query->where('service_type', $request->service_type);
        }

        // Price filters
        if ($request->has('min_price')) {
            $query->where('base_price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('base_price', '<=', $request->max_price);
        }

        // Estimated days filter
        if ($request->has('max_days')) {
            $query->where('estimated_days', '<=', $request->max_days);
        }

        // Availability filter
        if ($request->has('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }
    }

    /**
     * Transform rate data for API response
     *
     * @param CourierRate $rate
     * @return array
     */
    private function transformRate(CourierRate $rate): array
    {
        return [
            'id' => $rate->id,
            'courier' => [
                'id' => $rate->courier->id,
                'name' => $rate->courier->name,
                'code' => $rate->courier->code ?? null
            ],
            'origin' => [
                'city' => $rate->origin_city,
                'province' => $rate->origin_province,
                'district' => $rate->origin_district
            ],
            'destination' => [
                'province' => $rate->destination_province,
                'city' => $rate->destination_city,
                'district' => $rate->destination_district
            ],
            'service' => [
                'type' => $rate->service_type,
                'name' => $this->getServiceName($rate->service_type)
            ],
            'pricing' => [
                'base_price' => (float) $rate->base_price,
                'price_per_kg' => (float) $rate->price_per_kg,
                'min_weight' => (float) $rate->min_weight,
                'max_weight' => (float) $rate->max_weight,
                'pricing_type' => $rate->pricing_type
            ],
            'delivery' => [
                'estimated_days' => $rate->estimated_days,
                'etd_days' => $rate->etd_days
            ],
            'availability' => [
                'is_available' => $rate->is_available,
                'effective_date' => $rate->effective_date?->format('Y-m-d'),
                'expired_date' => $rate->expired_date?->format('Y-m-d')
            ],
            'timestamps' => [
                'created_at' => $rate->created_at?->toISOString(),
                'updated_at' => $rate->updated_at?->toISOString()
            ]
        ];
    }

    /**
     * Get service name by type
     *
     * @param string $type
     * @return string
     */
    private function getServiceName(string $type): string
    {
        $serviceNames = [
            'ECO' => 'Economy Service',
            'REG' => 'Regular Service',
            'ONS' => 'One Night Service',
            'SDS' => 'Same Day Service',
            'TRC' => 'Trucking Service',
            'T15' => 'Trucking 15kg',
            'T25' => 'Trucking 25kg',
            'T60' => 'Trucking 60kg'
        ];

        return $serviceNames[$type] ?? $type;
    }

    /**
     * Import courier rates from Excel file
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function import(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimetypes:application/zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel|max:10240', // Max 10MB
                'courier_id' => 'nullable|integer|exists:couriers,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $courierId = $request->input('courier_id');
            $userId = Auth::id();
            
            // Store the uploaded file temporarily
            $fileName = 'courier_rates_' . time() . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('temp', $fileName, 'local');
            
            // Generate unique job ID
            $jobId = uniqid('import_', true);
            
            // Dispatch the import job
            ImportCourierRatesJob::dispatch($filePath, $courierId, $userId, $jobId);
            
            // Store initial job status
            cache()->put("import_job_{$jobId}", [
                'id' => $jobId,
                'status' => 'queued',
                'message' => 'Import job has been queued for processing',
                'created_at' => now()->toISOString()
            ], now()->addHours(24));

            return response()->json([
                'success' => true,
                'message' => 'Import job has been queued for processing',
                'data' => [
                    'job_id' => $jobId,
                    'status' => 'queued',
                    'message' => 'You can check the import status using the job ID'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Courier rates import failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Import failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available couriers for import
     *
     * @return JsonResponse
     */
    public function getCouriers(): JsonResponse
    {
        try {
            $couriers = Courier::select('id', 'name', 'is_active')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $couriers
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch couriers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check import job status
     *
     * @param string $jobId
     * @return JsonResponse
     */
    public function importStatus(string $jobId): JsonResponse
    {
        try {
            $status = cache()->get("import_job_{$jobId}");
            
            if (!$status) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found or expired'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $status
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to get import status: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get import status'
            ], 500);
        }
    }
}