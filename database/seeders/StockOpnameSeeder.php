<?php

namespace Database\Seeders;

use App\Models\StockOpname;
use App\Models\StockOpnameDetail;
use App\Models\ProductVariant;
use App\Enums\StockOpnameStatus;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class StockOpnameSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $productVariants = ProductVariant::all();

        $stockOpnames = [
            [
                'opname_date' => Carbon::now()->subDays(30),
                'status' => StockOpnameStatus::FINALIZED,
                'created_by' => 1,
                'note' => 'Stock opname bulanan - Januari 2025',
                'created_at' => Carbon::now()->subDays(30),
                'updated_at' => Carbon::now()->subDays(28),
            ],
            [
                'opname_date' => Carbon::now()->subDays(15),
                'status' => StockOpnameStatus::FINALIZED,
                'created_by' => 1,
                'note' => 'Stock opname mingguan - Week 2',
                'created_at' => Carbon::now()->subDays(15),
                'updated_at' => Carbon::now()->subDays(14),
            ],
            [
                'opname_date' => Carbon::now()->subDays(7),
                'status' => StockOpnameStatus::DRAFT,
                'created_by' => 1,
                'note' => 'Stock opname mingguan - Week 3',
                'created_at' => Carbon::now()->subDays(7),
                'updated_at' => Carbon::now()->subDays(6),
            ],
            [
                'opname_date' => Carbon::now()->subDays(2),
                'status' => StockOpnameStatus::DRAFT,
                'created_by' => 1,
                'note' => 'Stock opname persiapan akhir bulan',
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ],
            [
                'opname_date' => Carbon::now(),
                'status' => StockOpnameStatus::DRAFT,
                'created_by' => 1,
                'note' => 'Stock opname harian',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        foreach ($stockOpnames as $opnameData) {
            $stockOpname = StockOpname::create($opnameData);
            
            // Create stock opname details for finalized opnames
            if ($stockOpname->status === StockOpnameStatus::FINALIZED) {
                $variantsToCheck = $productVariants->random(rand(5, 10));
                
                foreach ($variantsToCheck as $variant) {
                    $systemStock = $variant->stock;
                    $actualStock = $systemStock + rand(-3, 3); // Simulate small differences
                    
                    StockOpnameDetail::create([
                        'stock_opname_id' => $stockOpname->id,
                        'product_variant_id' => $variant->id,
                        'system_stock' => $systemStock,
                        'real_stock' => max(0, $actualStock), // Ensure non-negative
                        'difference' => $actualStock - $systemStock,
                    ]);
                }
            }
        }
    }
}