<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->enum('type', ['percentage', 'fixed', 'free_sample', 'shipping', 'shipping_free_sample'])->change();
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->enum('type', ['percentage', 'fixed', 'free_sample', 'shipping'])->change();
        });
    }
};

