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
                'service_type' => 'nullable|string|in:REG,ONS',
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
            // Only show REG and ONS service types
            $allowedServiceTypes = ['REG', 'ONS'];
            
            $serviceTypes = CourierRate::select('service_type')
                ->distinct()
                ->whereIn('service_type', $allowedServiceTypes)
                ->orderBy('service_type')
                ->pluck('service_type')
                ->toArray();

            $serviceDescriptions = [
                'REG' => 'Regular Service',
                'ONS' => 'One Night Service'
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
            $district = $request->district;
            
            // Clean and normalize district name for flexible search
            $cleanDistrict = $this->normalizeDistrictName($district);
            
            // Search with multiple approaches for flexibility
            $query->where(function ($q) use ($district, $cleanDistrict) {
                // Exact match
                $q->where('destination_district', 'like', '%' . $district . '%')
                  // Match without common prefixes
                  ->orWhere('destination_district', 'like', '%' . $cleanDistrict . '%')
                  // Match if database has prefix but search doesn't
                  ->orWhere('destination_district', 'like', '%Kabupaten ' . $cleanDistrict . '%')
                  ->orWhere('destination_district', 'like', '%Kota ' . $cleanDistrict . '%')
                  ->orWhere('destination_district', 'like', '%Kecamatan ' . $cleanDistrict . '%');
            });
        }

        if ($request->has('origin_city')) {
            $query->where('origin_city', 'like', '%' . $request->origin_city . '%');
        }

        // Service type filter - restrict to REG and ONS only
        $allowedServiceTypes = ['REG', 'ONS'];
        if ($request->has('service_type')) {
            // Only allow REG and ONS service types
            if (in_array($request->service_type, $allowedServiceTypes)) {
                $query->where('service_type', $request->service_type);
            }
        } else {
            // If no service_type specified, only show REG and ONS
            $query->whereIn('service_type', $allowedServiceTypes);
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
                'effective_date' => $rate->effective_date ? $rate->effective_date->format('Y-m-d') : null,
                'expired_date' => $rate->expired_date ? $rate->expired_date->format('Y-m-d') : null
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
     * Normalize district name by removing common prefixes
     *
     * @param string $district
     * @return string
     */
    private function normalizeDistrictName(string $district): string
    {
        // Common prefixes to remove for flexible search
        $prefixes = [
            'Kabupaten ',
            'Kota ',
            'Kecamatan ',
            'Kelurahan ',
            'Desa '
        ];

        $cleanDistrict = trim($district);
        
        // Remove prefixes (case insensitive)
        foreach ($prefixes as $prefix) {
            if (stripos($cleanDistrict, $prefix) === 0) {
                $cleanDistrict = trim(substr($cleanDistrict, strlen($prefix)));
                break; // Only remove the first matching prefix
            }
        }

        return $cleanDistrict;
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
            
            // Additional file validation
            // $this->validateExcelFormat($file);
            
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
                'courier_id' => $courierId,
                'created_at' => now()->toISOString()
            ], now()->addHours(24));
            
            // Add to active jobs list
            $activeJobIds = cache()->get('active_import_jobs', []);
            $activeJobIds[] = $jobId;
            cache()->put('active_import_jobs', $activeJobIds, now()->addHours(24));

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
     * Validate Excel file format and structure
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @throws \Exception
     */
    private function validateExcelFormat($file)
    {
        try {
            // Check file extension
            $allowedExtensions = ['xlsx', 'xls'];
            $extension = strtolower($file->getClientOriginalExtension());
            
            if (!in_array($extension, $allowedExtensions)) {
                throw new \Exception('File harus berformat Excel (.xlsx atau .xls)');
            }

            // Check file size (max 10MB)
            $maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if ($file->getSize() > $maxSize) {
                throw new \Exception('Ukuran file tidak boleh lebih dari 10MB');
            }

            // Load Excel file to validate structure
            $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReader('Xlsx');
            $reader->setReadDataOnly(true);
            $spreadsheet = $reader->load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            
            // Check if file has data
            $highestRow = $worksheet->getHighestRow();
            if ($highestRow < 3) {
                throw new \Exception('File Excel harus memiliki minimal 3 baris (header + data)');
            }
            
            // Validate required headers
            $requiredHeaders = ['PROVINCE', 'CITY', 'DISTRICT'];
            $headerRow = 2; // Headers are in row 2
            
            foreach ($requiredHeaders as $index => $header) {
                $cellValue = $worksheet->getCell(chr(65 + $index) . $headerRow)->getValue();
                if (strtoupper(trim($cellValue)) !== $header) {
                    throw new \Exception("Header kolom " . chr(65 + $index) . " harus berisi '{$header}', ditemukan: '{$cellValue}'");
                }
            }
            
            // Check for service type headers (ECO, REG, ONS, etc.)
            $serviceHeaders = ['ECO', 'REG', 'ONS', 'SDS', 'TRC', 'T15', 'T25', 'T60'];
            $foundServices = 0;
            
            for ($col = 4; $col <= 21; $col++) { // Columns D to U
                $cellValue = $worksheet->getCell(chr(64 + $col) . $headerRow)->getValue();
                if (in_array(strtoupper(trim($cellValue)), $serviceHeaders)) {
                    $foundServices++;
                }
            }
            
            if ($foundServices < 1) {
                throw new \Exception('File harus memiliki minimal 1 jenis layanan kurir (ECO, REG, ONS, SDS, TRC, T15, T25, T60)');
            }
            
        } catch (\PhpOffice\PhpSpreadsheet\Exception $e) {
            throw new \Exception('File Excel tidak valid atau rusak: ' . $e->getMessage());
        } catch (\Exception $e) {
            throw $e;
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

    /**
     * Get active import jobs
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function activeImports(Request $request): JsonResponse
    {
        try {
            $courierId = $request->input('courier_id');
            $activeImports = [];
            
            // Store active job IDs in a separate cache key for easier retrieval
            $activeJobIds = cache()->get('active_import_jobs', []);
            
            // Debug logging
            Log::info('Checking active imports', [
                'active_job_ids' => $activeJobIds,
                'courier_id' => $courierId
            ]);
            
            foreach ($activeJobIds as $jobId) {
                $status = cache()->get("import_job_{$jobId}");
                
                Log::info("Checking job {$jobId}", ['status' => $status]);
                
                if ($status && isset($status['status']) && in_array($status['status'], ['queued', 'processing'])) {
                    // If courier_id is specified, filter by it
                    if ($courierId && isset($status['courier_id']) && $status['courier_id'] != $courierId) {
                        continue;
                    }
                    
                    $activeImports[] = $status;
                } else {
                    // Remove completed/failed jobs from active list
                    $activeJobIds = array_filter($activeJobIds, function($id) use ($jobId) {
                        return $id !== $jobId;
                    });
                    cache()->put('active_import_jobs', array_values($activeJobIds), now()->addHours(24));
                }
            }
            
            Log::info('Active imports found', ['count' => count($activeImports), 'imports' => $activeImports]);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'active_imports' => $activeImports,
                    'count' => count($activeImports)
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to get active imports: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get active imports',
                'data' => [
                    'active_imports' => [],
                    'count' => 0
                ]
            ], 500);
        }
    }
}