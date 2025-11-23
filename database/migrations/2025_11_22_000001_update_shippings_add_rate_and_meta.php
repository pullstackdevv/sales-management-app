<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shippings', function (Blueprint $table) {
            if (!Schema::hasColumn('shippings', 'courier_rate_id')) {
                $table->foreignId('courier_rate_id')->nullable()->constrained('courier_rates');
            }
            if (!Schema::hasColumn('shippings', 'status')) {
                $table->string('status', 50)->default('pending');
            }
            if (!Schema::hasColumn('shippings', 'weight')) {
                $table->decimal('weight', 10, 2)->nullable()->default(0);
            }
            if (!Schema::hasColumn('shippings', 'dimensions')) {
                $table->json('dimensions')->nullable();
            }
            if (!Schema::hasColumn('shippings', 'notes')) {
                $table->string('notes', 255)->nullable();
            }
            if (!Schema::hasColumn('shippings', 'service_type')) {
                $table->string('service_type', 100)->nullable();
            }
            if (!Schema::hasColumn('shippings', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users');
            }
            if (!Schema::hasColumn('shippings', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->constrained('users');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shippings', function (Blueprint $table) {
            if (Schema::hasColumn('shippings', 'courier_rate_id')) {
                $table->dropConstrainedForeignId('courier_rate_id');
            }
            if (Schema::hasColumn('shippings', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
            if (Schema::hasColumn('shippings', 'updated_by')) {
                $table->dropConstrainedForeignId('updated_by');
            }
            if (Schema::hasColumn('shippings', 'status')) {
                $table->dropColumn('status');
            }
            if (Schema::hasColumn('shippings', 'weight')) {
                $table->dropColumn('weight');
            }
            if (Schema::hasColumn('shippings', 'dimensions')) {
                $table->dropColumn('dimensions');
            }
            if (Schema::hasColumn('shippings', 'notes')) {
                $table->dropColumn('notes');
            }
            if (Schema::hasColumn('shippings', 'service_type')) {
                $table->dropColumn('service_type');
            }
        });
    }
};