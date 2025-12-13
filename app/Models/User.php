<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
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
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

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

    public function isOwner(): bool
    {
        return $this->role && $this->role->name === 'owner';
    }

    public function isAdmin(): bool
    {
        return $this->role && $this->role->name === 'admin';
    }

    public function isStaff(): bool
    {
        return $this->role && $this->role->name === 'staff';
    }

    public function isWarehouse(): bool
    {
        return $this->role && $this->role->name === 'warehouse';
    }

    // Permission methods based on role
    public function hasPermission(string $permission): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Owner has all permissions
        if ($this->isOwner()) {
            return true;
        }

        // Get role-based permissions
        $rolePermissions = $this->getRolePermissions();
        
        // Check if permission matches any role permission pattern
        foreach ($rolePermissions as $rolePermission) {
            if ($rolePermission === '*' || $this->matchesPermissionPattern($permission, $rolePermission)) {
                return true;
            }
        }

        return false;
    }

    private function matchesPermissionPattern(string $permission, string $pattern): bool
    {
        // Convert pattern to regex (e.g., 'orders.*' becomes '/^orders\..+$/')
        if (str_ends_with($pattern, '.*')) {
            $prefix = str_replace('.*', '', $pattern);
            return str_starts_with($permission, $prefix . '.');
        }
        
        return $permission === $pattern;
    }

    public function getRolePermissions(): array
    {
        if (!$this->role) {
            return [];
        }

        return $this->role->permissions ?? [];
    }

    public function getRoleDescription(): string
    {
        if (!$this->role) {
            return 'Tidak ada akses';
        }

        return $this->role->description ?? 'Tidak ada deskripsi';
    }
}
