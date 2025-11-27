<?php

namespace App\Jobs;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductCategory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Exception;

class ImportProductsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $filePath;
    protected $userId;
    protected $jobId;

    public function __construct($filePath, $userId = null, $jobId = null)
    {
        $this->filePath = $filePath;
        $this->userId = $userId;
        $this->jobId = $jobId ?? uniqid('product_import_', true);
    }

    public function handle(): void
    {
        try {
            $this->updateJobStatus('processing', 'Reading Excel file...', []);

            $fullPath = Storage::path($this->filePath);
            if (!file_exists($fullPath)) {
                throw new Exception('File not found: ' . $fullPath);
            }

            ini_set('memory_limit', '512M');

            $spreadsheet = IOFactory::load($fullPath);
            $worksheet = $spreadsheet->getActiveSheet();
            $data = $worksheet->toArray();

            if (empty($data)) {
                throw new Exception('No data found in Excel file');
            }

            $data = array_values(array_filter($data, function ($row) {
                return !empty(array_filter($row, function ($cell) {
                    return !is_null($cell) && $cell !== '';
                }));
            }));

            [$headers, $rowsStart] = $this->detectHeaderRow($data);
            $rows = array_slice($data, $rowsStart);
            $this->updateJobStatus('processing', 'Headers detected', [
                'headers' => array_slice($headers, 0, 20),
                'rows_start' => $rowsStart,
                'first_row_preview' => array_slice($rows[0] ?? [], 0, 20)
            ]);
            $totalRows = count($rows);
            $this->updateJobStatus('processing', 'Processing ' . $totalRows . ' rows...', []);

            $imported = 0;
            $skipped = 0;
            $lastVariantId = null;
            $lastAction = null;
            $lastSku = null;
            $batchSize = 300;

            $lastSkipReason = null;
            $lastErrorMessage = null;
            foreach (array_chunk($rows, $batchSize) as $batch) {
                DB::transaction(function () use ($batch, $headers, &$imported, &$skipped, &$lastVariantId, &$lastAction, &$lastSku, &$lastSkipReason) {
                    foreach ($batch as $row) {
                        try {
                            $mapped = $this->mapRow($headers, $row);
                            if (!$mapped['name']) {
                                $skipped++;
                                $lastSkipReason = 'missing_name';
                                continue;
                            }

                            $productBasePrice = $mapped['base_price'] ?? 0;
                            $categoryId = $mapped['category_id'] ?? null;
                            $categoryName = isset($mapped['category']) ? trim((string) $mapped['category']) : null;
                            $categoryIds = [];
                            if ($categoryId) {
                                $existingCategory = ProductCategory::where('id', $categoryId)->where('is_active', 1)->first();
                                if (!$existingCategory) {
                                    $skipped++;
                                    $lastSkipReason = 'invalid_category_id';
                                    continue;
                                }
                                if (!$categoryName) {
                                    $categoryName = $existingCategory->name;
                                }
                            } elseif ($categoryName) {
                                $normalized = trim((string) $categoryName);
                                if ($normalized === '') {
                                    $skipped++;
                                    $lastSkipReason = 'missing_category';
                                    continue;
                                }
                                $names = collect(preg_split('/[,;|]/', $normalized))
                                    ->map(function($n){ return trim($n); })
                                    ->filter(function($n){ return $n !== ''; })
                                    ->values();
                                if ($names->isEmpty()) {
                                    $skipped++;
                                    $lastSkipReason = 'missing_category';
                                    continue;
                                }
                                foreach ($names as $i => $name) {
                                    $foundCategory = ProductCategory::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();
                                    if (!$foundCategory) {
                                        $slug = Str::slug($name);
                                        $foundCategory = ProductCategory::where('slug', $slug)->first();
                                    }
                                    if ($foundCategory) {
                                        if ($foundCategory->is_active === false) {
                                            $foundCategory->update(['is_active' => 1, 'updated_by' => $this->userId]);
                                        }
                                    } else {
                                        $foundCategory = ProductCategory::firstOrCreate(
                                            ['name' => $name],
                                            [
                                                'slug' => Str::slug($name),
                                                'description' => '',
                                                'is_active' => 1,
                                                'created_by' => $this->userId,
                                                'updated_by' => null
                                            ]
                                        );
                                    }
                                    $categoryIds[] = $foundCategory->id;
                                    if ($i === 0) {
                                        $categoryId = $foundCategory->id;
                                        $categoryName = $foundCategory->name;
                                    }
                                }
                            } else {
                                $skipped++;
                                $lastSkipReason = 'missing_category';
                                continue;
                            }

                            $product = Product::updateOrCreate(
                                ['name' => $mapped['name']],
                                [
                                    'category' => $categoryName ?? '',
                                    'category_id' => $categoryId,
                                    'description' => $mapped['description'],
                                    'base_price' => $productBasePrice,
                                    'image' => $mapped['image'],
                                    'is_active' => $mapped['is_active'],
                                    'is_storefront' => $mapped['is_storefront'],
                                    'created_by' => $this->userId
                                ]
                            );

                            if (!empty($categoryIds)) {
                                $product->categories()->sync($categoryIds);
                            } elseif (!empty($categoryId)) {
                                $product->categories()->sync([$categoryId]);
                            }

                            $variantData = [
                                'product_id' => $product->id,
                                'variant_label' => $mapped['variant_label'] ?? null,
                                'sku' => $mapped['sku'] ?? null,
                                'price' => $mapped['price'] ?? 0,
                                'base_price' => $mapped['base_price'] ?? 0,
                                'discount_price' => $mapped['discount_price'] ?? null,
                                'weight' => $mapped['weight'] ?? 0,
                                'stock' => $mapped['stock'] ?? 0,
                                'image' => $mapped['variant_image'] ?? null,
                                'is_active' => $mapped['variant_is_active'] ?? $mapped['is_active'],
                                'is_storefront' => $mapped['variant_is_storefront'] ?? $mapped['is_storefront'],
                                'created_by' => $this->userId
                            ];

                            if (empty($variantData['sku'])) {
                                $variantData['sku'] = $this->generateSku($mapped['name'] ?? 'PRODUCT', $mapped['variant_label'] ?? 'DEFAULT');
                            }

                            if ($variantData['sku']) {
                                $existing = ProductVariant::where('sku', $variantData['sku'])->first();
                                if ($existing) {
                                    $existing->update($variantData);
                                    $lastVariantId = $existing->id;
                                    $lastAction = 'updated';
                                    $lastSku = $variantData['sku'];
                                } else {
                                    $created = ProductVariant::create($variantData);
                                    $lastVariantId = $created->id;
                                    $lastAction = 'created';
                                    $lastSku = $variantData['sku'];
                                }
                            } else {
                                $created = ProductVariant::create($variantData);
                                $lastVariantId = $created->id;
                                $lastAction = 'created';
                                $lastSku = null;
                            }

                            $imported++;
                        } catch (Exception $e) {
                            $skipped++;
                            $lastSkipReason = 'exception: ' . $e->getMessage();
                            $lastErrorMessage = $e->getMessage();
                        }
                    }
                });

                $progress = $totalRows > 0 ? round((($imported + $skipped) / $totalRows) * 100, 2) : 100;
                $this->updateJobStatus('processing', 'Processed ' . $imported . ' records, skipped ' . $skipped . '. Progress: ' . $progress . '%', [
                    'imported' => $imported,
                    'skipped' => $skipped,
                    'last_variant_id' => $lastVariantId,
                    'last_action' => $lastAction,
                    'last_sku' => $lastSku,
                    'last_skip_reason' => $lastSkipReason,
                    'progress' => $progress,
                    'last_error_message' => $lastErrorMessage
                ]);
            }

            $this->updateJobStatus('completed', 'Import completed. Imported: ' . $imported . ', Skipped: ' . $skipped, [
                'imported' => $imported,
                'skipped' => $skipped,
                'last_variant_id' => $lastVariantId,
                'last_action' => $lastAction,
                'last_sku' => $lastSku,
                'last_skip_reason' => $lastSkipReason,
                'progress' => 100,
                'last_error_message' => $lastErrorMessage
            ]);
        } catch (Exception $e) {
            $this->updateJobStatus('failed', 'Import failed: ' . $e->getMessage(), []);
            throw $e;
        } finally {
            if (Storage::exists($this->filePath)) {
                Storage::delete($this->filePath);
            }
        }
    }

    private function mapRow(array $headers, array $row): array
    {
        $resolve = function (array $aliases) use ($headers, $row) {
            foreach ($aliases as $alias) {
                $idx = array_search($alias, $headers);
                if ($idx !== false) {
                    return $row[$idx] ?? null;
                }
            }
            return null;
        };

        $parseBool = function ($val) {
            $v = strtolower(trim((string) $val));
            if ($v === '1' || $v === 'true' || $v === 'ya' || $v === 'aktif') return 1;
            return 0;
        };

        $weight = $resolve(['WEIGHT','BERAT','BERAT KG','BERAT GRAM','BERAT (KG)','BERAT (GRAM)','BERAT VARIAN']);
        $weightNum = is_numeric($weight) ? (float) $weight : 0;
        if ($weightNum > 1000) {
            $weightNum = $weightNum / 1000;
        }

        return [
            'name' => $resolve(['NAME','PRODUCT NAME','PRODUCT_NAME','NAMA PRODUK','NAMA','PRODUK','PRODUCT','NAMA BARANG','ITEM NAME','ITEM']),
            'category' => $resolve(['CATEGORY','KATEGORI','KATEGORI PRODUK']),
            'category_id' => $resolve(['CATEGORY_ID','ID KATEGORI']),
            'description' => $resolve(['DESCRIPTION','DESKRIPSI','KETERANGAN','DESKRIPSI PRODUK']),
            'image' => $resolve(['IMAGE','GAMBAR']),
            'is_active' => $parseBool($resolve(['IS_ACTIVE','AKTIF','STATUS','AKTIF PRODUK','PRODUK AKTIF'])),
            'is_storefront' => $parseBool($resolve(['IS_STOREFRONT','STOREFRONT','TAMPIL','TAMPIL PRODUK','TAMPIL DI ETALASE'])),
            'variant_label' => $resolve(['VARIANT_LABEL','VARIANT','VARIAN','NAMA VARIAN']),
            'sku' => $resolve(['SKU']),
            'price' => $this->parseNumber($resolve(['PRICE','HARGA JUAL','HARGA','HARGA VARIAN'])),
            'base_price' => $this->parseNumber($resolve(['BASE_PRICE','HARGA MODAL','HARGA POKOK','HARGA BELI','HARGA MODAL VARIAN'])),
            'discount_price' => $this->parseNumber($resolve(['DISCOUNT_PRICE','HARGA DISKON','DISKON','HARGA DISKON VARIAN'])),
            'weight' => $weightNum,
            'stock' => (int) ($resolve(['STOCK','STOK','QTY','JUMLAH','STOK VARIAN']) ?? 0),
            'variant_image' => $resolve(['VARIANT_IMAGE','GAMBAR VARIAN','FOTO VARIAN']),
            'variant_is_active' => $parseBool($resolve(['VARIANT_IS_ACTIVE','VARIAN AKTIF','AKTIF VARIAN','STATUS VARIAN'])),
            'variant_is_storefront' => $parseBool($resolve(['VARIANT_IS_STOREFRONT','VARIAN STOREFRONT','VARIAN TAMPIL','TAMPIL VARIAN','VARIAN TAMPIL DI ETALASE'])),
        ];
    }

    private function parseNumber($value)
    {
        if ($value === null) return null;
        $s = trim((string) $value);
        $s = preg_replace('/[^0-9.,-]/', '', $s);
        $hasComma = strpos($s, ',') !== false;
        $hasDot = strpos($s, '.') !== false;
        if ($hasComma && $hasDot) {
            $s = str_replace('.', '', $s);
            $s = str_replace(',', '.', $s);
        } elseif ($hasComma && !$hasDot) {
            $s = str_replace(',', '.', $s);
        } elseif ($hasDot && !$hasComma) {
            $s = str_replace('.', '', $s);
        }
        return is_numeric($s) ? (float) $s : null;
    }

    private function detectHeaderRow(array $data): array
    {
        $maxScan = min(5, count($data));
        for ($i = 0; $i < $maxScan; $i++) {
            $row = $data[$i] ?? [];
            $normalized = array_map(function($h){
                $h = strtoupper(trim((string)$h));
                $h = preg_replace('/\s+\([^\)]*\)/','',$h);
                return $h;
            }, $row);
            $score = 0;
            $hasSku = in_array('SKU', $normalized, true);
            $hasName = in_array('NAME', $normalized, true) || in_array('PRODUCT NAME', $normalized, true) || in_array('PRODUCT_NAME', $normalized, true) || in_array('NAMA PRODUK', $normalized, true) || in_array('NAMA', $normalized, true);
            $hasPrice = in_array('PRICE', $normalized, true) || in_array('HARGA JUAL', $normalized, true) || in_array('HARGA VARIAN', $normalized, true);
            $hasVariantLabel = in_array('NAMA VARIAN', $normalized, true) || in_array('VARIANT LABEL', $normalized, true) || in_array('VARIAN', $normalized, true) || in_array('VARIANT', $normalized, true);
            if ($hasSku) $score++;
            if ($hasName) $score++;
            if ($hasPrice) $score++;
            if ($hasVariantLabel) $score++;
            if ($score >= 2) {
                return [$normalized, $i+1];
            }
        }
        $fallback = array_map(function ($h) { return strtoupper(trim((string) $h)); }, $data[0] ?? []);
        return [$fallback, 1];
    }

    private function generateSku(?string $name, ?string $variant): string
    {
        $baseRaw = strtoupper(($name ?? '').' '.($variant ?? ''));
        $base = preg_replace('/[^A-Z0-9]/', '', $baseRaw);
        if ($base === '') {
            $base = 'PRDVAR';
        }
        $base = substr($base, 0, 12);
        $suffix = substr(strtoupper(uniqid()), -6);
        $sku = $base.'-'.$suffix;
        $attempts = 0;
        while (\App\Models\ProductVariant::where('sku', $sku)->exists() && $attempts < 5) {
            $suffix = substr(strtoupper(uniqid()), -6);
            $sku = $base.'-'.$suffix;
            $attempts++;
        }
        return $sku;
    }

    private function updateJobStatus($status, $message, array $extra = [])
    {
        $jobData = [
            'id' => $this->jobId,
            'status' => $status,
            'message' => $message,
            'updated_at' => now()->toISOString()
        ];
        if (!empty($extra)) {
            $jobData = array_merge($jobData, $extra);
        }

        cache()->put("product_import_job_{$this->jobId}", $jobData, now()->addHours(24));

        if (in_array($status, ['completed', 'failed'])) {
            $activeJobs = cache()->get('active_product_import_jobs', []);
            $activeJobs = array_filter($activeJobs, function ($id) {
                return $id !== $this->jobId;
            });
            cache()->put('active_product_import_jobs', array_values($activeJobs), now()->addHours(24));
        }
    }

    public function getJobId()
    {
        return $this->jobId;
    }
}
