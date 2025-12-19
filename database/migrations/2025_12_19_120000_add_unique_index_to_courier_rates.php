<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('courier_rates', function (Blueprint $table) {
            $table->index([
                'courier_id',
                'destination_province',
                'destination_city',
                'destination_district',
                'service_type'
            ], 'idx_courier_destination_service');
        });
    }

    public function down(): void
    {
        Schema::table('courier_rates', function (Blueprint $table) {
            try {
                $table->dropIndex('idx_courier_destination_service');
            } catch (\Exception $e) {
            }
        });
    }
};
