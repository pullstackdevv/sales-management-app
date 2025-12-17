<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->string('province_code', 16)->nullable()->after('province');
            $table->string('city_code', 16)->nullable()->after('city');
            $table->string('regency_code', 16)->nullable()->after('city_code');
            $table->string('district_code', 32)->nullable()->after('district');

            $table->index('province_code');
            $table->index('city_code');
            $table->index('regency_code');
            $table->index('district_code');
        });
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropIndex(['province_code']);
            $table->dropIndex(['city_code']);
            $table->dropIndex(['regency_code']);
            $table->dropIndex(['district_code']);
            $table->dropColumn(['province_code', 'city_code', 'regency_code', 'district_code']);
        });
    }
};

