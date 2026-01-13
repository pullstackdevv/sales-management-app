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
        'category_id',
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

    public function productCategory()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function categories()
    {
        return $this->belongsToMany(ProductCategory::class, 'product_product_category');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'product_tag');
    }

    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
    }

    public function approvedReviews()
    {
        return $this->hasMany(ProductReview::class)->where('status', 'approved');
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

    // Sales Counter - hitung total produk terjual dari order sukses
    public function getTotalSoldAttribute()
    {
        return \DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
            ->where('product_variants.product_id', $this->id)
            ->whereIn('orders.status', ['paid', 'shipped', 'delivered'])
            ->sum('order_items.quantity');
    }

    // Average rating dari review yang approved
    public function getAverageRatingAttribute()
    {
        return $this->approvedReviews()->avg('rating') ?? 0;
    }

    // Total review yang approved
    public function getTotalReviewsAttribute()
    {
        return $this->approvedReviews()->count();
    }

    // Cek apakah customer sudah pernah review produk ini
    public function hasBeenReviewedByCustomer($customerId, $orderId = null)
    {
        $query = $this->reviews()
            ->where('customer_id', $customerId);
        
        if ($orderId) {
            $query->where('order_id', $orderId);
        }
        
        return $query->exists();
    }

    // Cek apakah customer pernah beli produk ini dan sudah diterima
    public function hasBeenPurchasedByCustomer($customerId)
    {
        return \DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
            ->where('product_variants.product_id', $this->id)
            ->where('orders.customer_id', $customerId)
            ->where('orders.status', 'delivered') // Hanya order yang sudah diterima
            ->exists();
    }
}
