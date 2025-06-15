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
        'etd_days',
    ];

    protected $casts = [
        'price_per_kg' => 'decimal:2',
    ];

    // Relationships
    public function courier()
    {
        return $this->belongsTo(Courier::class);
    }
}
