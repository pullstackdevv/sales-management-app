<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
            Schema::table('courier_rates', function (Blueprint $table) {
            // Add new columns
            $table->string('destination_province')->nullable()->after('destination_city');
            $table->string('destination_district')->nullable()->after('destination_province');
            
            // Add pricing columns
            $table->decimal('base_price', 10, 2)->nullable()->after('price_per_kg');
            
            // Add availability columns
            $table->boolean('is_available')->default(true)->after('base_price');
            
            // Add estimated days as integer
            $table->integer('estimated_days')->nullable()->after('is_available');
        });
        
        // Add indexes
        Schema::table('courier_rates', function (Blueprint $table) {
            $table->index(['destination_province', 'destination_city', 'destination_district'], 'idx_destination_location');
            $table->index(['courier_id', 'service_type', 'is_available'], 'idx_courier_service_available');
            $table->index(['is_available'], 'idx_availability');
        });
    }



    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courier_rates', function (Blueprint $table) {
            // Drop indexes
            try {
                $table->dropIndex('idx_destination_location');
                $table->dropIndex('idx_courier_service_available');
                $table->dropIndex('idx_availability');
            } catch (Exception $e) {
                // Ignore if index doesn't exist
            }
            
            // Drop columns if they exist
            $columnsToCheck = [
                'destination_province',
                'destination_district',
                'base_price',
                'is_available',
                'estimated_days'
            ];
            
            foreach ($columnsToCheck as $column) {
                if (Schema::hasColumn('courier_rates', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
