<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('end_date');
            $table->index('sort_order');
        });

        $rows = DB::table('promotions')
            ->orderBy('created_at', 'asc')
            ->select('id')
            ->get();

        $order = 0;
        foreach ($rows as $row) {
            DB::table('promotions')->where('id', $row->id)->update(['sort_order' => $order]);
            $order++;
        }
    }

    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropIndex(['sort_order']);
            $table->dropColumn('sort_order');
        });
    }
};

