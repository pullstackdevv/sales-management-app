<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tag;
use App\Models\User;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $userId = User::first()?->id ?? 1;

        $tags = [
            [
                'name' => 'New Arrivals',
                'description' => 'Produk terbaru',
                'is_active' => true,
                'created_by' => $userId,
            ],
            [
                'name' => 'Best Seller',
                'description' => 'Produk terlaris',
                'is_active' => true,
                'created_by' => $userId,
            ],
            [
                'name' => 'Promo / Diskon',
                'description' => 'Produk promo atau diskon',
                'is_active' => true,
                'created_by' => $userId,
            ],
        ];

        foreach ($tags as $data) {
            Tag::updateOrCreate(['name' => $data['name']], $data);
        }
    }
}

