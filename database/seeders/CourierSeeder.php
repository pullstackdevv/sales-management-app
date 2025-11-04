<?php

namespace Database\Seeders;

use App\Models\Courier;
use Illuminate\Database\Seeder;

class CourierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $couriers = [
            [
                'name' => 'JNE Express',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'J&T Express',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'SiCepat Express',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'TIKI',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Pos Indonesia',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'AnterAja',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Ninja Express',
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'name' => 'Lion Parcel',
                'is_active' => true,
                'created_by' => 1,
            ],
        ];

        foreach ($couriers as $courier) {
            Courier::create($courier);
        }
    }
}
