<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_id',
        'address_id',
        'user_id',
        'sales_channel_id',
        'voucher_id',
        'total_price',
        'discount_amount',
        'shipping_cost',
        'status',
        'ordered_at',
        'updated_by',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'ordered_at' => 'datetime',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function address()
    {
        return $this->belongsTo(CustomerAddress::class, 'address_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function salesChannel()
    {
        return $this->belongsTo(SalesChannel::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(OrderPayment::class);
    }

    public function shipping()
    {
        return $this->hasOne(Shipping::class);
    }

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
