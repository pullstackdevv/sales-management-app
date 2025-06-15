<?php

namespace App\Enums;

enum UserRole: string
{
    case OWNER = 'owner';
    case ADMIN = 'admin';
    case STAFF = 'staff';
    case WAREHOUSE = 'warehouse';

    public function label(): string
    {
        return match($this) {
            self::OWNER => 'Owner',
            self::ADMIN => 'Administrator',
            self::STAFF => 'Staff',
            self::WAREHOUSE => 'Warehouse Staff',
        };
    }
} 