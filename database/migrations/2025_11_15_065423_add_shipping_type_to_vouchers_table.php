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
        Schema::table('vouchers', function (Blueprint $table) {
            // Modify the enum type to include 'shipping'
            $table->enum('type', ['percentage', 'fixed', 'free_sample', 'shipping'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            // Revert to original enum type
            $table->enum('type', ['percentage', 'fixed', 'free_sample'])->change();
        });
    }
};
