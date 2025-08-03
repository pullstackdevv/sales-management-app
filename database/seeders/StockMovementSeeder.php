<?php

namespace Database\Seeders;

use App\Models\StockMovement;
use App\Models\ProductVariant;
use App\Enums\StockMovementType;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class StockMovementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $productVariants = ProductVariant::all();

        $movements = [];

        // Create initial stock movements (stock in)
        foreach ($productVariants as $variant) {
            $movements[] = [
                'product_variant_id' => $variant->id,
                'type' => StockMovementType::IN,
                'quantity' => $variant->stock,
                'note' => 'Initial stock for ' . $variant->variant_label,
                'created_by' => 1,
                'created_at' => Carbon::now()->subDays(30),
                'updated_at' => Carbon::now()->subDays(30),
            ];
        }

        // Create some additional stock movements
        $additionalMovements = [
            [
                'product_variant_id' => $productVariants->random()->id,
                'type' => StockMovementType::IN,
                'quantity' => 20,
                'note' => 'Restocking from supplier',
                'created_by' => 1,
                'created_at' => Carbon::now()->subDays(20),
                'updated_at' => Carbon::now()->subDays(20),
            ],
            [
                'product_variant_id' => $productVariants->random()->id,
                'type' => StockMovementType::OUT,
                'quantity' => 5,
                'note' => 'Sold to customer',
                'created_by' => 1,
                'created_at' => Carbon::now()->subDays(15),
                'updated_at' => Carbon::now()->subDays(15),
            ],
            [
                'product_variant_id' => $productVariants->random()->id,
                'type' => StockMovementType::IN,
                'quantity' => 15,
                'note' => 'Return from customer',
                'created_by' => 1,
                'created_at' => Carbon::now()->subDays(10),
                'updated_at' => Carbon::now()->subDays(10),
            ],
            [
                'product_variant_id' => $productVariants->random()->id,
                'type' => StockMovementType::OUT,
                'quantity' => 3,
                'note' => 'Damaged goods',
                'created_by' => 1,
                'created_at' => Carbon::now()->subDays(8),
                'updated_at' => Carbon::now()->subDays(8),
            ],
            [
                'product_variant_id' => $productVariants->random()->id,
                'type' => StockMovementType::IN,
                'quantity' => 25,
                'note' => 'New stock arrival',
                'created_by' => 1,
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ],
            [
                'product_variant_id' => $productVariants->random()->id,
                'type' => StockMovementType::OUT,
                'quantity' => 8,
                'note' => 'Bulk order fulfillment',
                'created_by' => 1,
                'created_at' => Carbon::now()->subDays(3),
                'updated_at' => Carbon::now()->subDays(3),
            ],
            [
                'product_variant_id' => $productVariants->random()->id,
                'type' => StockMovementType::IN,
                'quantity' => 12,
                'note' => 'Emergency restock',
                'created_by' => 1,
                'created_at' => Carbon::now()->subDays(1),
                'updated_at' => Carbon::now()->subDays(1),
            ],
        ];

        $movements = array_merge($movements, $additionalMovements);

        foreach ($movements as $movement) {
            StockMovement::create($movement);
        }
    }
}