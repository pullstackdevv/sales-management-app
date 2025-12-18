<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'tier_id',
        'current_points',
        'lifetime_points',
        'annual_spend',
        'annual_spend_year',
        'tier_updated_at',
    ];

    protected $casts = [
        'current_points' => 'integer',
        'lifetime_points' => 'integer',
        'annual_spend' => 'decimal:2',
        'annual_spend_year' => 'integer',
        'tier_updated_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function tier()
    {
        return $this->belongsTo(LoyaltyTier::class, 'tier_id');
    }

    public function transactions()
    {
        return $this->hasMany(PointTransaction::class, 'customer_id', 'customer_id');
    }

    public static function getOrCreate(int $customerId): self
    {
        return self::firstOrCreate(
            ['customer_id' => $customerId],
            [
                'tier_id' => LoyaltyTier::getDefaultTier()?->id,
                'current_points' => 0,
                'lifetime_points' => 0,
                'annual_spend' => 0,
                'annual_spend_year' => date('Y'),
            ]
        );
    }

    public function addPoints(int $points, ?int $orderId = null, ?float $orderAmount = null, ?float $multiplier = null, ?string $description = null, ?int $createdBy = null): PointTransaction
    {
        $this->current_points += $points;
        $this->lifetime_points += $points;
        $this->save();

        return PointTransaction::create([
            'customer_id' => $this->customer_id,
            'type' => 'earn',
            'points' => $points,
            'balance_after' => $this->current_points,
            'order_id' => $orderId,
            'order_amount' => $orderAmount,
            'multiplier' => $multiplier,
            'description' => $description ?? 'Points earned from order',
            'created_by' => $createdBy,
        ]);
    }

    public function redeemPoints(int $points, ?int $orderId = null, ?string $description = null, ?int $createdBy = null): ?PointTransaction
    {
        if ($this->current_points < $points) {
            return null;
        }

        $this->current_points -= $points;
        $this->save();

        return PointTransaction::create([
            'customer_id' => $this->customer_id,
            'type' => 'redeem',
            'points' => -$points,
            'balance_after' => $this->current_points,
            'order_id' => $orderId,
            'description' => $description ?? 'Points redeemed for discount',
            'created_by' => $createdBy,
        ]);
    }

    public function adjustPoints(int $points, string $description, ?int $createdBy = null): PointTransaction
    {
        $this->current_points += $points;
        if ($points > 0) {
            $this->lifetime_points += $points;
        }
        $this->save();

        return PointTransaction::create([
            'customer_id' => $this->customer_id,
            'type' => 'adjustment',
            'points' => $points,
            'balance_after' => $this->current_points,
            'description' => $description,
            'created_by' => $createdBy,
        ]);
    }

    public function updateAnnualSpend(float $amount): void
    {
        $currentYear = (int) date('Y');
        
        if ($this->annual_spend_year !== $currentYear) {
            $this->annual_spend = $amount;
            $this->annual_spend_year = $currentYear;
        } else {
            $this->annual_spend += $amount;
        }
        
        $this->save();
        $this->checkAndUpdateTier();
    }

    public function checkAndUpdateTier(): void
    {
        $newTier = LoyaltyTier::getTierForSpend((float) $this->annual_spend);
        
        if ($newTier && $newTier->id !== $this->tier_id) {
            $this->tier_id = $newTier->id;
            $this->tier_updated_at = now();
            $this->save();
        }
    }

    public function resetAnnualSpend(): void
    {
        $this->annual_spend = 0;
        $this->annual_spend_year = date('Y');
        $this->tier_id = LoyaltyTier::getDefaultTier()?->id;
        $this->tier_updated_at = now();
        $this->save();
    }

    public function getNextTier(): ?LoyaltyTier
    {
        return LoyaltyTier::active()
            ->where('min_annual_spend', '>', $this->annual_spend)
            ->orderBy('min_annual_spend')
            ->first();
    }

    public function getProgressToNextTier(): array
    {
        $nextTier = $this->getNextTier();
        
        if (!$nextTier) {
            return [
                'next_tier' => null,
                'current_spend' => $this->annual_spend,
                'required_spend' => 0,
                'remaining' => 0,
                'percentage' => 100,
            ];
        }

        $remaining = $nextTier->min_annual_spend - $this->annual_spend;
        $currentTierMin = $this->tier?->min_annual_spend ?? 0;
        $range = $nextTier->min_annual_spend - $currentTierMin;
        $progress = $this->annual_spend - $currentTierMin;
        $percentage = $range > 0 ? min(100, ($progress / $range) * 100) : 0;

        return [
            'next_tier' => $nextTier,
            'current_spend' => $this->annual_spend,
            'required_spend' => $nextTier->min_annual_spend,
            'remaining' => max(0, $remaining),
            'percentage' => round($percentage, 1),
        ];
    }
}
