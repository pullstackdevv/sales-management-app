<?php

namespace App\Traits;

use App\Models\OrderAuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait AuditableOrder
{
    /**
     * Boot the auditable trait for a model.
     */
    public static function bootAuditableOrder()
    {
        static::created(function ($model) {
            $model->auditLog('created');
        });

        static::updated(function ($model) {
            $model->auditChanges();
        });
    }

    /**
     * Create an audit log entry.
     */
    public function auditLog(
        string $action,
        ?string $fieldName = null,
        mixed $oldValue = null,
        mixed $newValue = null,
        ?array $metadata = null
    ): void {
        $user = Auth::user();
        
        OrderAuditLog::createLog(
            orderId: $this->id,
            action: $action,
            fieldName: $fieldName,
            oldValue: $oldValue,
            newValue: $newValue,
            userId: $user?->id,
            userName: $user?->name,
            ipAddress: Request::ip(),
            userAgent: Request::userAgent(),
            metadata: $metadata
        );
    }

    /**
     * Audit changes made to the model.
     */
    protected function auditChanges(): void
    {
        $changes = $this->getChanges();
        $original = $this->getOriginal();

        // Skip timestamps and updated_by fields
        $skipFields = ['updated_at', 'created_at', 'updated_by'];
        
        foreach ($changes as $field => $newValue) {
            if (in_array($field, $skipFields)) {
                continue;
            }

            $oldValue = $original[$field] ?? null;
            
            // Determine action based on field
            $action = $this->getActionForField($field);
            
            $this->auditLog(
                action: $action,
                fieldName: $field,
                oldValue: $oldValue,
                newValue: $newValue
            );
        }
    }

    /**
     * Get the appropriate action name for a field.
     */
    protected function getActionForField(string $field): string
    {
        return match ($field) {
            'status' => 'status_changed',
            'payment_status' => 'payment_updated',
            'shipping_cost', 'courier_id', 'tracking_number' => 'shipping_updated',
            'total_amount', 'discount_amount', 'voucher_id' => 'payment_updated',
            default => 'updated'
        };
    }

    /**
     * Get audit logs for this order.
     */
    public function auditLogs()
    {
        return $this->hasMany(OrderAuditLog::class, 'order_id');
    }

    /**
     * Get formatted audit history.
     */
    public function getAuditHistory()
    {
        return $this->auditLogs()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'field_name' => $log->field_name,
                    'old_value' => $this->formatValue($log->field_name, $log->old_value),
                    'new_value' => $this->formatValue($log->field_name, $log->new_value),
                    'user' => [
                        'id' => $log->user_id,
                        'name' => $log->user_name ?? $log->user?->name,
                    ],
                    'created_at' => $log->created_at,
                    'metadata' => $log->metadata,
                ];
            });
    }

    /**
     * Format field values for display.
     */
    protected function formatValue(?string $fieldName, mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($fieldName) {
            'status' => ucfirst(str_replace('_', ' ', $value)),
            'payment_status' => ucfirst(str_replace('_', ' ', $value)),
            'total_amount', 'discount_amount', 'shipping_cost', 'total_price' => 'Rp ' . number_format($value, 0, ',', '.'),
            'courier_id' => $this->getCourierName($value),
            default => $value
        };
    }

    /**
     * Get courier name by ID.
     */
    protected function getCourierName($courierId): string
    {
        if (!$courierId) {
            return '-';
        }
        
        $courier = \App\Models\Courier::find($courierId);
        return $courier?->name ?? "Courier ID: {$courierId}";
    }
}