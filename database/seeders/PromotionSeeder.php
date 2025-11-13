<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Promotion;
use App\Models\User;
use Carbon\Carbon;

class PromotionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get first user as creator
        $user = User::first();
        $userId = $user ? $user->id : null;

        $promotions = [
            [
                'title' => 'Diskon Akhir Tahun 2025',
                'description' => 'Dapatkan diskon hingga 50% untuk semua produk pilihan. Promo berlaku untuk pembelian minimal Rp 500.000. Buruan belanja sebelum kehabisan!',
                'is_active' => true,
                'is_storefront' => true,
                'start_date' => Carbon::now()->subDays(5),
                'end_date' => Carbon::now()->addDays(25),
                'created_by' => $userId,
            ],
            [
                'title' => 'Flash Sale Setiap Jumat',
                'description' => 'Jangan lewatkan Flash Sale setiap hari Jumat! Diskon spesial untuk produk-produk terpilih. Hanya berlaku dari jam 10:00 - 14:00 WIB.',
                'is_active' => true,
                'is_storefront' => true,
                'start_date' => Carbon::now()->subDays(2),
                'end_date' => Carbon::now()->addMonths(1),
                'created_by' => $userId,
            ],
            [
                'title' => 'Gratis Ongkir Seluruh Indonesia',
                'description' => 'Belanja lebih hemat dengan gratis ongkir ke seluruh Indonesia untuk pembelian minimal Rp 300.000. Promo terbatas!',
                'is_active' => true,
                'is_storefront' => true,
                'start_date' => Carbon::now()->subDays(10),
                'end_date' => Carbon::now()->addDays(20),
                'created_by' => $userId,
            ],
            [
                'title' => 'Promo Spesial Member Baru',
                'description' => 'Selamat datang member baru! Dapatkan diskon 20% untuk pembelian pertama Anda. Gunakan kode voucher NEWMEMBER saat checkout.',
                'is_active' => true,
                'is_storefront' => true,
                'start_date' => Carbon::now()->subMonths(1),
                'end_date' => Carbon::now()->addMonths(2),
                'created_by' => $userId,
            ],
            [
                'title' => 'Cashback 10% Setiap Transaksi',
                'description' => 'Belanja makin untung! Dapatkan cashback 10% untuk setiap transaksi dengan maksimal cashback Rp 100.000 per transaksi.',
                'is_active' => true,
                'is_storefront' => false,
                'start_date' => Carbon::now()->subDays(15),
                'end_date' => Carbon::now()->addDays(15),
                'created_by' => $userId,
            ],
            [
                'title' => 'Promo Ramadhan (Expired)',
                'description' => 'Promo spesial bulan Ramadhan dengan diskon hingga 30% untuk produk-produk pilihan. Berkah belanja di bulan penuh berkah.',
                'is_active' => false,
                'is_storefront' => false,
                'start_date' => Carbon::now()->subMonths(3),
                'end_date' => Carbon::now()->subMonths(2),
                'created_by' => $userId,
            ],
            [
                'title' => 'Bundling Hemat 3 Item',
                'description' => 'Beli 3 item sekaligus dan dapatkan harga spesial! Hemat hingga Rp 150.000 untuk paket bundling pilihan.',
                'is_active' => true,
                'is_storefront' => true,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addDays(30),
                'created_by' => $userId,
            ],
            [
                'title' => 'Promo Midnight Sale',
                'description' => 'Belanja tengah malam lebih seru! Dapatkan diskon ekstra 15% untuk transaksi antara jam 00:00 - 03:00 WIB.',
                'is_active' => true,
                'is_storefront' => true,
                'start_date' => Carbon::now()->subDays(7),
                'end_date' => Carbon::now()->addDays(23),
                'created_by' => $userId,
            ],
        ];

        foreach ($promotions as $promotion) {
            Promotion::create($promotion);
        }
    }
}
