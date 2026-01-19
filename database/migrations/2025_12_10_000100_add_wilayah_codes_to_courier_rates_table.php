<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('courier_rates', function (Blueprint $table) {
            $table->string('destination_province_code', 16)->nullable()->after('destination_province');
            $table->string('destination_regency_code', 16)->nullable()->after('destination_city');
            $table->string('destination_district_code', 32)->nullable()->after('destination_district');

            $table->index('destination_province_code');
            $table->index('destination_regency_code');
            $table->index('destination_district_code');
        });
    }

    public function down(): void
    {
        Schema::table('courier_rates', function (Blueprint $table) {
            $table->dropIndex(['destination_province_code']);
            $table->dropIndex(['destination_regency_code']);
            $table->dropIndex(['destination_district_code']);

            $table->dropColumn(['destination_province_code', 'destination_regency_code', 'destination_district_code']);
        });
    }
};

