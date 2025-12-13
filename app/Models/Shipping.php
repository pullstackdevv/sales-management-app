<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shipping extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_id',
        'courier_id',
        'courier_rate_id',
        'tracking_number',
        'weight',
        'shipped_at',
        'delivered_at',
        'status',
        'dimensions',
        'notes',
        'service_type',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function courier()
    {
        return $this->belongsTo(Courier::class);
    }

    public function courierRate()
    {
        return $this->belongsTo(CourierRate::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getServiceTypeAttribute($value)
    {
        return $value ?? $this->courierRate?->service_type;
    }
}
