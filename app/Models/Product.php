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

    // Helper method to get the minimum price from variants
    public function getMinPriceAttribute()
    {
        return $this->variants()->min('price') ?? 0;
    }

    // Helper method to get the maximum price from variants
    public function getMaxPriceAttribute()
    {
        return $this->variants()->max('price') ?? 0;
    }

    // Helper method to get price range
    public function getPriceRangeAttribute()
    {
        $min = $this->min_price;
        $max = $this->max_price;
        
        if ($min == $max) {
            return number_format($min, 0, ',', '.');
        }
        
        return number_format($min, 0, ',', '.') . ' - ' . number_format($max, 0, ',', '.');
    }
}
