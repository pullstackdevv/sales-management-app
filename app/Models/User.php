<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Traits\HasRoles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',

        ];
    }

    // Relationships
    public function products()
    {
        return $this->hasMany(Product::class, 'created_by');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class, 'created_by');
    }

    public function stockOpnames()
    {
        return $this->hasMany(StockOpname::class, 'created_by');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    public function verifiedPayments()
    {
        return $this->hasMany(OrderPayment::class, 'verified_by');
    }

    // Note: isOwner(), isAdmin(), isStaff(), hasPermission(), etc.
    // are now provided by the HasRoles trait

    /**
     * Get role description for the user.
     */
    public function getRoleDescription(): string
    {
        $roles = $this->roles;
        
        if ($roles->isEmpty()) {
            return 'Tidak ada akses';
        }

        return $roles->pluck('description')->implode(', ');
    }

    /**
     * Check if user is warehouse staff.
     */
    public function isWarehouse(): bool
    {
        return $this->hasRole('warehouse');
    }
}
