<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create categories first
        $fashionCategory = ProductCategory::firstOrCreate([
            'name' => 'Fashion',
            'slug' => 'fashion',
            'description' => 'Pakaian dan fashion items',
            'is_active' => true,
        ]);

        $footwearCategory = ProductCategory::firstOrCreate([
            'name' => 'Footwear',
            'slug' => 'footwear',
            'description' => 'Sepatu dan alas kaki',
            'is_active' => true,
        ]);

        $accessoriesCategory = ProductCategory::firstOrCreate([
            'name' => 'Accessories',
            'slug' => 'accessories',
            'description' => 'Aksesoris dan pelengkap',
            'is_active' => true,
        ]);

        $products = [
            [
                'name' => 'Kaos Polos Premium',
                'category' => 'Fashion',
                'category_id' => $fashionCategory->id,
                'description' => 'Kaos polos premium dengan bahan cotton combed 30s yang nyaman dan berkualitas tinggi.',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Celana Jeans Slim Fit',
                'category' => 'Fashion',
                'category_id' => $fashionCategory->id,
                'description' => 'Celana jeans slim fit dengan potongan modern dan bahan denim berkualitas.',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Sepatu Sneakers Casual',
                'category' => 'Footwear',
                'category_id' => $footwearCategory->id,
                'description' => 'Sepatu sneakers casual yang nyaman untuk aktivitas sehari-hari.',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Tas Ransel Laptop',
                'category' => 'Accessories',
                'category_id' => $accessoriesCategory->id,
                'description' => 'Tas ransel laptop dengan kompartemen khusus dan desain ergonomis.',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Jam Tangan Digital',
                'category' => 'Accessories',
                'category_id' => $accessoriesCategory->id,
                'description' => 'Jam tangan digital dengan fitur lengkap dan tahan air.',
                'is_active' => true,
                'created_by' => 1,
            ],
        ];

        foreach ($products as $productData) {
            $product = Product::create($productData);

            if (!empty($productData['category_id'])) {
                $product->categories()->sync([$productData['category_id']]);
            }
            
            // Generate base SKU from product name
            $baseSku = strtoupper(substr(str_replace(' ', '', $product->name), 0, 6));
            
            // Create variants for each product
            if ($product->name === 'Kaos Polos Premium') {
                $colors = ['Putih', 'Hitam', 'Merah', 'Biru'];
                $sizes = ['S', 'M', 'L', 'XL'];
                $variantIndex = 1;
                
                foreach ($colors as $color) {
                    foreach ($sizes as $size) {
                        ProductVariant::create([
                            'product_id' => $product->id,
                            'variant_label' => $color . ' - ' . $size,
                            'sku' => $baseSku . '-' . str_pad($variantIndex, 3, '0', STR_PAD_LEFT),
                            'price' => 75000,
                            'base_price' => 75000,
                            'weight' => 0.2, // 200 grams for t-shirt
                            'stock' => rand(5, 15),
                            'is_active' => true,
                        ]);
                        $variantIndex++;
                    }
                }
            } elseif ($product->name === 'Celana Jeans Slim Fit') {
                $sizes = ['28', '29', '30', '31', '32', '33', '34'];
                $variantIndex = 1;
                
                foreach ($sizes as $size) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_label' => 'Size ' . $size,
                        'sku' => $baseSku . '-' . str_pad($variantIndex, 3, '0', STR_PAD_LEFT),
                        'price' => 250000,
                        'base_price' => 250000,
                        'weight' => 0.5, // 500 grams for jeans
                        'stock' => rand(3, 8),
                        'is_active' => true,
                    ]);
                    $variantIndex++;
                }
            } elseif ($product->name === 'Sepatu Sneakers Casual') {
                $sizes = ['39', '40', '41', '42', '43', '44'];
                $variantIndex = 1;
                
                foreach ($sizes as $size) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_label' => 'Size ' . $size,
                        'sku' => $baseSku . '-' . str_pad($variantIndex, 3, '0', STR_PAD_LEFT),
                        'price' => 350000,
                        'base_price' => 350000,
                        'weight' => 0.8, // 800 grams for sneakers
                        'stock' => rand(2, 6),
                        'is_active' => true,
                    ]);
                    $variantIndex++;
                }
            } else {
                // Create default variant for products without specific variants
                ProductVariant::create([
                    'product_id' => $product->id,
                    'variant_label' => 'Default',
                    'sku' => $baseSku . '-001',
                    'price' => 100000,
                    'base_price' => 100000,
                    'weight' => 0.3,
                    'stock' => rand(10, 20),
                    'is_active' => true,
                ]);
            }
        }
    }
}
