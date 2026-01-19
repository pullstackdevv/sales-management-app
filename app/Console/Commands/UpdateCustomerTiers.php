<?php

namespace App\Console\Commands;

use App\Models\CustomerPoint;
use App\Models\LoyaltyTier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateCustomerTiers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'loyalty:update-tiers {--dry-run : Run without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and update customer loyalty tiers based on annual spend';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->info('Running in DRY RUN mode - no changes will be made');
        }

        $this->info('Starting tier update process...');
        
        $currentYear = (int) date('Y');
        $updatedCount = 0;
        $errorCount = 0;

        try {
            // Get all customer points
            $customerPoints = CustomerPoint::with(['customer', 'tier'])
                ->whereNotNull('customer_id')
                ->get();

            $this->info("Found {$customerPoints->count()} customers to process");

            foreach ($customerPoints as $customerPoint) {
                try {
                    // Skip if annual spend year is not current year
                    if ($customerPoint->annual_spend_year !== $currentYear) {
                        $this->warn("Customer {$customerPoint->customer_id}: Annual spend year mismatch (current: {$customerPoint->annual_spend_year}, expected: {$currentYear})");
                        continue;
                    }

                    // Get the appropriate tier for current annual spend
                    $newTier = LoyaltyTier::getTierForSpend((float) $customerPoint->annual_spend);

                    if (!$newTier) {
                        $this->warn("Customer {$customerPoint->customer_id}: No tier found for spend {$customerPoint->annual_spend}");
                        continue;
                    }

                    // Check if tier needs to be updated
                    if ($newTier->id !== $customerPoint->tier_id) {
                        $oldTierName = $customerPoint->tier?->name ?? 'None';
                        $newTierName = $newTier->name;
                        $customerName = $customerPoint->customer?->name ?? "ID: {$customerPoint->customer_id}";

                        if ($isDryRun) {
                            $this->line("  [DRY RUN] Would update {$customerName}: {$oldTierName} → {$newTierName} (Spend: Rp " . number_format((float) $customerPoint->annual_spend, 0, ',', '.') . ")");
                        } else {
                            // Update tier
                            $customerPoint->tier_id = $newTier->id;
                            $customerPoint->tier_updated_at = now();
                            $customerPoint->save();

                            $this->info("  ✓ Updated {$customerName}: {$oldTierName} → {$newTierName} (Spend: Rp " . number_format((float) $customerPoint->annual_spend, 0, ',', '.') . ")");
                            
                            // Log the tier upgrade
                            Log::info("Tier upgraded", [
                                'customer_id' => $customerPoint->customer_id,
                                'customer_name' => $customerName,
                                'old_tier' => $oldTierName,
                                'new_tier' => $newTierName,
                                'annual_spend' => $customerPoint->annual_spend,
                                'updated_at' => now()
                            ]);
                        }

                        $updatedCount++;
                    }
                } catch (\Exception $e) {
                    $this->error("  ✗ Error processing customer {$customerPoint->customer_id}: {$e->getMessage()}");
                    Log::error("Tier update error", [
                        'customer_id' => $customerPoint->customer_id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    $errorCount++;
                }
            }

            // Summary
            $this->newLine();
            $this->info('=== Tier Update Summary ===');
            $this->info("Total customers processed: {$customerPoints->count()}");
            $this->info("Tiers updated: {$updatedCount}");
            
            if ($errorCount > 0) {
                $this->warn("Errors encountered: {$errorCount}");
            }

            if ($isDryRun) {
                $this->info('DRY RUN completed - no actual changes were made');
            } else {
                $this->info('Tier update process completed successfully!');
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Fatal error during tier update: {$e->getMessage()}");
            Log::error("Fatal tier update error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }
}
