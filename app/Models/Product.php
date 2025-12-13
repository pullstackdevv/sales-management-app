<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'sku',
        'category',
        'description',
        'image',
        'is_active',
        'is_storefront',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_storefront' => 'boolean',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    // Helper method to get the minimum selling price from variants
    public function getMinPriceAttribute()
    {
        return $this->variants()->min('price') ?? 0;
    }

    // Helper method to get the maximum selling price from variants
    public function getMaxPriceAttribute()
    {
        return $this->variants()->max('price') ?? 0;
    }

    // Helper method to get the minimum base price from variants
    public function getMinBasePriceAttribute()
    {
        return $this->variants()->min('base_price') ?? 0;
    }

    // Helper method to get the maximum base price from variants
    public function getMaxBasePriceAttribute()
    {
        return $this->variants()->max('base_price') ?? 0;
    }

    // Helper method to get selling price range
    public function getPriceRangeAttribute()
    {
        $min = $this->min_price;
        $max = $this->max_price;
        
        if ($min == $max || $min == 0) {
            return 'Rp ' . number_format($max, 0, ',', '.');
        }
        
        return 'Rp ' . number_format($min, 0, ',', '.') . ' - Rp ' . number_format($max, 0, ',', '.');
    }

    // Helper method to get base price range
    public function getBasePriceRangeAttribute()
    {
        $min = $this->min_base_price;
        $max = $this->max_base_price;
        
        if ($min == $max || $min == 0) {
            return 'Rp ' . number_format($max, 0, ',', '.');
        }
        
        return 'Rp ' . number_format($min, 0, ',', '.') . ' - Rp ' . number_format($max, 0, ',', '.');
    }

    // Helper method to get profit margin range
    public function getProfitMarginRangeAttribute()
    {
        $variants = $this->variants;
        if ($variants->isEmpty()) {
            return '0%';
        }

        $margins = $variants->map(function ($variant) {
            if ($variant->base_price == 0) return 0;
            return (($variant->price - $variant->base_price) / $variant->base_price) * 100;
        });

        $minMargin = $margins->min();
        $maxMargin = $margins->max();

        if ($minMargin == $maxMargin) {
            return number_format($maxMargin, 1) . '%';
        }

        return number_format($minMargin, 1) . '% - ' . number_format($maxMargin, 1) . '%';
    }
}
