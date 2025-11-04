<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Wilayah extends Model
{
    protected $table = 'wilayah';
    protected $primaryKey = 'kode';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    
    protected $fillable = [
        'kode',
        'nama'
    ];
    
    // Scope untuk provinsi (kode 2 digit)
    public function scopeProvinsi($query)
    {
        return $query->whereRaw('LENGTH(kode) = 2');
    }
    
    // Scope untuk kabupaten/kota (kode 5 digit)
    public function scopeKabupatenKota($query, $provinsiKode = null)
    {
        $query = $query->whereRaw('LENGTH(kode) = 5');
        
        if ($provinsiKode) {
            $query->where('kode', 'LIKE', $provinsiKode . '.%');
        }
        
        return $query;
    }
    
    // Scope untuk kecamatan (kode 8 digit)
    public function scopeKecamatan($query, $kabupatenKode = null)
    {
        $query = $query->whereRaw('LENGTH(kode) = 8');
        
        if ($kabupatenKode) {
            $query->where('kode', 'LIKE', $kabupatenKode . '.%');
        }
        
        return $query;
    }
    
    // Scope untuk kelurahan/desa (kode 13 digit)
    public function scopeKelurahan($query, $kecamatanKode = null)
    {
        $query = $query->whereRaw('LENGTH(kode) = 13');
        
        if ($kecamatanKode) {
            $query->where('kode', 'LIKE', $kecamatanKode . '.%');
        }
        
        return $query;
    }
    
    // Relationship untuk mendapatkan parent wilayah
    public function parent()
    {
        // For this to work properly with eager loading, we need to use a custom approach
        // Since the parent code is derived from the current code, we'll use a belongsTo with a custom foreign key
        $kodeParts = explode('.', $this->kode);
        
        if (count($kodeParts) > 1) {
            array_pop($kodeParts);
            $parentKode = implode('.', $kodeParts);
            
            // Create a belongsTo relationship but we need to handle this differently
            // Let's use a hasOne relationship instead to make it work with eager loading
            return $this->hasOne(self::class, 'kode', 'parent_kode');
        }
        
        return $this->hasOne(self::class, 'kode', 'parent_kode')->whereRaw('1 = 0');
    }
    
    // Add a computed attribute for parent_kode
    public function getParentKodeAttribute()
    {
        $kodeParts = explode('.', $this->kode);
        
        if (count($kodeParts) > 1) {
            array_pop($kodeParts);
            return implode('.', $kodeParts);
        }
        
        return null;
    }
    
    // Method untuk mendapatkan parent wilayah
    public function getParentAttribute()
    {
        $kodeParts = explode('.', $this->kode);
        
        if (count($kodeParts) > 1) {
            array_pop($kodeParts);
            $parentKode = implode('.', $kodeParts);
            return self::where('kode', $parentKode)->first();
        }
        
        return null;
    }
    
    // Method untuk mendapatkan children wilayah
    public function getChildrenAttribute()
    {
        return self::where('kode', 'LIKE', $this->kode . '.%')
                  ->whereRaw('LENGTH(kode) = ?', [strlen($this->kode) + 3])
                  ->get();
    }
}
