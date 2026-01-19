<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerPoint;
use App\Models\LoyaltySetting;
use App\Models\LoyaltyTier;
use App\Models\PointTransaction;
use Illuminate\Http\Request;

class PointController extends Controller
{
    /**
     * Get loyalty points for guest customer (storefront)
     * Requires verification via phone or email
     */
    public function getGuestLoyalty(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer',
            'verification_type' => 'required|in:phone,email',
            'verification_value' => 'required|string',
        ]);

        $customer = Customer::find($validated['customer_id']);

        if (!$customer) {
            return response()->json([
                'status' => 'error',
                'message' => 'Customer tidak ditemukan'
            ], 404);
        }

        // Verify ownership
        $isVerified = false;
        if ($validated['verification_type'] === 'phone') {
            $normalizedCustomerPhone = preg_replace('/[^0-9]/', '', $customer->phone);
            $normalizedInputPhone = preg_replace('/[^0-9]/', '', $validated['verification_value']);
            $normalizedCustomerPhone = preg_replace('/^62/', '0', $normalizedCustomerPhone);
            $normalizedInputPhone = preg_replace('/^62/', '0', $normalizedInputPhone);
            $isVerified = $normalizedCustomerPhone === $normalizedInputPhone;
        } else {
            $isVerified = strtolower($customer->email) === strtolower($validated['verification_value']);
        }

        if (!$isVerified) {
            return response()->json([
                'status' => 'error',
                'message' => 'Verifikasi gagal'
            ], 403);
        }

        // Get loyalty data
        $customerPoint = CustomerPoint::getOrCreate($customer->id);
        $customerPoint->load('tier');
        $progress = $customerPoint->getProgressToNextTier();

        // Get recent transactions
        $transactions = PointTransaction::forCustomer($customer->id)
            ->with('order:id,order_number')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get redeem options
        $redeemOptions = LoyaltySetting::getRedeemOptions();
        $pointRate = LoyaltySetting::getPointRate();

        return response()->json([
            'status' => 'success',
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
            ],
            'points' => [
                'current' => $customerPoint->current_points,
                'lifetime' => $customerPoint->lifetime_points,
                'annual_spend' => $customerPoint->annual_spend,
                'annual_spend_year' => $customerPoint->annual_spend_year,
            ],
            'tier' => $customerPoint->tier ? [
                'id' => $customerPoint->tier->id,
                'name' => $customerPoint->tier->name,
                'slug' => $customerPoint->tier->slug,
                'multiplier' => $customerPoint->tier->multiplier,
                'color' => $customerPoint->tier->color,
                'icon' => $customerPoint->tier->icon,
                'benefits' => $customerPoint->tier->benefits_array,
            ] : null,
            'progress' => [
                'next_tier' => $progress['next_tier'] ? [
                    'id' => $progress['next_tier']->id,
                    'name' => $progress['next_tier']->name,
                    'min_annual_spend' => $progress['next_tier']->min_annual_spend,
                ] : null,
                'current_spend' => $progress['current_spend'],
                'required_spend' => $progress['required_spend'],
                'remaining' => $progress['remaining'],
                'percentage' => $progress['percentage'],
            ],
            'transactions' => $transactions,
            'settings' => [
                'point_rate' => $pointRate,
                'redeem_options' => $redeemOptions,
                'is_active' => LoyaltySetting::isLoyaltyActive(),
            ],
        ]);
    }

    public function getCustomerPoints(Customer $customer)
    {
        $customerPoint = CustomerPoint::getOrCreate($customer->id);
        $customerPoint->load('tier');
        
        $progress = $customerPoint->getProgressToNextTier();

        return response()->json([
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
            ],
            'points' => [
                'current' => $customerPoint->current_points,
                'lifetime' => $customerPoint->lifetime_points,
                'annual_spend' => $customerPoint->annual_spend,
                'annual_spend_year' => $customerPoint->annual_spend_year,
            ],
            'tier' => $customerPoint->tier ? [
                'id' => $customerPoint->tier->id,
                'name' => $customerPoint->tier->name,
                'slug' => $customerPoint->tier->slug,
                'multiplier' => $customerPoint->tier->multiplier,
                'color' => $customerPoint->tier->color,
                'icon' => $customerPoint->tier->icon,
                'benefits' => $customerPoint->tier->benefits_array,
            ] : null,
            'progress' => [
                'next_tier' => $progress['next_tier'] ? [
                    'id' => $progress['next_tier']->id,
                    'name' => $progress['next_tier']->name,
                    'min_annual_spend' => $progress['next_tier']->min_annual_spend,
                ] : null,
                'current_spend' => $progress['current_spend'],
                'required_spend' => $progress['required_spend'],
                'remaining' => $progress['remaining'],
                'percentage' => $progress['percentage'],
            ],
        ]);
    }

    public function getCustomerHistory(Request $request, Customer $customer)
    {
        $query = PointTransaction::forCustomer($customer->id)
            ->orderBy('created_at', 'desc');

        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $perPage = $request->get('per_page', 15);
        $transactions = $query->with('order:id,order_number')->paginate($perPage);

        return response()->json([
            'transactions' => $transactions,
        ]);
    }

    public function adjustPoints(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'points' => 'required|integer',
            'description' => 'required|string|max:255',
        ]);

        $customerPoint = CustomerPoint::getOrCreate($customer->id);
        
        if ($validated['points'] < 0 && abs($validated['points']) > $customerPoint->current_points) {
            return response()->json([
                'message' => 'Poin tidak mencukupi untuk pengurangan',
            ], 422);
        }

        $transaction = $customerPoint->adjustPoints(
            $validated['points'],
            $validated['description'],
            auth()->id()
        );

        return response()->json([
            'message' => 'Poin berhasil disesuaikan',
            'transaction' => $transaction,
            'new_balance' => $customerPoint->current_points,
        ]);
    }

    public function calculateEarnPoints(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id',
        ]);

        $amount = $validated['amount'];
        $pointRate = LoyaltySetting::getPointRate();
        $basePoints = floor($amount / $pointRate);

        $multiplier = 1;
        if (isset($validated['customer_id'])) {
            $customerPoint = CustomerPoint::where('customer_id', $validated['customer_id'])->first();
            if ($customerPoint && $customerPoint->tier) {
                $multiplier = $customerPoint->tier->multiplier;
            }
        }

        $finalPoints = floor($basePoints * $multiplier);

        return response()->json([
            'amount' => $amount,
            'point_rate' => $pointRate,
            'base_points' => $basePoints,
            'multiplier' => $multiplier,
            'final_points' => $finalPoints,
        ]);
    }

    public function calculateRedeemValue(Request $request)
    {
        $validated = $request->validate([
            'points' => 'required|integer|min:0',
            'order_total' => 'nullable|numeric|min:0',
        ]);

        $points = $validated['points'];
        $redeemValue = LoyaltySetting::getRedeemValue();
        $minRedeem = LoyaltySetting::getMinRedeem();
        $maxPercentage = LoyaltySetting::getMaxRedeemPercentage();

        $discount = $points * $redeemValue;

        $maxDiscount = null;
        if (isset($validated['order_total']) && $validated['order_total'] > 0) {
            $maxDiscount = ($validated['order_total'] * $maxPercentage) / 100;
            $discount = min($discount, $maxDiscount);
        }

        $isValid = $points >= $minRedeem;

        return response()->json([
            'points' => $points,
            'redeem_value' => $redeemValue,
            'discount' => $discount,
            'min_redeem' => $minRedeem,
            'max_percentage' => $maxPercentage,
            'max_discount' => $maxDiscount,
            'is_valid' => $isValid,
            'message' => !$isValid ? "Minimal redeem adalah {$minRedeem} poin" : null,
        ]);
    }

    public function getRedeemOptions(Request $request)
    {
        $options = LoyaltySetting::getRedeemOptions(); // Array of rupiah amounts
        $pointRate = LoyaltySetting::getPointRate(); // Rupiah per 1 point
        $minRedeem = LoyaltySetting::getMinRedeem();
        $maxPercentage = LoyaltySetting::getMaxRedeemPercentage();

        $customerPoints = 0;
        if ($request->has('customer_id')) {
            $customerPoint = CustomerPoint::where('customer_id', $request->customer_id)->first();
            $customerPoints = $customerPoint ? $customerPoint->current_points : 0;
        }

        $orderTotal = $request->get('order_total', 0);
        $maxDiscount = $orderTotal > 0 ? ($orderTotal * $maxPercentage) / 100 : null;

        $formattedOptions = [];
        foreach ($options as $discountAmount) {
            // Calculate points needed for this discount amount
            $pointsNeeded = (int) ceil($discountAmount / $pointRate);
            
            // Check if customer has enough points and meets minimum
            $isAvailable = $pointsNeeded <= $customerPoints && $pointsNeeded >= $minRedeem;
            
            // Check if discount exceeds max allowed
            if ($maxDiscount !== null && $discountAmount > $maxDiscount) {
                $isAvailable = false;
            }

            $formattedOptions[] = [
                'points' => $pointsNeeded,
                'discount' => $discountAmount,
                'is_available' => $isAvailable,
            ];
        }

        return response()->json([
            'options' => $formattedOptions,
            'customer_points' => $customerPoints,
            'redeem_value' => $pointRate,
            'min_redeem' => $minRedeem,
            'max_percentage' => $maxPercentage,
            'max_discount' => $maxDiscount,
        ]);
    }

    public function getAllCustomerPoints(Request $request)
    {
        $query = CustomerPoint::with(['customer:id,name,email,phone', 'tier:id,name,slug,color,multiplier'])
            ->orderBy('current_points', 'desc');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('customer', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('tier_id') && $request->tier_id) {
            $query->where('tier_id', $request->tier_id);
        }

        $perPage = $request->get('per_page', 15);
        $customerPoints = $query->paginate($perPage);

        return response()->json([
            'customer_points' => $customerPoints,
        ]);
    }

    public function getPointsSummary()
    {
        $totalPoints = CustomerPoint::sum('current_points');
        $totalLifetimePoints = CustomerPoint::sum('lifetime_points');
        $totalCustomersWithPoints = CustomerPoint::where('current_points', '>', 0)->count();

        $tierDistribution = LoyaltyTier::active()
            ->withCount('customerPoints')
            ->ordered()
            ->get()
            ->map(function ($tier) {
                return [
                    'id' => $tier->id,
                    'name' => $tier->name,
                    'color' => $tier->color,
                    'customer_count' => $tier->customer_points_count,
                ];
            });

        $recentTransactions = PointTransaction::with(['customer:id,name', 'order:id,order_number'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'summary' => [
                'total_points' => $totalPoints,
                'total_lifetime_points' => $totalLifetimePoints,
                'total_customers_with_points' => $totalCustomersWithPoints,
            ],
            'tier_distribution' => $tierDistribution,
            'recent_transactions' => $recentTransactions,
        ]);
    }
}
