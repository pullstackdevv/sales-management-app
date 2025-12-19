<?php

namespace App\Jobs;

use App\Models\CourierRate;
use App\Services\WilayahMatcher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MapCourierRatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected ?int $courierId;
    protected string $jobId;

    public function __construct(?int $courierId = null, ?string $jobId = null)
    {
        $this->courierId = $courierId;
        $this->jobId = $jobId ?: uniqid('map_', true);
    }

    public function handle(): void
    {
        $this->updateJobStatus('processing', 'Building wilayah maps...');
        [$provByName, $regByProv, $distByReg] = WilayahMatcher::buildMaps();
        $maps = [$provByName, $regByProv, $distByReg];

        $query = CourierRate::query()
            ->select('id', 'destination_province', 'destination_city', 'destination_district')
            ->whereNull('destination_district_code')
            ->whereNotNull('destination_province')
            ->whereNotNull('destination_city')
            ->whereNotNull('destination_district');

        if ($this->courierId) {
            $query->where('courier_id', $this->courierId);
        }

        $total = (clone $query)->count();
        $this->updateJobStatus('processing', 'Mapping records: ' . $total);

        $processed = 0;
        $updated = 0;
        $skipped = 0;

        $query->chunkById(500, function ($chunk) use (&$processed, &$updated, &$skipped, $maps, $total) {
            foreach ($chunk as $rate) {
                try {
                    $match = WilayahMatcher::matchCodes(
                        $rate->destination_province,
                        $rate->destination_city,
                        $rate->destination_district,
                        $maps
                    );

                    if ($match['district']) {
                        DB::table('courier_rates')
                            ->where('id', $rate->id)
                            ->update([
                                'destination_province_code' => $match['province']['kode'] ?? null,
                                'destination_regency_code' => $match['regency']['kode'] ?? null,
                                'destination_district_code' => $match['district']['kode'] ?? null,
                            ]);
                        $updated++;
                    } else {
                        $skipped++;
                    }
                } catch (\Exception $e) {
                    $skipped++;
                } finally {
                    $processed++;
                }
            }

            $progress = $total > 0 ? round(($processed / $total) * 100, 2) : 100;
            $this->updateJobStatus('processing', 'Progress ' . $progress . '% | Updated ' . $updated . ' | Skipped ' . $skipped);
        }, 'id');

        $this->updateJobStatus('completed', 'Completed. Updated ' . $updated . ', Skipped ' . $skipped . ', Total ' . $total);
        Log::info('MapCourierRatesJob completed', ['updated' => $updated, 'skipped' => $skipped, 'total' => $total]);
    }

    private function updateJobStatus($status, $message)
    {
        $existing = cache()->get('map_job_' . $this->jobId) ?: [];
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

        cache()->put('map_job_' . $this->jobId, $jobData, now()->addHours(24));

        if (in_array($status, ['completed', 'failed'])) {
            $activeJobs = cache()->get('active_map_jobs', []);
            $activeJobs = array_filter($activeJobs, function ($jobId) {
                return $jobId !== $this->jobId;
            });
            cache()->put('active_map_jobs', array_values($activeJobs), now()->addHours(24));
        }
    }

    public function getJobId()
    {
        return $this->jobId;
    }
}
