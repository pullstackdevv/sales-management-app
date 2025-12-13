<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Kaos Polos Premium',
                'sku' => 'KP001',
                'category' => 'Fashion',
                'description' => 'Kaos polos premium dengan bahan cotton combed 30s yang nyaman dan berkualitas tinggi.',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Celana Jeans Slim Fit',
                'sku' => 'CJ001',
                'category' => 'Fashion',
                'description' => 'Celana jeans slim fit dengan potongan modern dan bahan denim berkualitas.',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Sepatu Sneakers Casual',
                'sku' => 'SS001',
                'category' => 'Footwear',
                'description' => 'Sepatu sneakers casual yang nyaman untuk aktivitas sehari-hari.',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Tas Ransel Laptop',
                'sku' => 'TR001',
                'category' => 'Accessories',
                'description' => 'Tas ransel laptop dengan kompartemen khusus dan desain ergonomis.',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Jam Tangan Digital',
                'sku' => 'JT001',
                'category' => 'Accessories',
                'description' => 'Jam tangan digital dengan fitur lengkap dan tahan air.',
                'is_active' => true,
                'created_by' => 1,
            ],
        ];

        foreach ($products as $productData) {
            $product = Product::create($productData);
            
            // Create variants for each product
            if ($product->name === 'Kaos Polos Premium') {
                $colors = ['Putih', 'Hitam', 'Merah', 'Biru'];
                $sizes = ['S', 'M', 'L', 'XL'];
                
                foreach ($colors as $color) {
                    foreach ($sizes as $size) {
                        ProductVariant::create([
                            'product_id' => $product->id,
                            'variant_label' => $color . ' - ' . $size,
                            'sku' => $product->sku . '-' . strtoupper(substr($color, 0, 1)) . $size,
                            'price' => 75000,
                            'weight' => 0.2, // 200 grams for t-shirt
                            'stock' => rand(5, 15),
                            'is_active' => true,
                        ]);
                    }
                }
            } elseif ($product->name === 'Celana Jeans Slim Fit') {
                $sizes = ['28', '29', '30', '31', '32', '33', '34'];
                
                foreach ($sizes as $size) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_label' => 'Size ' . $size,
                        'sku' => $product->sku . '-' . $size,
                        'price' => 250000,
                        'weight' => 0.5, // 500 grams for jeans
                        'stock' => rand(3, 8),
                        'is_active' => true,
                    ]);
                }
            } elseif ($product->name === 'Sepatu Sneakers Casual') {
                $sizes = ['39', '40', '41', '42', '43', '44'];
                
                foreach ($sizes as $size) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_label' => 'Size ' . $size,
                        'sku' => $product->sku . '-' . $size,
                        'price' => 350000,
                        'weight' => 0.8, // 800 grams for sneakers
                        'stock' => rand(2, 6),
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
