<?php

namespace App\Traits;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

trait HasRoles
{
    /**
     * Get all roles for the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_has_roles');
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string|array $roles): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $roles = is_array($roles) ? $roles : [$roles];

        return $this->roles()->whereIn('name', $roles)->exists();
    }

    /**
     * Check if user has any of the given roles.
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->hasRole($roles);
    }

    /**
     * Check if user has all of the given roles.
     */
    public function hasAllRoles(array $roles): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $userRoles = $this->roles()->pluck('name')->toArray();

        return count(array_intersect($roles, $userRoles)) === count($roles);
    }

    /**
     * Assign role(s) to user.
     */
    public function assignRole(string|array|Role $roles): self
    {
        $roles = is_array($roles) ? $roles : [$roles];

        foreach ($roles as $role) {
            $roleModel = $role instanceof Role ? $role : Role::where('name', $role)->firstOrFail();
            $this->roles()->syncWithoutDetaching($roleModel);
        }

        return $this;
    }

    /**
     * Remove role(s) from user.
     */
    public function removeRole(string|array|Role $roles): self
    {
        $roles = is_array($roles) ? $roles : [$roles];

        foreach ($roles as $role) {
            $roleModel = $role instanceof Role ? $role : Role::where('name', $role)->first();
            if ($roleModel) {
                $this->roles()->detach($roleModel);
            }
        }

        return $this;
    }

    /**
     * Sync roles (replace all existing roles).
     */
    public function syncRoles(array $roles): self
    {
        $roleIds = collect($roles)->map(function ($role) {
            return $role instanceof Role ? $role->id : Role::where('name', $role)->firstOrFail()->id;
        });

        $this->roles()->sync($roleIds);

        return $this;
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Owner has all permissions
        if ($this->hasRole('owner')) {
            return true;
        }

        // Get all permissions from all user's roles
        $permissions = $this->getAllPermissions();

        // Check for wildcard (*)
        if ($permissions->contains('name', '*')) {
            return true;
        }

        // Check exact permission
        if ($permissions->contains('name', $permission)) {
            return true;
        }

        // Check wildcard patterns (e.g., 'orders.*' matches 'orders.view')
        foreach ($permissions as $perm) {
            if (str_ends_with($perm->name, '.*')) {
                $prefix = str_replace('.*', '', $perm->name);
                if (str_starts_with($permission, $prefix . '.')) {
                    return true;
                }
            }
        }
        // Check module-level permission (e.g., 'orders' matches 'orders.view', 'orders.create', etc.)
        // This is for middleware that checks coarse-grained permissions
        foreach ($permissions as $perm) {
            if (str_starts_with($perm->name, $permission . '.')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get all permissions from all user's roles.
     */
    public function getAllPermissions(): Collection
    {
        return $this->roles()
            ->with('permissions')
            ->get()
            ->pluck('permissions')
            ->flatten()
            ->unique('id');
    }

    /**
     * Get all permission names from all user's roles.
     */
    public function getPermissionNames(): array
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * Check if user is owner.
     */
    public function isOwner(): bool
    {
        return $this->hasRole('owner');
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if user is staff.
     */
    public function isStaff(): bool
    {
        return $this->hasRole('staff');
    }
}
