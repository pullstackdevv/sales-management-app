<?php

namespace Database\Seeders;

use App\Models\Expense;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ExpenseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $expenses = [
            [
                'name' => 'Sewa Kantor Bulan Januari',
                'description' => 'Pembayaran sewa kantor untuk bulan Januari 2025',
                'category' => 'Operasional',
                'amount' => 5000000,
                'quantity' => 1,
                'total_amount' => 5000000,
                'expense_date' => Carbon::now()->subDays(30),
                'receipt_image' => null,
                'notes' => 'Pembayaran tepat waktu',
                'created_by' => 1,
            ],
            [
                'name' => 'Listrik dan Air',
                'description' => 'Tagihan listrik dan air bulan Desember 2024',
                'category' => 'Utilitas',
                'amount' => 750000,
                'quantity' => 1,
                'total_amount' => 750000,
                'expense_date' => Carbon::now()->subDays(25),
                'receipt_image' => null,
                'notes' => 'Tagihan normal',
                'created_by' => 1,
            ],
            [
                'name' => 'Pembelian Laptop',
                'description' => 'Laptop untuk karyawan baru',
                'category' => 'Peralatan',
                'amount' => 8500000,
                'quantity' => 2,
                'total_amount' => 17000000,
                'expense_date' => Carbon::now()->subDays(20),
                'receipt_image' => null,
                'notes' => 'Laptop Lenovo ThinkPad',
                'created_by' => 1,
            ],
            [
                'name' => 'Bensin Kendaraan Operasional',
                'description' => 'Pengisian bensin untuk kendaraan operasional',
                'category' => 'Transportasi',
                'amount' => 150000,
                'quantity' => 4,
                'total_amount' => 600000,
                'expense_date' => Carbon::now()->subDays(15),
                'receipt_image' => null,
                'notes' => 'Bensin Pertamax',
                'created_by' => 1,
            ],
            [
                'name' => 'Makan Siang Tim',
                'description' => 'Makan siang untuk meeting dengan klien',
                'category' => 'Konsumsi',
                'amount' => 75000,
                'quantity' => 8,
                'total_amount' => 600000,
                'expense_date' => Carbon::now()->subDays(10),
                'receipt_image' => null,
                'notes' => 'Meeting dengan PT ABC',
                'created_by' => 1,
            ],
            [
                'name' => 'Internet dan Telepon',
                'description' => 'Tagihan internet dan telepon kantor',
                'category' => 'Komunikasi',
                'amount' => 450000,
                'quantity' => 1,
                'total_amount' => 450000,
                'expense_date' => Carbon::now()->subDays(8),
                'receipt_image' => null,
                'notes' => 'Paket unlimited',
                'created_by' => 1,
            ],
            [
                'name' => 'Alat Tulis Kantor',
                'description' => 'Pembelian alat tulis untuk kantor',
                'category' => 'Perlengkapan',
                'amount' => 25000,
                'quantity' => 10,
                'total_amount' => 250000,
                'expense_date' => Carbon::now()->subDays(5),
                'receipt_image' => null,
                'notes' => 'Pulpen, kertas, stapler, dll',
                'created_by' => 1,
            ],
            [
                'name' => 'Maintenance Server',
                'description' => 'Biaya maintenance server bulanan',
                'category' => 'IT',
                'amount' => 1200000,
                'quantity' => 1,
                'total_amount' => 1200000,
                'expense_date' => Carbon::now()->subDays(3),
                'receipt_image' => null,
                'notes' => 'Maintenance rutin server',
                'created_by' => 1,
            ],
        ];

        foreach ($expenses as $expense) {
            Expense::create($expense);
        }
    }
}