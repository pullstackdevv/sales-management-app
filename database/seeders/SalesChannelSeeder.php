<?php

namespace Database\Seeders;

use App\Models\SalesChannel;
use Illuminate\Database\Seeder;

class SalesChannelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $salesChannels = [
            [
                'name' => 'Website Resmi',
                'code' => 'WEBSITE',
                'description' => 'Website resmi perusahaan',
                'platform' => 'website',
                'url' => 'https://example.com',
                'is_active' => true,
            ],
            [
                'name' => 'Shopee',
                'code' => 'SHOPEE',
                'description' => 'Toko online di platform Shopee',
                'platform' => 'shopee',
                'url' => 'https://shopee.co.id',
                'is_active' => true,
            ],
            [
                'name' => 'Tokopedia',
                'code' => 'TOKOPEDIA',
                'description' => 'Toko online di platform Tokopedia',
                'platform' => 'tokopedia',
                'url' => 'https://tokopedia.com',
                'is_active' => true,
            ],
            [
                'name' => 'Lazada',
                'code' => 'LAZADA',
                'description' => 'Toko online di platform Lazada',
                'platform' => 'lazada',
                'url' => 'https://lazada.co.id',
                'is_active' => true,
            ],
            [
                'name' => 'Bukalapak',
                'code' => 'BUKALAPAK',
                'description' => 'Toko online di platform Bukalapak',
                'platform' => 'bukalapak',
                'url' => 'https://bukalapak.com',
                'is_active' => true,
            ],
            [
                'name' => 'Instagram',
                'code' => 'INSTAGRAM',
                'description' => 'Penjualan melalui Instagram',
                'platform' => 'instagram',
                'url' => 'https://instagram.com',
                'is_active' => true,
            ],
            [
                'name' => 'Facebook',
                'code' => 'FACEBOOK',
                'description' => 'Penjualan melalui Facebook',
                'platform' => 'facebook',
                'url' => 'https://facebook.com',
                'is_active' => true,
            ],
            [
                'name' => 'WhatsApp',
                'code' => 'WHATSAPP',
                'description' => 'Penjualan melalui WhatsApp',
                'platform' => 'whatsapp',
                'url' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Toko Offline',
                'code' => 'OFFLINE',
                'description' => 'Toko fisik/offline',
                'platform' => 'offline',
                'url' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Marketplace Lainnya',
                'code' => 'OTHER',
                'description' => 'Marketplace atau platform lainnya',
                'platform' => 'other',
                'url' => null,
                'is_active' => true,
            ],
        ];

        foreach ($salesChannels as $salesChannel) {
            SalesChannel::create($salesChannel);
        }
    }
} 