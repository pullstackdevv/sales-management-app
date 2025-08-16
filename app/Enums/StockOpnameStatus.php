<?php

namespace App\Enums;

enum StockOpnameStatus: string
{
    case DRAFT = 'draft';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case FINALIZED = 'finalized';

    public function label(): string
    {
        return match($this) {
            self::DRAFT => 'Draft',
            self::IN_PROGRESS => 'In Progress',
            self::COMPLETED => 'Completed',
            self::FINALIZED => 'Finalized',
        };
    }
}