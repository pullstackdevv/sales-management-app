<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Voucher extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'type', // 'percentage' or 'fixed'
        'value',
        'minimum_amount',
        'maximum_discount',
        'usage_limit',
        'used_count',
        'start_date',
        'end_date',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'minimum_amount' => 'decimal:2',
        'maximum_discount' => 'decimal:2',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now());
    }

    public function scopeAvailable($query)
    {
        return $query->active()
                    ->whereRaw('used_count < usage_limit OR usage_limit IS NULL');
    }

    // Methods
    public function isValid()
    {
        return $this->is_active 
            && $this->start_date <= now() 
            && $this->end_date >= now()
            && ($this->usage_limit === null || $this->used_count < $this->usage_limit);
    }

    public function canBeUsed($orderAmount = 0)
    {
        return $this->isValid() && $orderAmount >= $this->minimum_amount;
    }

    public function calculateDiscount($orderAmount)
    {
        if (!$this->canBeUsed($orderAmount)) {
            return 0;
        }

        if ($this->type === 'percentage') {
            $discount = ($orderAmount * $this->value) / 100;
            return $this->maximum_discount ? min($discount, $this->maximum_discount) : $discount;
        }

        return min($this->value, $orderAmount);
    }
}