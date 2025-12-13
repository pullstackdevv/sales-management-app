<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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
                'name' => 'Best Seller (Customer Favorites)',
                'description' => 'Produk terlaris berdasarkan penilaian customer',
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

        // Handle rename: keep existing associations by renaming old tag and merging duplicates
        $renameMap = [
            'Best Seller' => 'Best Seller (Customer Favorites)',
        ];

        foreach ($renameMap as $oldName => $newName) {
            $oldTag = Tag::where('name', $oldName)->first();
            if ($oldTag) {
                $dupNew = Tag::where('name', $newName)->first();
                if ($dupNew) {
                    DB::table('product_tag')
                        ->where('tag_id', $dupNew->id)
                        ->update(['tag_id' => $oldTag->id]);
                    $dupNew->forceDelete();
                }
                $oldTag->update(['name' => $newName]);
            }
        }

        // Upsert desired tags
        foreach ($tags as $data) {
            Tag::updateOrCreate(['name' => $data['name']], $data);
        }

        // Remove any tags not in the desired list (hard delete to cascade pivot rows)
        $desiredNames = collect($tags)->pluck('name')->all();
        Tag::whereNotIn('name', $desiredNames)->forceDelete();
    }
}
