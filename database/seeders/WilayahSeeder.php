<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class WilayahSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Path ke file wilayah.sql
        $sqlFile = base_path('wilayah.sql');
        
        if (!File::exists($sqlFile)) {
            $this->command->error('File wilayah.sql tidak ditemukan di root project!');
            return;
        }
        
        $this->command->info('Mengimpor data wilayah dari wilayah.sql...');
        
        // Baca file SQL
        $sql = File::get($sqlFile);
        
        // Hapus komentar dan baris kosong
        $sql = preg_replace('/--.*$/m', '', $sql);
        $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
        
        // Split berdasarkan semicolon untuk mendapatkan statement terpisah
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        
        DB::beginTransaction();
        
        try {
            foreach ($statements as $statement) {
                if (!empty($statement) && !str_starts_with(strtoupper($statement), 'DROP') && !str_starts_with(strtoupper($statement), 'CREATE')) {
                    DB::unprepared($statement . ';');
                }
            }
            
            DB::commit();
            $this->command->info('Data wilayah berhasil diimpor!');
            
        } catch (\Exception $e) {
            DB::rollback();
            $this->command->error('Error saat mengimpor data: ' . $e->getMessage());
        }
    }
}
