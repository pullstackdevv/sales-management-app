<?php

namespace Database\Seeders;

use App\Models\LoyaltySetting;
use App\Models\LoyaltyTier;
use Illuminate\Database\Seeder;

class LoyaltySeeder extends Seeder
{
    public function run(): void
    {
        // Default Settings
        $settings = [
            [
                'key' => 'point_rate',
                'value' => '10000',
                'description' => 'Berapa rupiah untuk mendapatkan 1 poin (default: Rp 10.000 = 1 poin)',
                'is_active' => true,
            ],
            [
                'key' => 'min_redeem_amount',
                'value' => '50000',
                'description' => 'Minimal nilai rupiah yang bisa di-redeem',
                'is_active' => true,
            ],
            [
                'key' => 'max_redeem_percentage',
                'value' => '20',
                'description' => 'Maksimal persentase redeem dari total transaksi',
                'is_active' => true,
            ],
            [
                'key' => 'redeem_options',
                'value' => '50000,100000,200000',
                'description' => 'Pilihan nilai rupiah untuk redeem (pisahkan dengan koma)',
                'is_active' => true,
            ],
            [
                'key' => 'loyalty_active',
                'value' => '1',
                'description' => 'Status aktif sistem loyalty',
                'is_active' => true,
            ],
        ];

        foreach ($settings as $setting) {
            LoyaltySetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        // Default Tiers (threshold belanja tahunan)
        // Pretty Pink: Rp 0 - 1.5jt
        // Pretty Gold: Rp 1.5jt - ? (placeholder, owner bisa edit)
        // Pretty Luxe: Rp ? + (placeholder, owner bisa edit)
        $tiers = [
            [
                'name' => 'Pretty Pink',
                'slug' => 'pretty-pink',
                'min_annual_spend' => 0,
                'max_annual_spend' => 1500000, // Rp 1.500.000
                'multiplier' => 1.00,
                'color' => '#ec4899',
                'icon' => 'solar:heart-outline',
                'benefits' => "Akses program loyalty\nKumpulkan poin dari setiap pembelian\nTukar poin dengan diskon",
                'order' => 0,
                'is_active' => true,
            ],
            [
                'name' => 'Pretty Gold',
                'slug' => 'pretty-gold',
                'min_annual_spend' => 1500001, // Rp 1.500.001
                'max_annual_spend' => 5000000, // Placeholder: Rp 5.000.000
                'multiplier' => 1.50,
                'color' => '#f59e0b',
                'icon' => 'solar:star-outline',
                'benefits' => "Semua benefit Pretty Pink\nMultiplier poin 1.5x\nAkses promo eksklusif\nPrioritas customer service",
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Pretty Luxe',
                'slug' => 'pretty-luxe',
                'min_annual_spend' => 5000001, // Rp 5.000.001
                'max_annual_spend' => 999999999999, // Unlimited (tier tertinggi - nilai sangat besar)
                'multiplier' => 2.00,
                'color' => '#8b5cf6',
                'icon' => 'solar:crown-outline',
                'benefits' => "Semua benefit Pretty Gold\nMultiplier poin 2x\nGratis ongkir\nAkses early sale\nHadiah ulang tahun spesial",
                'order' => 2,
                'is_active' => true,
            ],
        ];

        foreach ($tiers as $tier) {
            LoyaltyTier::updateOrCreate(
                ['slug' => $tier['slug']],
                $tier
            );
        }

        $this->command->info('Loyalty settings and tiers seeded successfully!');
        $this->command->info('Note: Tier thresholds are placeholders. Configure via CMS > Loyalty & Rewards.');
    }
}
