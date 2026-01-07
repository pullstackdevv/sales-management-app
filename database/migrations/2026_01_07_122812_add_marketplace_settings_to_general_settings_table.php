<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insert default settings
        $settings = [
            [
                'setting_name' => 'marketplace_admin_fee',
                'setting_value' => '10',
                'description' => 'Marketplace Admin Fee (%)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_name' => 'marketplace_insurance_fee',
                'setting_value' => '0.75',
                'description' => 'Marketplace Insurance Fee (%)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_name' => 'marketplace_promo_fee',
                'setting_value' => '4.5',
                'description' => 'Marketplace Promo Fee (%)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_name' => 'marketplace_promo_fee_max',
                'setting_value' => '60000',
                'description' => 'Marketplace Promo Fee Max Amount',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_name' => 'marketplace_shipping_fee',
                'setting_value' => '4',
                'description' => 'Marketplace Shipping Fee (%)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_name' => 'marketplace_shipping_fee_max',
                'setting_value' => '40000',
                'description' => 'Marketplace Shipping Fee Max Amount',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_name' => 'marketplace_process_fee',
                'setting_value' => '1500',
                'description' => 'Marketplace Process Fee (Fixed)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('general_settings')->insertOrIgnore($settings);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('general_settings')->whereIn('setting_name', [
            'marketplace_admin_fee',
            'marketplace_insurance_fee',
            'marketplace_promo_fee',
            'marketplace_promo_fee_max',
            'marketplace_shipping_fee',
            'marketplace_shipping_fee_max',
            'marketplace_process_fee'
        ])->delete();
    }
};
