<?php

namespace App\Services;

use App\Models\CustomerPoint;
use App\Models\LoyaltySetting;
use App\Models\Order;
use App\Models\PointTransaction;
use Illuminate\Support\Facades\Log;

class LoyaltyPointService
{
    /**
     * Award loyalty points for a paid order.
     */
    public function awardPointsForOrder(Order $order): ?PointTransaction
    {
        if (!LoyaltySetting::isLoyaltyActive()) {
            return null;
        }

        if (!$order->customer_id) {
            return null;
        }

        // Avoid duplicate awarding
        $alreadyAwarded = PointTransaction::where('order_id', $order->id)
            ->where('type', 'earn')
            ->exists();

        if ($alreadyAwarded) {
            return null;
        }

        // Check for product variant discount
        // Exclude orders containing items sold at variant discount price
        $order->loadMissing('items.productVariant');
        $hasVariantDiscount = $order->items->contains(function ($item) {
            $variant = $item->productVariant;
            if (!$variant) return false;
            
            // Check if item was sold at discount price
            return $variant->discount_price !== null && 
                   $variant->discount_price > 0 && 
                   abs((float)$item->price - (float)$variant->discount_price) < 0.01;
        });

        if ($hasVariantDiscount) {
            Log::info('Skipping loyalty points award for order with variant discount', [
                'order_id' => $order->id,
                'order_number' => $order->order_number
            ]);
            return null;
        }

        $customerPoint = CustomerPoint::getOrCreate($order->customer_id);

        $baseAmount = (float) $order->total_price;
        $shippingCost = (float) ($order->shipping_cost ?? 0);

        // Still track spend (for tier progression) excluding shipping when possible
        $spendAmount = max(0, $baseAmount - $shippingCost);
        if ($spendAmount <= 0) {
            $spendAmount = $baseAmount;
        }

        // New earning model: 1 base point per transaction * tier multiplier
        $basePoints = 1;
        $multiplier = $customerPoint->tier?->multiplier ?? 1;
        $earnedPoints = (int) ceil($basePoints * max(1, $multiplier));

        if ($earnedPoints <= 0) {
            return null;
        }

        try {
            $transaction = $customerPoint->addPoints(
                $earnedPoints,
                $order->id,
                $spendAmount,
                $multiplier,
                "Points earned from order {$order->order_number}"
            );

            // Track annual spend & tier progression
            $customerPoint->updateAnnualSpend($spendAmount);

            return $transaction;
        } catch (\Throwable $th) {
            Log::error('Failed to award loyalty points', [
                'order_id' => $order->id,
                'message' => $th->getMessage(),
            ]);

            return null;
        }
    }
}
