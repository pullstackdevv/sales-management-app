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
        Schema::table('orders', function (Blueprint $table) {
            // Guest checkout fields
            if (!Schema::hasColumn('orders', 'guest_email')) {
                $table->string('guest_email')->nullable()->after('customer_id');
            }
            if (!Schema::hasColumn('orders', 'guest_phone')) {
                $table->string('guest_phone')->nullable()->after('guest_email');
            }
            
            // Order notes
            if (!Schema::hasColumn('orders', 'notes')) {
                $table->text('notes')->nullable()->after('ordered_at');
            }
            
            // Midtrans payment fields
            if (!Schema::hasColumn('orders', 'payment_token')) {
                $table->string('payment_token')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('orders', 'payment_url')) {
                $table->string('payment_url')->nullable()->after('payment_token');
            }
            if (!Schema::hasColumn('orders', 'payment_status')) {
                $table->enum('payment_status', ['pending', 'paid', 'failed', 'expired', 'cancelled'])->default('pending')->after('payment_url');
            }
            
            // Make user_id nullable for guest checkout
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $columns = ['guest_email', 'guest_phone', 'notes', 'payment_token', 'payment_url', 'payment_status'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
            
            // Revert user_id to not nullable
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
