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
        Schema::create('order_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->string('action'); // 'created', 'updated', 'status_changed', 'payment_updated', 'shipping_updated'
            $table->string('field_name')->nullable(); // nama field yang diubah
            $table->text('old_value')->nullable(); // nilai lama
            $table->text('new_value')->nullable(); // nilai baru
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // siapa yang melakukan perubahan
            $table->string('user_name')->nullable(); // nama user saat perubahan (backup jika user dihapus)
            $table->string('ip_address')->nullable(); // IP address user
            $table->text('user_agent')->nullable(); // browser/device info
            $table->json('metadata')->nullable(); // data tambahan jika diperlukan
            $table->timestamps();
            
            $table->index(['order_id', 'created_at']);
            $table->index(['action', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_audit_logs');
    }
};
