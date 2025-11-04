<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderAuditLog extends Model
{
    protected $fillable = [
        'order_id',
        'action',
        'field_name',
        'old_value',
        'new_value',
        'user_id',
        'user_name',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the order that this audit log belongs to.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the user who performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a new audit log entry.
     */
    public static function createLog(
        int $orderId,
        string $action,
        ?string $fieldName = null,
        mixed $oldValue = null,
        mixed $newValue = null,
        ?int $userId = null,
        ?string $userName = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?array $metadata = null
    ): self {
        return self::create([
            'order_id' => $orderId,
            'action' => $action,
            'field_name' => $fieldName,
            'old_value' => is_array($oldValue) || is_object($oldValue) ? json_encode($oldValue) : $oldValue,
            'new_value' => is_array($newValue) || is_object($newValue) ? json_encode($newValue) : $newValue,
            'user_id' => $userId,
            'user_name' => $userName,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'metadata' => $metadata,
        ]);
    }
}
