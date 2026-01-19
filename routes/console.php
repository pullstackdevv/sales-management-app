<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use App\Models\Wilayah;
use App\Models\CourierRate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use App\Services\WilayahMatcher;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('audit:wilayah-ongkir {--export=xlsx} {--limit=0} {--path=}', function () {
    $export = $this->option('export') ?: 'xlsx';
    $limit = (int)($this->option('limit') ?: 0);
    $pathOpt = $this->option('path');

    $norm = function($d){
        $s = trim((string)$d);
        foreach (['Kabupaten ','Kota ','Kecamatan ','Kelurahan ','Desa '] as $p) {
            if (stripos($s, $p) === 0) { $s = trim(substr($s, strlen($p))); break; }
        }
        return $s;
    };

    $wilayahUnmatched = [];
    foreach (Wilayah::kecamatan()->select('kode','nama')->cursor() as $row) {
        $clean = $norm($row->nama);
        $existsByCode = CourierRate::where('destination_district_code', $row->kode)
            ->orWhere('destination_district_code', 'like', $row->kode.'%')
            ->exists();
        $exists = $existsByCode;
        if (!$existsByCode) {
            $exists = CourierRate::where(function($q) use ($row, $clean) {
                $q->where('destination_district','like','%'.$row->nama.'%')
                  ->orWhere('destination_district','like','%'.$clean.'%')
                  ->orWhere('destination_district','like','%Kabupaten '.$clean.'%')
                  ->orWhere('destination_district','like','%Kota '.$clean.'%')
                  ->orWhere('destination_district','like','%Kecamatan '.$clean.'%');
            })->exists();
        }
        if (!$exists) {
            $regCode = substr($row->kode, 0, 5);
            $provCode = explode('.', $regCode)[0];
            $reg = Wilayah::where('kode', $regCode)->first();
            $prov = Wilayah::where('kode', $provCode)->first();
            $wilayahUnmatched[] = [
                'district_code' => $row->kode,
                'district_name' => $row->nama,
                'regency_code' => $regCode,
                'regency_name' => $reg?->nama,
                'province_code' => $provCode,
                'province_name' => $prov?->nama,
            ];
            if ($limit > 0 && count($wilayahUnmatched) >= $limit) break;
        }
    }

    $ratesUnmapped = [];
    [$provByName, $regByProv, $distByReg] = WilayahMatcher::buildMaps();
    foreach (CourierRate::select('destination_province','destination_city','destination_district','destination_district_code')->distinct()->cursor() as $r) {
        $dn = $norm($r->destination_district ?? '');
        $canon = WilayahMatcher::canonicalDistrictCode($r->destination_district_code ?? null);
        $existsByCode = $canon ? Wilayah::where('kode', $canon)->exists() : false;
        $exists = $existsByCode;
        if (!$existsByCode) {
            $match = WilayahMatcher::matchCodes(
                $r->destination_province,
                $r->destination_city,
                $r->destination_district,
                [$provByName, $regByProv, $distByReg]
            );
            $matchedDistrictCode = $match['district']['kode'] ?? null;
            if ($matchedDistrictCode) {
                $exists = true;
            } else {
                $dnLower = mb_strtolower($dn);
                $dnNoParen = preg_replace('/\([^\)]*\)/u', ' ', $dnLower);
                $dnNoParen = preg_replace('/\s+/', ' ', trim($dnNoParen));
                $dnNospace = str_replace(' ', '', $dnNoParen);

                $exists = Wilayah::kecamatan()
                    ->whereRaw('LOWER(nama) LIKE ?', ['%'.$dnLower.'%'])
                    ->orWhereRaw('LOWER(nama) LIKE ?', ['%'.$dnNoParen.'%'])
                    ->orWhereRaw('REPLACE(LOWER(nama), " ", "") LIKE ?', ['%'.$dnNospace.'%'])
                    ->exists();
            }
        }
        if (!$exists) {
            $ratesUnmapped[] = [
                'province' => $r->destination_province,
                'city' => $r->destination_city,
                'district' => $r->destination_district,
            ];
            if ($limit > 0 && count($ratesUnmapped) >= $limit) break;
        }
    }

    if (strtolower($export) === 'xlsx') {
        $fileName = $pathOpt ?: ('reports/wilayah_ongkir_audit_'.date('Ymd_His').'.xlsx');
        Storage::makeDirectory(dirname($fileName));
        $spreadsheet = new Spreadsheet();

        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('wilayah_unmatched');
        $sheet1->fromArray(['district_code','district_name','regency_code','regency_name','province_code','province_name'], NULL, 'A1');
        $sheet1->fromArray($wilayahUnmatched, NULL, 'A2');

        $sheet2 = $spreadsheet->createSheet(1);
        $sheet2->setTitle('rates_unmapped');
        $sheet2->fromArray(['province','city','district'], NULL, 'A1');
        $sheet2->fromArray($ratesUnmapped, NULL, 'A2');

        $writer = new Xlsx($spreadsheet);
        $fullPath = Storage::path($fileName);
        $writer->save($fullPath);
        $this->info('Excel generated: '.$fullPath);
        $this->info('wilayah_unmatched: '.count($wilayahUnmatched));
        $this->info('rates_unmapped: '.count($ratesUnmapped));
    } else {
        $this->line(json_encode([
            'wilayah_unmatched_count' => count($wilayahUnmatched),
            'rates_unmapped_count' => count($ratesUnmapped),
            'wilayah_unmatched_sample' => array_slice($wilayahUnmatched, 0, 50),
            'rates_unmapped_sample' => array_slice($ratesUnmapped, 0, 50),
        ], JSON_UNESCAPED_UNICODE));
    }
})->describe('Audit kecocokan wilayah-ongkir dan export hasil ke Excel');

Artisan::command('reconcile:wilayah-ongkir {--apply} {--confidence=0.95} {--export=xlsx} {--path=}', function () {
    $apply = $this->option('apply');
    $confidence = (float)($this->option('confidence') ?: 0.95);
    $export = $this->option('export') ?: 'xlsx';
    $pathOpt = $this->option('path') ?: ('reports/wilayah_ongkir_reconcile_'.date('Ymd_His').'.xlsx');

    [$provByName, $regByProv, $distByReg] = WilayahMatcher::buildMaps();
    $maps = [$provByName, $regByProv, $distByReg];
    $applied = []; $needsReview = [];

    foreach (CourierRate::select('id','destination_province','destination_city','destination_district','destination_province_code','destination_regency_code','destination_district_code')->cursor() as $rate) {
        if ($rate->destination_district_code) continue;
        [$pCode, $rCode, $dCode] = WilayahMatcher::matchCodes($rate->destination_province, $rate->destination_city, $rate->destination_district, $maps);
        $pOk = !!$pCode; $rOk = !!$rCode; $dOk = !!$dCode;
        $row = [
            'id' => $rate->id,
            'province' => $rate->destination_province,
            'city' => $rate->destination_city,
            'district' => $rate->destination_district,
            'province_code' => $pCode,
            'regency_code' => $rCode,
            'district_code' => $dCode,
        ];
        if ($pOk && $rOk && $dOk) {
            $applied[] = $row;
        } else {
            $needsReview[] = $row;
        }
    }

    if ($apply) {
        foreach ($applied as $u) {
            CourierRate::where('id', $u['id'])->update([
                'destination_province_code' => $u['province_code'],
                'destination_regency_code' => $u['regency_code'],
                'destination_district_code' => $u['district_code'],
            ]);
        }
    }

    if (strtolower($export) === 'xlsx') {
        Storage::makeDirectory(dirname($pathOpt));
        $spreadsheet = new Spreadsheet();
        $s1 = $spreadsheet->getActiveSheet();
        $s1->setTitle('applied');
        $s1->fromArray(['id','province','city','district','province_code','regency_code','district_code'], NULL, 'A1');
        $s1->fromArray($applied, NULL, 'A2');
        $s2 = $spreadsheet->createSheet(1);
        $s2->setTitle('needs_review');
        $s2->fromArray(['id','province','city','district','province_code','regency_code','district_code'], NULL, 'A1');
        $s2->fromArray($needsReview, NULL, 'A2');
        $writer = new Xlsx($spreadsheet);
        $fullPath = Storage::path($pathOpt);
        $writer->save($fullPath);
        $this->info('Reconcile export: '.$fullPath);
    } else {
        $this->line(json_encode([
            'applied_count' => count($applied),
            'needs_review_count' => count($needsReview),
        ], JSON_UNESCAPED_UNICODE));
    }

    $this->info('Applied: '.count($applied).', Needs review: '.count($needsReview).($apply?' (codes updated)':''));
})->describe('Rekonsiliasi kode wilayah untuk courier_rates (apply/dry-run)');
