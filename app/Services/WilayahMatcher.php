<?php

namespace App\Services;

use App\Models\Wilayah;
use Illuminate\Support\Facades\Log;

class WilayahMatcher
{
    // Cache untuk menyimpan maps agar tidak perlu rebuild setiap kali
    private static ?array $cachedMaps = null;
    
    /**
     * Normalisasi nama provinsi dengan berbagai varian
     */
    public static function normalizeProvince(string $name): string
    {
        $n = trim($name);
        
        // Hapus prefix "Provinsi"
        $n = preg_replace('/^(Provinsi|Prov\.?)\s+/i', '', $n);
        
        $l = mb_strtolower($n);
        
        // Handle Jakarta variants
        if (self::containsAny($l, ['daerah khusus ibukota', 'dki jakarta', 'dki', 'jakarta'])) {
            return 'DKI Jakarta';
        }
        
        // Handle Yogyakarta variants
        if (self::containsAny($l, ['daerah istimewa yogyakarta', 'di yogyakarta', 'diy'])) {
            return 'DI Yogyakarta';
        }
        
        // Handle Aceh variants
        if (self::containsAny($l, ['nanggroe aceh darussalam', 'nad', 'aceh'])) {
            return 'Aceh';
        }
        
        // Handle Bangka Belitung
        if (self::containsAny($l, ['kepulauan bangka belitung', 'bangka belitung', 'babel'])) {
            return 'Kepulauan Bangka Belitung';
        }
        
        // Handle Kepulauan Riau
        if (self::containsAny($l, ['kepulauan riau', 'kepri'])) {
            return 'Kepulauan Riau';
        }
        
        return $n;
    }

    /**
     * Normalisasi nama kota/kabupaten dengan berbagai varian
     */
    public static function normalizeCity(string $name): string
    {
        $n = trim($name);
        
        // Simpan informasi apakah Kota atau Kabupaten
        $isKota = preg_match('/^Kota\s+/i', $n);
        
        // Hapus prefix
        $n = preg_replace('/^(Kabupaten|Kab\.?|Kota|Kota Administrasi|Kota Adm\.?)\s+/i', '', $n);
        
        $l = mb_strtolower($n);
        
        // Handle Jakarta administrative cities
        if (self::containsAny($l, ['jakarta'])) {
            if (preg_match('/jakarta\s+([a-zA-Z\s]+)/i', $name, $m)) {
                return 'Jakarta ' . ucwords(trim($m[1]));
            }
            return 'Jakarta';
        }
        
        // Untuk kota-kota dengan nama yang sama dengan kabupaten, tambahkan prefix
        $kotaNames = ['Bandung', 'Bogor', 'Bekasi', 'Depok', 'Tangerang', 'Surabaya', 
                      'Malang', 'Semarang', 'Yogyakarta', 'Sukabumi', 'Cirebon',
                      'Padang', 'Palembang', 'Batam', 'Kediri', 'Lubuk Linggau'];
        
        if ($isKota && in_array($n, $kotaNames)) {
            return 'Kota ' . $n;
        }
        
        return $n;
    }

    /**
     * Normalisasi nama kecamatan
     */
    public static function normalizeDistrict(string $name): string
    {
        $n = trim($name);
        
        // Hapus berbagai prefix yang mungkin ada
        $prefixes = ['Kabupaten ', 'Kab. ', 'Kota ', 'Kecamatan ', 'Kec. ', 'Kelurahan ', 'Kel. ', 'Desa '];
        foreach ($prefixes as $p) {
            if (stripos($n, $p) === 0) {
                $n = trim(substr($n, strlen($p)));
                break;
            }
        }
        
        return $n;
    }

    /**
     * Hitung similarity score antara dua string
     */
    public static function similarity(string $a, string $b): float
    {
        $a = trim(mb_strtolower($a));
        $b = trim(mb_strtolower($b));
        
        if ($a === '' || $b === '') return 0.0;
        if ($a === $b) return 1.0;
        
        similar_text($a, $b, $pct);
        return $pct / 100.0;
    }

    /**
     * Hitung Jaccard similarity berdasarkan token
     */
    public static function tokenJaccard(string $a, string $b): float
    {
        $ta = self::tokens($a);
        $tb = self::tokens($b);
        
        if (empty($ta) || empty($tb)) return 0.0;
        
        $inter = array_intersect($ta, $tb);
        $union = array_unique(array_merge($ta, $tb));
        
        return count($inter) / max(count($union), 1);
    }

    /**
     * Tokenize string menjadi array kata-kata
     */
    public static function tokens(string $s): array
    {
        $s = self::normalizeForCompare($s);
        $parts = preg_split('/\s+/', $s, -1, PREG_SPLIT_NO_EMPTY);
        return array_values(array_unique($parts));
    }

    /**
     * Normalisasi string untuk perbandingan
     */
    private static function normalizeForCompare(string $s): string
    {
        $s = self::normalizeNumerics($s);
        $s = self::normalizeRomanNumerals($s);
        $s = trim(mb_strtolower($s));
        $s = self::applySynonyms($s);
        
        // Hapus karakter non-alphanumeric kecuali spasi
        $s = preg_replace('/[^a-z0-9\s]/u', ' ', $s);
        
        // Normalize spasi ganda
        $s = preg_replace('/\s+/', ' ', $s);
        
        return trim($s);
    }

    /**
     * Normalisasi angka dalam string (2 X 11 -> 2x11)
     */
    private static function normalizeNumerics(string $s): string
    {
        $s = str_replace(['×', ' X ', ' x '], [' x ', ' x ', ' x '], $s);
        $s = preg_replace('/\s*x\s*/i', 'x', $s);
        return $s;
    }

    /**
     * Normalisasi angka romawi dalam kurung
     * Contoh: "Utara II" dan "Utara (II)" menjadi equivalent
     */
    private static function normalizeRomanNumerals(string $s): string
    {
        // Mapping angka romawi ke angka biasa untuk normalisasi
        $romanMap = [
            'I' => '1',
            'II' => '2',
            'III' => '3',
            'IV' => '4',
            'V' => '5',
            'VI' => '6',
            'VII' => '7',
            'VIII' => '8',
            'IX' => '9',
            'X' => '10',
            'XI' => '11',
            'XII' => '12'
        ];
        
        // Normalize roman numerals dalam kurung: (II) -> 2
        foreach ($romanMap as $roman => $numeric) {
            $s = preg_replace('/\(\s*' . $roman . '\s*\)/i', ' ' . $numeric, $s);
            $s = preg_replace('/\b' . $roman . '\b(?!\))/i', ' ' . $numeric, $s);
        }
        
        return $s;
    }

    /**
     * Mapping sinonim untuk bahasa daerah dan variasi penulisan
     */
    private static array $synonyms = [
        // Bahasa daerah Minang
        'anam' => 'enam',
        'tigo' => 'tiga',
        'limo' => 'lima',
        'ampek' => 'empat',
        'salapan' => 'sembilan',
        'sapuluh' => 'sepuluh',
        'sabelas' => 'sebelas',
        
        // Variasi penulisan umum
        'sungai' => 'sg',
        'sg' => 'sungai',
        'sei' => 'sungai',
        'selatan' => 'sel',
        'utara' => 'utr',
        'barat' => 'bar',
        'timur' => 'tim',
        'tengah' => 'tgh',
        
        // Variasi angka tulisan
        'satu' => '1',
        'dua' => '2',
        'tiga' => '3',
        'empat' => '4',
        'lima' => '5',
        'enam' => '6',
        'tujuh' => '7',
        'delapan' => '8',
        'sembilan' => '9',
        'sepuluh' => '10',
        'sebelas' => '11',
        'dua belas' => '12',
        
        // Variasi nama kota/daerah
        'padangsidimpuan' => 'padang sidempuan',
        'padangsidempuan' => 'padang sidempuan',
        'lubuklinggau' => 'lubuk linggau',
    ];

    /**
     * Terapkan mapping sinonim
     */
    private static function applySynonyms(string $s): string
    {
        foreach (self::$synonyms as $from => $to) {
            $s = preg_replace('/\b' . preg_quote($from, '/') . '\b/u', $to, $s);
        }
        return $s;
    }

    /**
     * Hitung Levenshtein ratio
     */
    private static function levenshteinRatio(string $a, string $b): float
    {
        $a = self::normalizeForCompare($a);
        $b = self::normalizeForCompare($b);
        
        $maxLen = max(strlen($a), strlen($b));
        if ($maxLen === 0) return 0.0;
        if ($maxLen > 255) return 0.0; // Levenshtein limit
        
        $distance = levenshtein($a, $b);
        return 1.0 - ($distance / $maxLen);
    }

    /**
     * Extract konten dalam dan luar kurung
     * Contoh: "Lubuk Linggau Utara (II)" -> ["II", "Lubuk Linggau Utara"]
     */
    private static function extractParentheses(string $s): array
    {
        $inside = '';
        $parts = [];
        
        // Extract semua yang ada dalam kurung
        if (preg_match_all('/\(([^\)]+)\)/u', $s, $matches)) {
            $parts = $matches[1];
            foreach ($matches[1] as $match) {
                $inside .= ' ' . trim($match);
            }
        }
        
        // Remove semua kurung untuk dapat outside content
        $outside = preg_replace('/\([^\)]*\)/u', ' ', $s);
        $outside = preg_replace('/\s+/', ' ', trim($outside));
        
        return [trim($inside), $outside, $parts];
    }

    /**
     * Generate varian nama untuk pencocokan yang lebih fleksibel
     * IMPROVED: Handle parentheses, roman numerals, dan slash separator
     */
    private static function variantsFor(string $s): array
    {
        $variants = [];
        
        // Original normalized
        $norm = self::normalizeForCompare($s);
        $variants[] = $norm;
        
        // Handle slash separator (e.g., "Sei/Sungai Baduk")
        if (strpos($s, '/') !== false) {
            $parts = explode('/', $s);
            foreach ($parts as $part) {
                $trimmed = trim($part);
                if ($trimmed) {
                    $variants[] = self::normalizeForCompare($trimmed);
                }
            }
            
            // Combine both parts with space
            $combined = implode(' ', array_map('trim', $parts));
            $variants[] = self::normalizeForCompare($combined);
        }
        
        // Extract parentheses content
        [$inside, $outside, $partsInside] = self::extractParentheses($s);
        
        // Varian 1: Hanya konten luar kurung
        if ($outside && $outside !== $norm) {
            $variants[] = self::normalizeForCompare($outside);
        }
        
        // Varian 2: Konten luar + konten dalam tanpa kurung
        if ($inside && $outside) {
            $combined = $outside . ' ' . $inside;
            $variants[] = self::normalizeForCompare($combined);
        }
        
        // Varian 3: Konten dalam saja (untuk match partial)
        if ($inside) {
            $variants[] = self::normalizeForCompare($inside);
        }
        
        // Varian 4: Handle roman numerals variations
        // "Utara II" vs "Utara (II)" vs "Utara 2"
        if ($partsInside) {
            foreach ($partsInside as $part) {
                // Coba dengan dan tanpa kurung
                $withoutParen = $outside . ' ' . $part;
                $variants[] = self::normalizeForCompare($withoutParen);
            }
        }
        
        // Varian 5: Tanpa spasi (untuk match "LubukLinggau" vs "Lubuk Linggau")
        foreach (array_unique($variants) as $v) {
            $nospace = str_replace(' ', '', $v);
            if ($nospace !== $v && strlen($nospace) > 2) {
                $variants[] = $nospace;
            }
        }
        
        // Varian 6: Dengan normalisasi roman numeral
        $withNormalizedRoman = self::normalizeRomanNumerals($s);
        if ($withNormalizedRoman !== $s) {
            $variants[] = self::normalizeForCompare($withNormalizedRoman);
            $nospace = str_replace(' ', '', self::normalizeForCompare($withNormalizedRoman));
            if (strlen($nospace) > 2) {
                $variants[] = $nospace;
            }
        }
        
        return array_values(array_unique(array_filter($variants)));
    }

    /**
     * Hitung composite score untuk pencocokan kecamatan/kota
     * IMPROVED: Better handling untuk parentheses dan roman numerals
     */
    private static function compositeDistrictScore(string $needle, string $candidate): float
    {
        $variantsA = self::variantsFor($needle);
        $variantsB = self::variantsFor($candidate);
        
        $best = 0.0;
        
        foreach ($variantsA as $va) {
            foreach ($variantsB as $vb) {
                // Exact match gets perfect score
                if ($va === $vb) {
                    return 1.0;
                }
                
                // Calculate multiple similarity metrics
                $sim = self::similarity($va, $vb);
                $jac = self::tokenJaccard($va, $vb);
                $nospaceSim = self::similarity(str_replace(' ', '', $va), str_replace(' ', '', $vb));
                $lev = self::levenshteinRatio($va, $vb);
                
                // Weighted composite score dengan bobot yang lebih seimbang
                $score = (0.30 * $sim) + (0.30 * $jac) + (0.25 * $nospaceSim) + (0.15 * $lev);
                
                // Bonus untuk substring match
                if (strpos($va, $vb) !== false || strpos($vb, $va) !== false) {
                    $score = min(1.0, $score + 0.05);
                }
                
                // Bonus untuk match dengan perbedaan hanya di parentheses/roman
                if (self::isParenthesesOnlyDifference($va, $vb)) {
                    $score = min(1.0, $score + 0.10);
                }
                
                $best = max($best, $score);
            }
        }
        
        return $best;
    }

    /**
     * Check apakah perbedaan hanya pada parentheses atau roman numerals
     */
    private static function isParenthesesOnlyDifference(string $a, string $b): bool
    {
        // Remove parentheses dan normalize
        $aNoParen = preg_replace('/[()]/u', '', $a);
        $bNoParen = preg_replace('/[()]/u', '', $b);
        
        $aNoParen = preg_replace('/\s+/', ' ', trim($aNoParen));
        $bNoParen = preg_replace('/\s+/', ' ', trim($bNoParen));
        
        // Normalize roman numerals
        $aNormalized = self::normalizeRomanNumerals($aNoParen);
        $bNormalized = self::normalizeRomanNumerals($bNoParen);
        
        $aNormalized = preg_replace('/\s+/', ' ', trim($aNormalized));
        $bNormalized = preg_replace('/\s+/', ' ', trim($bNormalized));
        
        // Check similarity after normalization
        return self::similarity($aNormalized, $bNormalized) >= 0.95;
    }

    /**
     * Hitung composite score untuk kota
     */
    private static function compositeCityScore(string $needle, string $candidate): float
    {
        return self::compositeDistrictScore($needle, $candidate);
    }

    /**
     * Build lookup maps dari database
     * Menggunakan caching untuk performa
     */
    public static function buildMaps(): array
    {
        if (self::$cachedMaps !== null) {
            return self::$cachedMaps;
        }
        
        try {
            // Map provinsi: normalized name -> kode
            $provByName = [];
            foreach (Wilayah::provinsi()->select('kode', 'nama')->get() as $p) {
                $normalized = self::normalizeProvince($p->nama);
                $provByName[$normalized] = $p->kode;
                
                // Tambahkan variasi nama untuk mapping lebih baik
                $provByName[$p->nama] = $p->kode;
                
                // Tambahkan semua variants
                $variants = self::variantsFor($p->nama);
                foreach ($variants as $variant) {
                    if (!isset($provByName[$variant])) {
                        $provByName[$variant] = $p->kode;
                    }
                }
            }

            // Map kabupaten/kota: provinsi_kode -> [normalized name -> kode]
            $regByProv = [];
            foreach (Wilayah::kabupatenKota()->select('kode', 'nama')->get() as $r) {
                $provCode = explode('.', $r->kode)[0];
                $regByProv[$provCode] ??= [];
                
                $normalized = self::normalizeCity($r->nama);
                $regByProv[$provCode][$normalized] = $r->kode;
                $regByProv[$provCode][$r->nama] = $r->kode;
                
                // Tambahkan variants
                $variants = self::variantsFor($r->nama);
                foreach ($variants as $variant) {
                    if (!isset($regByProv[$provCode][$variant])) {
                        $regByProv[$provCode][$variant] = $r->kode;
                    }
                }
            }

            // Map kecamatan: regency_kode -> [normalized name -> info]
            $distByReg = [];
            foreach (Wilayah::kecamatan()->select('kode', 'nama')->get() as $d) {
                $regCode = substr($d->kode, 0, 5);
                $distByReg[$regCode] ??= [];
                
                $normalized = self::normalizeDistrict($d->nama);
                $info = ['kode' => $d->kode, 'nama' => $d->nama];
                
                $distByReg[$regCode][$normalized] = $info;
                $distByReg[$regCode][$d->nama] = $info;
                
                // Tambahkan variants untuk match yang lebih baik
                $variants = self::variantsFor($d->nama);
                foreach ($variants as $variant) {
                    if (!isset($distByReg[$regCode][$variant])) {
                        $distByReg[$regCode][$variant] = $info;
                    }
                }
            }

            self::$cachedMaps = [$provByName, $regByProv, $distByReg];
            return self::$cachedMaps;
            
        } catch (\Exception $e) {
            Log::error('Failed to build wilayah maps', ['error' => $e->getMessage()]);
            return [[], [], []];
        }
    }

    /**
     * Konversi kode ke format canonical (XX.YY.ZZ)
     */
    public static function canonicalDistrictCode(?string $code): ?string
    {
        if (!$code) return null;
        $raw = trim($code);
        $raw = str_replace([',', '-', ' '], '.', $raw);
        $raw = preg_replace('/\.+/', '.', $raw);
        $digits = preg_replace('/[^0-9]/', '', $raw);
        if (strlen($digits) >= 6) {
            $p1 = substr($digits, 0, 2);
            $p2 = substr($digits, 2, 2);
            $p3 = substr($digits, 4, 2);
            return sprintf('%02d.%02d.%02d', (int)$p1, (int)$p2, (int)$p3);
        }
        $parts = explode('.', $raw);
        if (count($parts) >= 3) {
            return sprintf('%s.%s.%s',
                str_pad($parts[0], 2, '0', STR_PAD_LEFT),
                str_pad($parts[1], 2, '0', STR_PAD_LEFT),
                str_pad($parts[2], 2, '0', STR_PAD_LEFT)
            );
        }
        return null;
    }

    /**
     * Konversi kode ke format canonical (XX.YY)
     */
    public static function canonicalRegencyCode(?string $code): ?string
    {
        if (!$code) return null;
        $raw = trim($code);
        $raw = str_replace([',', '-', ' '], '.', $raw);
        $raw = preg_replace('/\.+/', '.', $raw);
        $digits = preg_replace('/[^0-9]/', '', $raw);
        if (strlen($digits) >= 4) {
            $p1 = substr($digits, 0, 2);
            $p2 = substr($digits, 2, 2);
            return sprintf('%02d.%02d', (int)$p1, (int)$p2);
        }
        $parts = explode('.', $raw);
        if (count($parts) >= 2) {
            return sprintf('%s.%s',
                str_pad($parts[0], 2, '0', STR_PAD_LEFT),
                str_pad($parts[1], 2, '0', STR_PAD_LEFT)
            );
        }
        return null;
    }

    public static function canonicalProvinceCode(?string $code): ?string
    {
        if (!$code) return null;
        $digits = preg_replace('/[^0-9]/', '', trim($code));
        if ($digits === '') return null;
        $p1 = substr($digits, 0, 2);
        return sprintf('%02d', (int)$p1);
    }

    /**
     * Helper untuk check apakah string mengandung salah satu dari array
     */
    private static function containsAny(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($haystack, $needle)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Match location codes dengan fuzzy matching
     * IMPROVED: Better threshold dan logging
     * 
     * @return array [provinsi_kode, regency_kode, district_kode]
     */
    public static function matchCodes(
        ?string $province, 
        ?string $city, 
        ?string $district, 
        array $maps
    ): array {
        [$provByName, $regByProv, $distByReg] = $maps;
        
        // Normalisasi input
        $pNorm = $province ? self::normalizeProvince($province) : '';
        $cNorm = $city ? self::normalizeCity($city) : '';
        $dNorm = $district ? self::normalizeDistrict($district) : '';
        
        // 1. Match Provinsi
        $provCode = $provByName[$pNorm] ?? null;
        
        // Jika tidak exact match, coba fuzzy
        if (!$provCode && $pNorm) {
            $bestKey = self::bestKeyMatch($pNorm, $provByName, 0.80);
            if ($bestKey) {
                $provCode = $provByName[$bestKey];
                Log::debug("Fuzzy matched province", [
                    'input' => $province,
                    'matched' => $bestKey,
                    'code' => $provCode
                ]);
            }
        }
        
        if (!$provCode) {
            Log::warning("Province not matched", ['input' => $province]);
            return [null, null, null];
        }

        // 2. Match Kabupaten/Kota
        $regMap = $regByProv[$provCode] ?? [];
        $regCode = $regMap[$cNorm] ?? null;
        
        // Jika tidak exact match, coba composite score
        if (!$regCode && $cNorm) {
            $bestKey = null;
            $bestScore = 0.0;
            $secondScore = 0.0;
            
            foreach ($regMap as $key => $code) {
                $score = self::compositeCityScore($cNorm, $key);
                
                if ($score > $bestScore) {
                    $secondScore = $bestScore;
                    $bestScore = $score;
                    $bestKey = $key;
                }
            }
            
            // Threshold diturunkan untuk lebih fleksibel dengan parentheses
            if ($bestKey && $bestScore >= 0.85 && ($bestScore - $secondScore) >= 0.03) {
                $regCode = $regMap[$bestKey];
                Log::debug("Fuzzy matched city", [
                    'input' => $city,
                    'matched' => $bestKey,
                    'score' => round($bestScore, 3),
                    'code' => $regCode
                ]);
            }
        }
        
        if (!$regCode) {
            Log::warning("City not matched", [
                'province' => $province,
                'city' => $city
            ]);
            return [$provCode, null, null];
        }

        // 3. Match Kecamatan
        $distMap = $distByReg[$regCode] ?? [];
        $distCode = null;
        
        // Coba exact match dulu
        if (isset($distMap[$dNorm])) {
            $distCode = $distMap[$dNorm]['kode'];
        } else if ($dNorm) {
            // Fuzzy matching dengan composite score
            $bestKey = null;
            $bestScore = 0.0;
            $secondScore = 0.0;
            $bestInfo = null;
            
            foreach ($distMap as $normName => $info) {
                $score = self::compositeDistrictScore($dNorm, $info['nama']);
                
                if ($score > $bestScore) {
                    $secondScore = $bestScore;
                    $bestScore = $score;
                    $bestKey = $normName;
                    $bestInfo = $info;
                }
            }
            
            // Threshold diturunkan untuk akomodasi parentheses dan roman numerals
            if ($bestKey && $bestScore >= 0.82 && ($bestScore - $secondScore) >= 0.03) {
                $distCode = $bestInfo['kode'];
                Log::debug("Fuzzy matched district", [
                    'input' => $district,
                    'matched' => $bestInfo['nama'],
                    'score' => round($bestScore, 3),
                    'code' => $distCode
                ]);
            } else {
                // Fallback: cari di seluruh kecamatan dalam provinsi
                [$candReg, $candDist] = self::findDistrictAcrossProvinceComposite(
                    $provCode, 
                    $dNorm, 
                    $regByProv, 
                    $distByReg
                );
                
                if ($candReg && $candDist) {
                    $regCode = $candReg;
                    $distCode = $candDist;
                    Log::debug("Found district across province", [
                        'input' => $district,
                        'regency' => $candReg,
                        'district' => $candDist
                    ]);
                }
            }
        }

        return [$provCode, $regCode, $distCode];
    }

    /**
     * Cari best match key dari haystack dengan threshold
     */
    private static function bestKeyMatch(string $needle, array $haystack, float $threshold): ?string
    {
        $bestKey = null;
        $bestScore = 0.0;
        $secondScore = 0.0;
        
        foreach ($haystack as $key => $val) {
            $score = max(
                self::similarity($needle, $key),
                self::tokenJaccard($needle, $key),
                self::compositeDistrictScore($needle, $key) // Use composite untuk lebih akurat
            );
            
            if ($score > $bestScore) {
                $secondScore = $bestScore;
                $bestScore = $score;
                $bestKey = $key;
            }
        }
        
        // Butuh score di atas threshold DAN gap yang jelas dari kandidat kedua
        if ($bestScore < $threshold) return null;
        if ($bestScore - $secondScore < 0.03) return null;
        
        return $bestKey;
    }

    /**
     * Cari kecamatan di seluruh kabupaten/kota dalam provinsi
     * IMPROVED: Lower threshold untuk parentheses cases
     */
    private static function findDistrictAcrossProvinceComposite(
        string $provCode,
        string $dNorm,
        array $regByProv,
        array $distByReg
    ): array {
        $regMap = $regByProv[$provCode] ?? [];
        
        $topReg = null;
        $topDist = null;
        $best = 0.0;
        $second = 0.0;
        
        foreach ($regMap as $regCode) {
            $distMap = $distByReg[$regCode] ?? [];
            
            foreach ($distMap as $normName => $info) {
                $score = self::compositeDistrictScore($dNorm, $info['nama']);
                
                if ($score > $best) {
                    $second = $best;
                    $best = $score;
                    $topReg = $regCode;
                    $topDist = $info['kode'];
                }
            }
        }
        
        // Threshold lebih rendah untuk cross-regency match dengan parentheses
        if ($best >= 0.85 && ($best - $second) >= 0.05) {
            return [$topReg, $topDist];
        }
        
        return [null, null];
    }

    /**
     * Clear cached maps
     */
    public static function clearCache(): void
    {
        self::$cachedMaps = null;
    }

    /**
     * Get province variants untuk query filtering
     */
    public static function getProvinceVariants(string $province): array
    {
        $normalized = self::normalizeProvince($province);
        $variants = array_merge([$province, $normalized], self::variantsFor($province));
        
        $lower = mb_strtolower($province);
        
        if (self::containsAny($lower, ['yogyakarta', 'jogja'])) {
            $variants[] = 'DI Yogyakarta';
            $variants[] = 'Yogyakarta';
            $variants[] = 'D.I. Yogyakarta';
        }
        
        if (self::containsAny($lower, ['jakarta', 'dki'])) {
            $variants[] = 'DKI Jakarta';
            $variants[] = 'Jakarta';
            $variants[] = 'Daerah Khusus Ibukota Jakarta';
        }
        
        return array_values(array_unique($variants));
    }

    /**
     * Get city variants untuk query filtering
     */
    public static function getCityVariants(string $city): array
    {
        $normalized = self::normalizeCity($city);
        $variants = array_merge([$city, $normalized], self::variantsFor($city));
        
        // Tambahkan dengan prefix Kota dan Kabupaten
        if (!preg_match('/^(Kota|Kabupaten)\s+/i', $normalized)) {
            $variants[] = 'Kota ' . $normalized;
            $variants[] = 'Kabupaten ' . $normalized;
        }
        
        return array_values(array_unique($variants));
    }

    /**
     * Get district variants untuk query filtering
     */
    public static function getDistrictVariants(string $district): array
    {
        $normalized = self::normalizeDistrict($district);
        $variants = array_merge([$district, $normalized], self::variantsFor($district));
        
        // Tambahkan berbagai prefix
        if (!preg_match('/^(Kecamatan|Kelurahan|Desa)\s+/i', $normalized)) {
            $variants[] = 'Kecamatan ' . $normalized;
            $variants[] = 'Kelurahan ' . $normalized;
        }
        
        return array_values(array_unique($variants));
    }
    
    /**
     * Debug method: Test matching between two strings and return detailed info
     * 
     * @param string $string1 First string to compare
     * @param string $string2 Second string to compare
     * @return array Detailed matching information
     */
    public static function debugMatch(string $string1, string $string2): array
    {
        $variants1 = self::variantsFor($string1);
        $variants2 = self::variantsFor($string2);
        
        $score = self::compositeDistrictScore($string1, $string2);
        
        // Find best matching variants
        $bestVariants = ['from' => '', 'to' => '', 'score' => 0];
        foreach ($variants1 as $v1) {
            foreach ($variants2 as $v2) {
                if ($v1 === $v2) {
                    $bestVariants = ['from' => $v1, 'to' => $v2, 'score' => 1.0];
                    break 2;
                }
                $tempScore = self::similarity($v1, $v2);
                if ($tempScore > $bestVariants['score']) {
                    $bestVariants = ['from' => $v1, 'to' => $v2, 'score' => $tempScore];
                }
            }
        }
        
        return [
            'input' => [
                'string1' => $string1,
                'string2' => $string2,
            ],
            'normalized' => [
                'string1' => self::normalizeForCompare($string1),
                'string2' => self::normalizeForCompare($string2),
            ],
            'variants' => [
                'string1' => $variants1,
                'string2' => $variants2,
            ],
            'best_match' => $bestVariants,
            'composite_score' => round($score, 4),
            'will_match' => $score >= 0.82,
            'metrics' => [
                'similarity' => round(self::similarity($string1, $string2), 4),
                'jaccard' => round(self::tokenJaccard($string1, $string2), 4),
                'levenshtein' => round(self::levenshteinRatio($string1, $string2), 4),
            ]
        ];
    }
    
    /**
     * Batch test matching from array of pairs
     * 
     * @param array $pairs Array of [string1, string2] pairs
     * @return array Results for each pair
     */
    public static function batchDebugMatch(array $pairs): array
    {
        $results = [];
        
        foreach ($pairs as $index => $pair) {
            if (!is_array($pair) || count($pair) < 2) {
                $results[$index] = ['error' => 'Invalid pair format'];
                continue;
            }
            
            [$string1, $string2] = $pair;
            $results[$index] = self::debugMatch($string1, $string2);
        }
        
        return $results;
    }
}
