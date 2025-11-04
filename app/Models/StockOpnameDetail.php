<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockOpnameDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_opname_id',
        'product_variant_id',
        'system_stock',
        'real_stock',
        'difference',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    // Relationships
    public function stockOpname()
    {
        return $this->belongsTo(StockOpname::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
