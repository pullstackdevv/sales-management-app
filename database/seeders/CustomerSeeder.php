<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                'name' => 'John Doe',
                'phone' => '081234567890',
                'email' => 'john.doe@example.com',
            ],
            [
                'name' => 'Jane Smith',
                'phone' => '081987654321',
                'email' => 'jane.smith@example.com',
            ],
            [
                'name' => 'Ahmad Wijaya',
                'phone' => '081122334455',
                'email' => 'ahmad.wijaya@example.com',
            ],
            [
                'name' => 'Siti Nurhaliza',
                'phone' => '081555666777',
                'email' => 'siti.nurhaliza@example.com',
            ],
            [
                'name' => 'Budi Santoso',
                'phone' => '081999888777',
                'email' => 'budi.santoso@example.com',
            ],
        ];

        foreach ($customers as $customerData) {
            $customer = Customer::create($customerData);
            
            // Create address for each customer
            CustomerAddress::create([
                'customer_id' => $customer->id,
                'label' => 'Rumah',
                'recipient_name' => $customer->name,
                'phone' => $customer->phone,
                'address_detail' => 'Jl. Contoh No. ' . rand(1, 100),
                'city' => 'Jakarta Selatan',
                'district' => 'Kebayoran Baru',
                'province' => 'DKI Jakarta',
                'postal_code' => '12345',
                'is_default' => true,
            ]);
        }
    }
}
