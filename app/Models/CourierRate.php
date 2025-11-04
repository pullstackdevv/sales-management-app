<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourierRate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'courier_id',
        'origin_city',
        'destination_city',
        'service_type',
        'price_per_kg',
        'estimated_days',
        'origin_province',
        'origin_district',
        'destination_province',
        'destination_district',
        'base_price',
        'min_weight',
        'max_weight',
        'pricing_type',
        'is_available',
        'effective_date',
        'expired_date',
        'etd_days'
    ];

    protected $casts = [
        'price_per_kg' => 'decimal:2',
        'base_price' => 'decimal:2',
        'min_weight' => 'decimal:2',
        'max_weight' => 'decimal:2',
        'estimated_days' => 'integer',
        'is_available' => 'boolean',
        'effective_date' => 'date',
        'expired_date' => 'date'
    ];

    // Relationships
    public function courier()
    {
        return $this->belongsTo(Courier::class);
    }
}
