<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OriginSetting extends Model
{
    protected $fillable = [
        'store_name',
        'origin_address',
        'phone',
        'address',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];
}
