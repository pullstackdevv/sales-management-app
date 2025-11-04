<?php

use App\Enums\StockOpnameStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id();
            $table->date('opname_date');
            $table->string('status')->default(StockOpnameStatus::DRAFT->value);
            $table->foreignId('created_by')->constrained('users');
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opnames');
    }
};