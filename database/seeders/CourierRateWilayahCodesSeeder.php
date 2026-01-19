<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\CourierRate;
use App\Services\WilayahMatcher;
use Illuminate\Support\Facades\Log;

class CourierRateWilayahCodesSeeder extends Seeder
{
    private ?int $courierId;
    public int $updated = 0;
    public int $skipped = 0;
    public int $total = 0;

    public function __construct(?int $courierId = null)
    {
        $this->courierId = $courierId;
    }

    public function run(): void
    {
        $this->command?->info('Building wilayah maps...');
        $maps = WilayahMatcher::buildMaps();

        $updated = 0;
        $skipped = 0;
        $total = 0;
        $exactMatches = 0;
        $fuzzyMatches = 0;
        $notMatched = 0;

        $this->command?->info('Processing courier rates...');
        
        CourierRate::select(
            'id',
            'courier_id',
            'destination_province',
            'destination_city',
            'destination_district',
            'destination_province_code',
            'destination_regency_code',
            'destination_district_code'
        )
            ->when($this->courierId !== null, function($q) {
                $q->where('courier_id', $this->courierId);
            })
            ->orderBy('id')
            ->chunk(1000, function ($chunk) use (
                &$updated,
                &$skipped,
                &$total,
                &$exactMatches,
                &$fuzzyMatches,
                &$notMatched,
                $maps
            ) {
                $updates = [];
                
                foreach ($chunk as $rate) {
                    $total++;
                    
                    // Skip jika sudah ter-mapping berdasarkan kode
                    if ($rate->destination_district_code) {
                        $skipped++;
                        continue;
                    }
                    
                    // Match menggunakan WilayahMatcher
                    $matchResult = WilayahMatcher::matchCodes(
                        $rate->destination_province,
                        $rate->destination_city,
                        $rate->destination_district,
                        $maps
                    );
                    
                    if ($matchResult['matched']) {
                        $updateData = ['id' => $rate->id];
                        
                        // Set province code
                        if ($matchResult['province']) {
                            $updateData['destination_province_code'] = $matchResult['province']['kode'];
                        }
                        
                        // Set regency code
                        if ($matchResult['regency']) {
                            $updateData['destination_regency_code'] = $matchResult['regency']['kode'];
                        }
                        
                        // Set district code
                        if ($matchResult['district']) {
                            $updateData['destination_district_code'] = $matchResult['district']['kode'];
                        }
                        
                        $updates[] = $updateData;
                        
                        // Track match method
                        if ($matchResult['method'] === 'exact') {
                            $exactMatches++;
                        } else {
                            $fuzzyMatches++;
                        }
                    } else {
                        $notMatched++;
                        
                        // Log unmatched records untuk analisis
                        Log::warning('Wilayah not matched', [
                            'rate_id' => $rate->id,
                            'province' => $rate->destination_province,
                            'city' => $rate->destination_city,
                            'district' => $rate->destination_district
                        ]);
                    }
                }
                
                // Batch update
                foreach ($updates as $u) {
                    DB::table('courier_rates')
                        ->where('id', $u['id'])
                        ->update([
                            'destination_province_code' => $u['destination_province_code'] ?? null,
                            'destination_regency_code' => $u['destination_regency_code'] ?? null,
                            'destination_district_code' => $u['destination_district_code'] ?? null,
                            'updated_at' => now()
                        ]);
                    $updated++;
                }
                
                $this->command?->info("Processed: {$total} | Updated: {$updated} | Skipped: {$skipped}");
            });

        $this->updated = $updated;
        $this->skipped = $skipped;
        $this->total = $total;
        
        $matchRate = $total > 0 ? round(($updated / $total) * 100, 2) : 0;
        
        $this->command?->newLine();
        $this->command?->info("========================================");
        $this->command?->info("Courier Rate Mapping Summary:");
        $this->command?->info("========================================");
        $this->command?->info("Total records: {$total}");
        $this->command?->info("Updated: {$updated} ({$matchRate}%)");
        $this->command?->info("Already mapped (skipped): {$skipped}");
        $this->command?->info("Not matched: {$notMatched}");
        $this->command?->newLine();
        $this->command?->info("Match Method Breakdown:");
        $this->command?->info("- Exact matches: {$exactMatches}");
        $this->command?->info("- Fuzzy matches: {$fuzzyMatches}");
        $this->command?->info("========================================");
    }
}
