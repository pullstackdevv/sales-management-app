<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PointTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'type',
        'points',
        'balance_after',
        'order_id',
        'order_amount',
        'multiplier',
        'description',
        'reference',
        'created_by',
    ];

    protected $casts = [
        'points' => 'integer',
        'balance_after' => 'integer',
        'order_amount' => 'decimal:2',
        'multiplier' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeEarn($query)
    {
        return $query->where('type', 'earn');
    }

    public function scopeRedeem($query)
    {
        return $query->where('type', 'redeem');
    }

    public function scopeAdjustment($query)
    {
        return $query->where('type', 'adjustment');
    }

    public function scopeForCustomer($query, int $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function getTypeLabel(): string
    {
        return match($this->type) {
            'earn' => 'Poin Masuk',
            'redeem' => 'Poin Keluar',
            'adjustment' => 'Penyesuaian',
            'expired' => 'Kadaluarsa',
            default => $this->type,
        };
    }

    public function getTypeColor(): string
    {
        return match($this->type) {
            'earn' => 'green',
            'redeem' => 'red',
            'adjustment' => 'blue',
            'expired' => 'gray',
            default => 'gray',
        };
    }
}
