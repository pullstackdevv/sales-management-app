<?php

namespace Database\Seeders;

use App\Models\PaymentBank;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentBankSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user ID, or create a default user if none exists
        $userId = User::first()?->id ?? 1;
        $paymentBanks = [
            [
                'bank_name' => 'Bank Central Asia (BCA)',
                'account_number' => '1234567890',
                'account_name' => 'PT Sales Management',
                'is_active' => true,
                'created_by' => $userId,
            ],
            [
                'bank_name' => 'Bank Mandiri',
                'account_number' => '0987654321',
                'account_name' => 'PT Sales Management',
                'is_active' => true,
                'created_by' => $userId,
            ],
            [
                'bank_name' => 'Bank Negara Indonesia (BNI)',
                'account_number' => '1122334455',
                'account_name' => 'PT Sales Management',
                'is_active' => true,
                'created_by' => $userId,
            ],
            [
                'bank_name' => 'Bank Rakyat Indonesia (BRI)',
                'account_number' => '5544332211',
                'account_name' => 'PT Sales Management',
                'is_active' => true,
                'created_by' => $userId,
            ],
            [
                'bank_name' => 'Bank CIMB Niaga',
                'account_number' => '6677889900',
                'account_name' => 'PT Sales Management',
                'is_active' => true,
                'created_by' => $userId,
            ],
            [
                'bank_name' => 'GoPay',
                'account_number' => '081234567890',
                'account_name' => 'Sales Management',
                'is_active' => true,
                'created_by' => $userId,
            ],
            [
                'bank_name' => 'OVO',
                'account_number' => '081987654321',
                'account_name' => 'Sales Management',
                'is_active' => true,
                'created_by' => $userId,
            ],
            [
                'bank_name' => 'DANA',
                'account_number' => '081122334455',
                'account_name' => 'Sales Management',
                'is_active' => true,
                'created_by' => $userId,
            ],
        ];

        foreach ($paymentBanks as $bank) {
            PaymentBank::create($bank);
        }
    }
}