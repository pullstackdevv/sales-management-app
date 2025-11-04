<?php

use App\Enums\OrderStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 100)->unique();
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('address_id')->constrained('customer_addresses');
            $table->foreignId('user_id')->constrained('users');
            $table->decimal('total_price', 12, 2);
            $table->decimal('shipping_cost', 12, 2);
            $table->string('status')->default(OrderStatus::PENDING->value);
            $table->timestamp('ordered_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
}; 