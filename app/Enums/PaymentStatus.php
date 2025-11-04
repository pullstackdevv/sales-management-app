<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case PENDING = 'pending';
    case PAID = 'paid';
    case FAILED = 'failed';
    case EXPIRED = 'expired';
    case CANCELLED = 'cancelled';
    
    public function label(): string
    {
        return match($this) {
            self::PENDING => 'Menunggu Pembayaran',
            self::PAID => 'Sudah Dibayar',
            self::FAILED => 'Pembayaran Gagal',
            self::EXPIRED => 'Pembayaran Kedaluwarsa',
            self::CANCELLED => 'Pembayaran Dibatalkan',
        };
    }
    
    public function color(): string
    {
        return match($this) {
            self::PENDING => 'warning',
            self::PAID => 'success',
            self::FAILED => 'danger',
            self::EXPIRED => 'secondary',
            self::CANCELLED => 'dark',
        };
    }
}
