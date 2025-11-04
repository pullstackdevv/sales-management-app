<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courier_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('courier_id')->constrained('couriers');
            $table->string('origin_city', 100);
            $table->string('destination_city', 100);
            $table->string('service_type', 100);
            $table->decimal('price_per_kg', 12, 2);
            $table->string('etd_days', 20);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courier_rates');
    }
}; 