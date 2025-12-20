<?php

namespace App\Jobs;

use App\Models\CourierRate;
use App\Models\Courier;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Collection;
use Exception;
use Database\Seeders\CourierRateWilayahCodesSeeder;
use App\Services\WilayahMatcher;

class ImportCourierRatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $filePath;
    protected $courierId;
    protected $userId;
    protected $jobId;
    protected $remapExisting = true;

    /**
     * Create a new job instance.
     */
    public function __construct($filePath, $courierId = null, $userId = null, $jobId = null, $remapExisting = true)
    {
        $this->filePath = $filePath;
        $this->courierId = $courierId;
        $this->userId = $userId;
        $this->jobId = $jobId ?? uniqid('import_', true);
        $this->remapExisting = (bool) $remapExisting;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Starting courier rates import job: {$this->jobId}");

            // Update job status to processing
            $this->updateJobStatus('processing', 'Reading Excel file...');

            // Read Excel data
            $fullPath = Storage::path($this->filePath);

            if (!file_exists($fullPath)) {
                throw new Exception('File not found: ' . $fullPath);
            }

            Log::info("Reading Excel file for job: {$this->jobId}", ['file_path' => $fullPath]);

            // Increase memory limit for large Excel files
            ini_set('memory_limit', '512M');

            try {
                // Load the spreadsheet using PhpSpreadsheet
                $spreadsheet = IOFactory::load($fullPath);
                $worksheet = $spreadsheet->getActiveSheet();

                // Get all data as array
                $data = $worksheet->toArray();

                if (empty($data)) {
                    Log::warning("Excel file is empty or has no data: {$fullPath}");
                    throw new Exception('No data found in Excel file');
                }

                // Remove empty rows
                $data = array_filter($data, function ($row) {
                    return !empty(array_filter($row, function ($cell) {
                        return !is_null($cell) && $cell !== '';
                    }));
                });

                Log::info('Excel data read successfully', [
                    'total_rows' => count($data),
                    'first_row' => array_slice($data[0] ?? [], 0, 5)
                ]);

                $data = array_values($data);
            } catch (Exception $e) {
                Log::error('Failed to read Excel file in job', [
                    'error' => $e->getMessage(),
                    'file_path' => $fullPath
                ]);
                throw new Exception('Failed to read Excel file: ' . $e->getMessage());
            }

            Log::info('Excel data read', [
                'total_rows' => count($data),
                'first_few_rows' => array_slice($data, 0, 5)
            ]);

            if (empty($data)) {
                throw new Exception('No data found in Excel file');
            }

            $totalRows = count($data) - 4; // Exclude header rows (rows 1-4)
            $this->updateJobStatus('processing', "Processing {$totalRows} rows...");

            // Get courier
            $courier = $this->getCourier();



            $imported = 0;
            $skipped = 0;
            $batchSize = 500; // Process in batches

            // Skip header rows (rows 1-4)
            $dataRows = array_slice($data, 4);

            $maps = $this->remapExisting ? WilayahMatcher::buildMaps() : null;
            foreach (array_chunk($dataRows, $batchSize) as $batch) {
                DB::transaction(function () use ($batch, $courier, &$imported, &$skipped, $maps) {
                    foreach ($batch as $row) {
                        try {
                            $result = $this->processRow($row, $courier, $maps);
                            if ($result) {
                                $imported++;
                            } else {
                                $skipped++;
                            }
                        } catch (Exception $e) {
                            Log::warning('Failed to process row: ' . $e->getMessage(), ['row' => $row]);
                            $skipped++;
                        }
                    }
                });

                // Update progress
                $progress = round((($imported + $skipped) / $totalRows) * 100, 2);
                $mode = $this->remapExisting ? 'mapping-enabled' : 'mapping-disabled';
                $this->updateJobStatus('processing', "Processed {$imported} records, skipped {$skipped}. Progress: {$progress}% ({$mode})");
            }
            $this->updateJobStatus('completed', "Import completed. Imported: {$imported}, Skipped: {$skipped}");

            Log::info("Courier rates import job completed: {$this->jobId}", [
                'imported' => $imported,
                'skipped' => $skipped
            ]);
        } catch (Exception $e) {
            Log::error("Courier rates import job failed: {$this->jobId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $this->updateJobStatus('failed', 'Import failed: ' . $e->getMessage());
            throw $e;
        } finally {
            // Clean up temporary file
            if (Storage::exists($this->filePath)) {
                Storage::delete($this->filePath);
            }
        }
    }



    private function getCourier()
    {
        if ($this->courierId) {
            $courier = Courier::find($this->courierId);
            if (!$courier) {
                throw new Exception('Courier not found with ID: ' . $this->courierId);
            }
            return $courier;
        }

        // Default to TIKI if no courier specified
        return Courier::where('name', 'TIKI')->first() ??
            Courier::first() ??
            Courier::create(['name' => 'TIKI', 'code' => 'tiki']);
    }

    private function processRow($row, $courier, $maps = null)
    {
        $imported = 0;
        $skipped = 0;

        // Service type mapping
        $courierMapping = [
            'ECO' => 'ECO',
            'REG' => 'REG',
            'ONS' => 'ONS',
            'SDS' => 'SDS',
            'TRC' => 'TRC',
            'T15' => 'T15',
            'T25' => 'T25',
            'T60' => 'T60'
        ];

        // Extract location data
        $province = trim($row[0] ?? '');
        $city = trim($row[1] ?? '');
        $district = trim($row[2] ?? '');

        // Debug logging
        Log::info('Processing row', [
            'province' => $province,
            'city' => $city,
            'district' => $district,
            'row_data' => array_slice($row, 0, 10) // First 10 columns for debugging
        ]);

        if (empty($province) || empty($city) || empty($district)) {
            Log::info('Skipping row due to empty location data');
            return false;
        }

        // Process each service type
        $serviceIndex = 3; // Starting from column D (index 3)

        foreach ($courierMapping as $serviceType => $serviceCode) {
            try {
                $rate = $this->parseRate($row[$serviceIndex] ?? null);
                $sla = $this->parseSLA($row[$serviceIndex + 1] ?? null);

                if ($rate > 0) {
                    // Check if record already exists
                    $existing = CourierRate::where([
                        'courier_id' => $courier->id,
                        'destination_city' => $city,
                        'destination_province' => $province,
                        'destination_district' => $district,
                        'service_type' => $serviceCode
                    ])->first();

                    if ($existing) {
                        // Update existing record
                        if ($this->remapExisting) {
                            $existing->update([
                                'base_price' => $rate,
                                'estimated_days' => $sla,
                                'is_available' => true,
                                'price_per_kg' => $rate
                            ]);
                            $existing->attemptMapping($maps);
                            $imported++;
                        } else {
                            // Only update rates for already-mapped records; skip unmapped
                            if (!is_null($existing->destination_district_code)) {
                                $existing->update([
                                    'base_price' => $rate,
                                    'estimated_days' => $sla,
                                    'is_available' => true,
                                    'price_per_kg' => $rate
                                ]);
                                $imported++;
                            } else {
                                $skipped++;
                            }
                        }
                    } else {
                        // No existing record
                        if ($this->remapExisting) {
                            $created = CourierRate::create([
                                'courier_id' => $courier->id,
                                'origin_city' => 'Jakarta',
                                'destination_city' => $city,
                                'destination_province' => $province,
                                'destination_district' => $district,
                                'service_type' => $serviceCode,
                                'price_per_kg' => $rate,
                                'base_price' => $rate,
                                'estimated_days' => $sla,
                                'is_available' => true,
                                'etd_days' => $sla ? $sla . ' days' : '1-2 days'
                            ]);
                            $created->attemptMapping($maps);
                            $imported++;
                        } else {
                            // Create only if we can reuse existing mapped destination codes from any record with same destination
                            $ref = CourierRate::where([
                                'destination_city' => $city,
                                'destination_province' => $province,
                                'destination_district' => $district,
                            ])->whereNotNull('destination_district_code')->first();

                            if ($ref) {
                                $created = CourierRate::create([
                                    'courier_id' => $courier->id,
                                    'origin_city' => 'Jakarta',
                                    'destination_city' => $city,
                                    'destination_province' => $province,
                                    'destination_district' => $district,
                                    'service_type' => $serviceCode,
                                    'price_per_kg' => $rate,
                                    'base_price' => $rate,
                                    'estimated_days' => $sla,
                                    'is_available' => true,
                                    'etd_days' => $sla ? $sla . ' days' : '1-2 days',
                                    'destination_province_code' => $ref->destination_province_code,
                                    'destination_regency_code' => $ref->destination_regency_code,
                                    'destination_district_code' => $ref->destination_district_code,
                                ]);
                                $imported++;
                            } else {
                                // Skip creation when mapping is disabled and no mapped reference exists
                                $skipped++;
                            }
                        }
                    }
                } else {
                    $skipped++;
                }

                $serviceIndex += 2; // Move to next service (rate + sla)

            } catch (Exception $e) {
                $skipped++;
                $serviceIndex += 2;
            }
        }

        return $imported > 0;
    }

    private function parseRate($value)
    {
        if (empty($value) || $value === '-' || $value === 'N/A' || $value === '0') {
            return 0;
        }

        // Convert to string if it's not already
        $value = (string) $value;

        // Remove currency symbols and keep only numbers and commas
        $cleaned = preg_replace('/[^0-9,.]/', '', $value);

        // Replace comma with empty string (Indonesian number format)
        $cleaned = str_replace(',', '', $cleaned);

        return floatval($cleaned);
    }

    private function parseSLA($value)
    {
        if (empty($value) || $value === '-' || $value === 'N/A') {
            return null;
        }

        // Extract number from SLA (e.g., "2-3 days" -> 3)
        preg_match('/\d+/', $value, $matches);
        return isset($matches[0]) ? intval($matches[0]) : null;
    }

    private function updateJobStatus($status, $message)
    {
        $existing = cache()->get("import_job_{$this->jobId}") ?: [];
        $logs = $existing['logs'] ?? [];
        $logs[] = [
            'time' => now()->toISOString(),
            'status' => $status,
            'message' => $message
        ];
        if (count($logs) > 100) {
            $logs = array_slice($logs, -100);
        }

        $jobData = [
            'id' => $this->jobId,
            'status' => $status,
            'message' => $message,
            'courier_id' => $this->courierId,
            'updated_at' => now()->toISOString(),
            'logs' => $logs
        ];

        cache()->put("import_job_{$this->jobId}", $jobData, now()->addHours(24));

        // Remove from active jobs list when completed or failed
        if (in_array($status, ['completed', 'failed'])) {
            $activeJobs = cache()->get('active_import_jobs', []);
            $activeJobs = array_filter($activeJobs, function ($jobId) {
                return $jobId !== $this->jobId;
            });
            cache()->put('active_import_jobs', array_values($activeJobs), now()->addHours(24));
        }
    }

    /**
     * Get the unique identifier for the job.
     */
    public function getJobId()
    {
        return $this->jobId;
    }
}
