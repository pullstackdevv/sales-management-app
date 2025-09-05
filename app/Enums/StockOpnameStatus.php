<?php

namespace App\Enums;

enum StockOpnameStatus: string
{
    case DRAFT = 'draft';
    case FINALIZED = 'finalized';

    public function label(): string
    {
        return match($this) {
            self::DRAFT => 'Draft',
            self::FINALIZED => 'Finalized',
        };
    }
}