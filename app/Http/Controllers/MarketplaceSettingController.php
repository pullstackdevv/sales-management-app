<?php

namespace App\Http\Controllers;

use App\Models\GeneralSetting;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MarketplaceSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $keys = [
            'marketplace_admin_fee',
            'marketplace_insurance_fee',
            'marketplace_promo_fee',
            'marketplace_promo_fee_max',
            'marketplace_shipping_fee',
            'marketplace_shipping_fee_max',
            'marketplace_process_fee',
        ];

        $settings = GeneralSetting::whereIn('setting_name', $keys)
            ->pluck('setting_value', 'setting_name');

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'marketplace_admin_fee' => 'required|numeric|min:0',
            'marketplace_insurance_fee' => 'required|numeric|min:0',
            'marketplace_promo_fee' => 'required|numeric|min:0',
            'marketplace_promo_fee_max' => 'required|numeric|min:0',
            'marketplace_shipping_fee' => 'required|numeric|min:0',
            'marketplace_shipping_fee_max' => 'required|numeric|min:0',
            'marketplace_process_fee' => 'required|numeric|min:0',
        ]);

        foreach ($data as $key => $value) {
            GeneralSetting::updateOrCreate(
                ['setting_name' => $key],
                ['setting_value' => $value, 'is_active' => true]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Marketplace settings updated successfully'
        ]);
    }

    public function generate(): JsonResponse
    {
        // Fetch settings
        $keys = [
            'marketplace_admin_fee',
            'marketplace_insurance_fee',
            'marketplace_promo_fee',
            'marketplace_promo_fee_max',
            'marketplace_shipping_fee',
            'marketplace_shipping_fee_max',
            'marketplace_process_fee',
        ];
        
        $settings = GeneralSetting::whereIn('setting_name', $keys)
            ->pluck('setting_value', 'setting_name');

        // Parse settings
        $proc = (float)($settings['marketplace_process_fee'] ?? 0);
        $adminRate = (float)($settings['marketplace_admin_fee'] ?? 0) / 100;
        $insRate = (float)($settings['marketplace_insurance_fee'] ?? 0) / 100;
        $promoRate = (float)($settings['marketplace_promo_fee'] ?? 0) / 100;
        $promoMax = (float)($settings['marketplace_promo_fee_max'] ?? 0);
        $shipRate = (float)($settings['marketplace_shipping_fee'] ?? 0) / 100;
        $shipMax = (float)($settings['marketplace_shipping_fee_max'] ?? 0);

        // Denominators
        $denomFull = 1 - ($adminRate + $insRate + $promoRate + $shipRate);
        $denomNoShip = 1 - ($adminRate + $insRate + $promoRate);
        $denomNoShipPromo = 1 - ($adminRate + $insRate);

        // Avoid division by zero
        if ($denomFull <= 0 || $denomNoShip <= 0 || $denomNoShipPromo <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid fee configuration resulting in zero or negative denominator.'
            ], 400);
        }

        // Thresholds
        // If rate is 0, we treat max as infinite or handle gracefully. 
        // Based on formula, if rate is 0, the term (Max/Rate) would be infinite.
        $check1 = ($shipRate > 0) ? ($shipMax / $shipRate) : PHP_FLOAT_MAX;
        $check2 = ($promoRate > 0) ? ($promoMax / $promoRate) : PHP_FLOAT_MAX;

        $updatedCount = 0;

        DB::transaction(function () use ($proc, $shipMax, $promoMax, $denomFull, $denomNoShip, $denomNoShipPromo, $check1, $check2, &$updatedCount) {
            // Process in chunks to handle large datasets
            ProductVariant::chunk(100, function ($variants) use ($proc, $shipMax, $promoMax, $denomFull, $denomNoShip, $denomNoShipPromo, $check1, $check2, &$updatedCount) {
                foreach ($variants as $variant) {
                    $price = $variant->price;
                    
                    if ($price <= 0) continue;

                    // Scenario 1
                    $val1 = ($price + $proc) / $denomFull;
                    
                    if ($val1 < $check1) {
                        $finalPrice = $val1;
                    } else {
                        // Scenario 2
                        $val2 = ($price + $proc + $shipMax) / $denomNoShip;
                        
                        if ($val2 < $check2) {
                            $finalPrice = $val2;
                        } else {
                            // Scenario 3
                            $val3 = ($price + $proc + $shipMax + $promoMax) / $denomNoShipPromo;
                            $finalPrice = $val3;
                        }
                    }

                    // Update variant
                    $variant->marketplace_price = round($finalPrice);
                    $variant->save();
                    $updatedCount++;
                }
            });
        });

        return response()->json([
            'success' => true,
            'message' => "Marketplace prices generated for {$updatedCount} product variants."
        ]);
    }
}
