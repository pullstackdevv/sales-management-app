<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, migrate existing base_price data from products to variants
        // This assumes that products without variants will get a default variant
        DB::transaction(function () {
            // Get all products that have base_price but no variants
            $productsWithoutVariants = DB::table('products')
                ->leftJoin('product_variants', 'products.id', '=', 'product_variants.product_id')
                ->whereNull('product_variants.id')
                ->whereNotNull('products.base_price')
                ->select('products.*')
                ->get();

            // Create default variants for products without variants
            foreach ($productsWithoutVariants as $product) {
                DB::table('product_variants')->insert([
                    'product_id' => $product->id,
                    'variant_label' => 'Default',
                    'sku' => $product->sku . '-DEFAULT',
                    'price' => $product->base_price,
                    'weight' => 0,
                    'stock' => 0,
                    'is_active' => $product->is_active,
                    'created_by' => $product->created_by,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // For products that already have variants but variants don't have price,
            // set the variant price to product's base_price
            DB::table('product_variants')
                ->join('products', 'product_variants.product_id', '=', 'products.id')
                ->whereNull('product_variants.price')
                ->update([
                    'product_variants.price' => DB::raw('products.base_price')
                ]);
        });

        // Now remove base_price column from products table
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('base_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back base_price column to products
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('base_price', 10, 2)->nullable()->after('image');
        });

        // Migrate price data back from variants to products
        // This will use the minimum price from variants as the base_price
        DB::transaction(function () {
            $products = DB::table('products')->get();
            
            foreach ($products as $product) {
                $minPrice = DB::table('product_variants')
                    ->where('product_id', $product->id)
                    ->min('price');
                
                if ($minPrice) {
                    DB::table('products')
                        ->where('id', $product->id)
                        ->update(['base_price' => $minPrice]);
                }
            }
        });
    }
};
