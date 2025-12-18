<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoyaltyTier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'min_annual_spend',
        'multiplier',
        'color',
        'icon',
        'benefits',
        'order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'min_annual_spend' => 'decimal:2',
        'multiplier' => 'decimal:2',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function customerPoints()
    {
        return $this->hasMany(CustomerPoint::class, 'tier_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('min_annual_spend');
    }

    public static function getTierForSpend(float $annualSpend): ?self
    {
        return self::active()
            ->where('min_annual_spend', '<=', $annualSpend)
            ->orderBy('min_annual_spend', 'desc')
            ->first();
    }

    public static function getDefaultTier(): ?self
    {
        return self::active()->ordered()->first();
    }

    public function getBenefitsArrayAttribute(): array
    {
        if (empty($this->benefits)) {
            return [];
        }
        return array_filter(array_map('trim', explode("\n", $this->benefits)));
    }
}
