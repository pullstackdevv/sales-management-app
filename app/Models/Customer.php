<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'line_id',
        'other_contact',
        'category',
        'created_by',
        'updated_by',
    ];

    // Relationships
    public function addresses()
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function loyaltyPoints()
    {
        return $this->hasOne(CustomerPoint::class);
    }

    public function pointTransactions()
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function getLoyaltyPoint(): CustomerPoint
    {
        return CustomerPoint::getOrCreate($this->id);
    }

    public function getCurrentTier(): ?LoyaltyTier
    {
        return $this->getLoyaltyPoint()->tier;
    }

    public function getCurrentPoints(): int
    {
        return $this->getLoyaltyPoint()->current_points;
    }
}
