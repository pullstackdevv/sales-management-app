<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\CourierRate;
use App\Services\WilayahMatcher;

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
        [$provByName, $regByProv, $distByReg] = WilayahMatcher::buildMaps();
        $maps = [$provByName, $regByProv, $distByReg];

        $updated = 0; $skipped = 0; $total = 0;
        CourierRate::select('id','courier_id','destination_province','destination_city','destination_district','destination_province_code','destination_regency_code','destination_district_code')
            ->when($this->courierId !== null, function($q){ $q->where('courier_id', $this->courierId); })
            ->orderBy('id')
            ->chunk(1000, function ($chunk) use (&$updated, &$skipped, &$total, $maps) {
                $updates = [];
                foreach ($chunk as $rate) {
                    $total++;
                    if ($rate->destination_district_code) { $skipped++; continue; }
                    [$pCode, $rCode, $dCode] = WilayahMatcher::matchCodes($rate->destination_province, $rate->destination_city, $rate->destination_district, $maps);
                    if ($dCode) {
                        $updates[] = [
                            'id' => $rate->id,
                            'destination_province_code' => $pCode,
                            'destination_regency_code' => $rCode,
                            'destination_district_code' => $dCode,
                        ];
                    } else {
                        $skipped++;
                    }
                }
                foreach ($updates as $u) {
                    DB::table('courier_rates')->where('id', $u['id'])->update([
                        'destination_province_code' => $u['destination_province_code'],
                        'destination_regency_code' => $u['destination_regency_code'],
                        'destination_district_code' => $u['destination_district_code'],
                    ]);
                    $updated++;
                }
            });

        $this->updated = $updated;
        $this->skipped = $skipped;
        $this->total = $total;
        $this->command?->info("CourierRate codes updated: {$updated}, skipped: {$skipped}, total: {$total}");
    }
}
