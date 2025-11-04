<?php

namespace Database\Seeders;

use App\Models\Voucher;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class VoucherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vouchers = [
            [
                'code' => 'WELCOME10',
                'name' => 'Welcome Discount 10%',
                'description' => 'Diskon 10% untuk pelanggan baru',
                'type' => 'percentage',
                'value' => 10,
                'minimum_amount' => 100000,
                'maximum_discount' => 50000,
                'usage_limit' => 100,
                'used_count' => 5,
                'start_date' => Carbon::now()->subDays(30),
                'end_date' => Carbon::now()->addDays(60),
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'code' => 'SAVE50K',
                'name' => 'Hemat 50 Ribu',
                'description' => 'Potongan langsung Rp 50.000',
                'type' => 'fixed',
                'value' => 50000,
                'minimum_amount' => 200000,
                'maximum_discount' => null,
                'usage_limit' => 50,
                'used_count' => 12,
                'start_date' => Carbon::now()->subDays(15),
                'end_date' => Carbon::now()->addDays(45),
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'code' => 'FLASH20',
                'name' => 'Flash Sale 20%',
                'description' => 'Diskon flash sale 20% untuk semua produk',
                'type' => 'percentage',
                'value' => 20,
                'minimum_amount' => 150000,
                'maximum_discount' => 100000,
                'usage_limit' => 200,
                'used_count' => 45,
                'start_date' => Carbon::now()->subDays(7),
                'end_date' => Carbon::now()->addDays(7),
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'code' => 'MEMBER15',
                'name' => 'Member Exclusive 15%',
                'description' => 'Diskon khusus member 15%',
                'type' => 'percentage',
                'value' => 15,
                'minimum_amount' => 300000,
                'maximum_discount' => 75000,
                'usage_limit' => null,
                'used_count' => 23,
                'start_date' => Carbon::now()->subDays(60),
                'end_date' => Carbon::now()->addDays(90),
                'is_active' => true,
                'created_by' => 1,
            ],
            [
                'code' => 'EXPIRED10',
                'name' => 'Expired Voucher',
                'description' => 'Voucher yang sudah expired',
                'type' => 'percentage',
                'value' => 10,
                'minimum_amount' => 100000,
                'maximum_discount' => 30000,
                'usage_limit' => 50,
                'used_count' => 15,
                'start_date' => Carbon::now()->subDays(90),
                'end_date' => Carbon::now()->subDays(30),
                'is_active' => false,
                'created_by' => 1,
            ],
        ];

        foreach ($vouchers as $voucher) {
            Voucher::create($voucher);
        }
    }
}