<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use App\Traits\AuditableOrder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, AuditableOrder;

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
        'guest_email',
        'guest_phone',
        'notes',
        'payment_token',
        'payment_url',
        'payment_status',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'ordered_at' => 'datetime',
        'payment_status' => PaymentStatus::class,
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

    // Helper methods for guest checkout
    public function isGuestOrder()
    {
        return is_null($this->user_id) && !is_null($this->guest_email);
    }

    public function getCustomerEmailAttribute()
    {
        return $this->isGuestOrder() ? $this->guest_email : $this->customer?->email;
    }

    public function getCustomerPhoneAttribute()
    {
        return $this->isGuestOrder() ? $this->guest_phone : $this->customer?->phone;
    }

    // Payment status helpers
    public function isPaid()
    {
        return $this->payment_status === PaymentStatus::PAID;
    }

    public function isPending()
    {
        return $this->payment_status === PaymentStatus::PENDING;
    }

    public function isFailed()
    {
        return $this->payment_status === PaymentStatus::FAILED;
    }

    public function isExpired()
    {
        return $this->payment_status === PaymentStatus::EXPIRED;
    }

    public function isCancelled()
    {
        return $this->payment_status === PaymentStatus::CANCELLED;
    }
}
