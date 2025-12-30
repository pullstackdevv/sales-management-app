<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\CustomerPoint;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class InitializeCustomerLoyalty extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'loyalty:initialize {--force : Force initialization even if loyalty points exist}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initialize loyalty points with default tier for customers who don\'t have one';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');
        
        $this->info('Starting loyalty initialization for customers...');
        
        $createdCount = 0;
        $skippedCount = 0;
        $errorCount = 0;

        try {
            // Get all customers
            $customers = Customer::with('loyaltyPoints')->get();
            
            $this->info("Found {$customers->count()} customers to process");

            foreach ($customers as $customer) {
                try {
                    // Check if customer already has loyalty points
                    if ($customer->loyaltyPoints && !$force) {
                        $this->line("  ⊘ Skipped {$customer->name} (ID: {$customer->id}) - already has loyalty points");
                        $skippedCount++;
                        continue;
                    }

                    if ($force && $customer->loyaltyPoints) {
                        $this->warn("  ⚠ Force mode: Recreating loyalty points for {$customer->name} (ID: {$customer->id})");
                        $customer->loyaltyPoints->delete();
                    }

                    // Create loyalty points with default tier
                    $loyaltyPoint = $customer->getLoyaltyPoint();
                    
                    $tierName = $loyaltyPoint->tier?->name ?? 'Default';
                    $this->info("  ✓ Created loyalty points for {$customer->name} (ID: {$customer->id}) - Tier: {$tierName}");
                    
                    Log::info("Loyalty initialized", [
                        'customer_id' => $customer->id,
                        'customer_name' => $customer->name,
                        'tier' => $tierName,
                        'created_at' => now()
                    ]);

                    $createdCount++;

                } catch (\Exception $e) {
                    $this->error("  ✗ Error processing customer {$customer->id}: {$e->getMessage()}");
                    Log::error("Loyalty initialization error", [
                        'customer_id' => $customer->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    $errorCount++;
                }
            }

            // Summary
            $this->newLine();
            $this->info('=== Loyalty Initialization Summary ===');
            $this->info("Total customers processed: {$customers->count()}");
            $this->info("Loyalty points created: {$createdCount}");
            $this->info("Skipped (already exists): {$skippedCount}");
            
            if ($errorCount > 0) {
                $this->warn("Errors encountered: {$errorCount}");
            }

            $this->info('Loyalty initialization completed successfully!');

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Fatal error during loyalty initialization: {$e->getMessage()}");
            Log::error("Fatal loyalty initialization error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }
}
