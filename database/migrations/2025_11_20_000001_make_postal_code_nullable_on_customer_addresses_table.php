<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE customer_addresses MODIFY postal_code VARCHAR(10) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE customer_addresses MODIFY postal_code VARCHAR(10) NOT NULL');
    }
};