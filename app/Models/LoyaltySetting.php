<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'description',
        'is_active',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public static function getValue(string $key, $default = null)
    {
        $setting = self::where('key', $key)->where('is_active', true)->first();
        return $setting ? $setting->value : $default;
    }

    public static function setValue(string $key, $value, ?int $userId = null)
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'updated_by' => $userId]
        );
    }

    public static function getPointRate(): int
    {
        return (int) self::getValue('point_rate', 10000);
    }

    public static function getMinRedeemAmount(): int
    {
        return (int) self::getValue('min_redeem_amount', 50000);
    }

    public static function getMaxRedeemPercentage(): int
    {
        return (int) self::getValue('max_redeem_percentage', 20);
    }

    public static function getRedeemOptions(): array
    {
        $options = self::getValue('redeem_options', '50000,100000,200000');
        return array_map('intval', explode(',', $options));
    }

    public static function getRedeemValue(): int
    {
        $explicit = self::getValue('redeem_value', null);
        if ($explicit !== null) {
            return (int) $explicit;
        }

        // Fallback ke point_rate jika nilai khusus redeem belum diatur
        return self::getPointRate();
    }

    public static function getMinRedeem(): int
    {
        return (int) self::getValue('min_redeem', 1);
    }

    public static function isLoyaltyActive(): bool
    {
        return self::getValue('loyalty_active', '1') === '1';
    }
}
