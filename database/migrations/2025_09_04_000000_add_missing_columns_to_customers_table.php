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
        Schema::table('customers', function (Blueprint $table) {
            $table->string('line_id')->nullable()->after('email');
            $table->string('other_contact')->nullable()->after('line_id');
            $table->string('category')->default('Pelanggan')->after('other_contact');
            $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['updated_by']);
            $table->dropColumn(['line_id', 'other_contact', 'category', 'updated_by']);
        });
    }
};