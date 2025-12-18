<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourierRate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'courier_id',
        'origin_city',
        'destination_city',
        'service_type',
        'price_per_kg',
        'estimated_days',
        'origin_province',
        'origin_district',
        'destination_province',
        'destination_district',
        'destination_province_code',
        'destination_regency_code',
        'destination_district_code',
        'base_price',
        'min_weight',
        'max_weight',
        'pricing_type',
        'is_available',
        'effective_date',
        'expired_date',
        'etd_days'
    ];

    protected $casts = [
        'price_per_kg' => 'decimal:2',
        'base_price' => 'decimal:2',
        'min_weight' => 'decimal:2',
        'max_weight' => 'decimal:2',
        'estimated_days' => 'integer',
        'is_available' => 'boolean',
        'effective_date' => 'date',
        'expired_date' => 'date'
    ];

    // Relationships
    public function courier()
    {
        return $this->belongsTo(Courier::class);
    }
    public function destinationProvince()
    {
        return $this->belongsTo(Wilayah::class, 'destination_province_code', 'kode');
    }

    /**
     * Relationship ke wilayah kabupaten/kota
     */
    public function destinationRegency()
    {
        return $this->belongsTo(Wilayah::class, 'destination_regency_code', 'kode');
    }

    /**
     * Relationship ke wilayah kecamatan
     */
    public function destinationDistrict()
    {
        return $this->belongsTo(Wilayah::class, 'destination_district_code', 'kode');
    }

    /**
     * Scope untuk rate yang sudah ter-mapping dengan ID wilayah
     */
    public function scopeMapped($query)
    {
        return $query->whereNotNull('destination_district_code');
    }

    /**
     * Scope untuk rate yang belum ter-mapping
     */
    public function scopeUnmapped($query)
    {
        return $query->whereNull('destination_district_code');
    }

    /**
     * Check apakah rate ini sudah ter-mapping dengan sempurna
     */
    public function isMapped(): bool
    {
        return !is_null($this->destination_district_code);
    }

    /**
     * Get match quality/method
     */
    public function getMatchQuality(): string
    {
        if (is_null($this->destination_district_code)) {
            return 'not_matched';
        }
        return 'matched';
    }
}
