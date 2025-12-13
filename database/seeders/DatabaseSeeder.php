<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // // Create admin user
        // User::factory()->create([
        //     'name' => 'Admin User',
        //     'email' => 'admin@example.com',
        //     'role' => 'admin',
        // ]);

        // // Create test user
        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        //     'role' => 'staff',
        // ]);

        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            SalesChannelSeeder::class,
            PaymentBankSeeder::class,
            CourierSeeder::class,
            CustomerSeeder::class,
            ProductSeeder::class,
            VoucherSeeder::class,
            ExpenseSeeder::class,
            OrderSeeder::class,
            StockMovementSeeder::class,
            StockOpnameSeeder::class,
        ]);
    }
}
