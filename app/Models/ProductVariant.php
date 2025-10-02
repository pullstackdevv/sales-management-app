<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'variant_label',
        'sku',
        'price',
        'base_price',
        'weight',
        'stock',
        'image',
        'is_active',
        'is_storefront',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'base_price' => 'decimal:2',
        'weight' => 'decimal:3',
        'stock' => 'integer',
        'is_active' => 'boolean',
        'is_storefront' => 'boolean',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function stockOpnameDetails()
    {
        return $this->hasMany(StockOpnameDetail::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
