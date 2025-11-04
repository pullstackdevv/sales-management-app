<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Wilayah;

class WilayahController extends Controller
{
    /**
     * Get all provinces
     */
    public function getProvinces(): JsonResponse
    {
        try {
            $provinces = Wilayah::provinsi()
                ->orderBy('nama')
                ->get()
                ->map(function ($province) {
                    return [
                        'code' => $province->kode,
                        'name' => $province->nama
                    ];
                });
            
            return response()->json([
                'data' => $provinces
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching provinces: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get regencies by province code
     */
    public function getRegencies($provinceCode): JsonResponse
    {
        try {
            $regencies = Wilayah::kabupatenKota($provinceCode)
                ->orderBy('nama')
                ->get()
                ->map(function ($regency) {
                    return [
                        'code' => $regency->kode,
                        'name' => $regency->nama
                    ];
                });
            
            return response()->json([
                'data' => $regencies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching regencies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all regencies from all provinces
     */
    public function getAllRegencies(): JsonResponse
    {
        try {
            $allRegencies = Wilayah::kabupatenKota()
                ->orderBy('nama')
                ->get()
                ->map(function ($regency) {
                    $provinceCode = explode('.', $regency->kode)[0];
                    $province = Wilayah::where('kode', $provinceCode)->first();
                    
                    return [
                        'code' => $regency->kode,
                        'name' => $regency->nama,
                        'province_name' => $province ? $province->nama : '',
                        'province_code' => $provinceCode
                    ];
                });
            
            return response()->json([
                'status' => 'success',
                'data' => $allRegencies
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching all regencies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search regencies and districts by name
     */
    public function searchRegencies(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([
                'status' => 'success',
                'data' => []
            ]);
        }
        
        try {
            $results = collect();
            
            // Search districts first (kecamatan)
            $districts = Wilayah::kecamatan()
                ->where('nama', 'LIKE', '%' . $query . '%')
                ->orderBy('nama')
                ->limit(15)
                ->get()
                ->map(function ($district) {
                    // Get regency code from district code (first 5 characters: xx.xx)
                    $regencyCode = substr($district->kode, 0, 5);
                    $regency = Wilayah::where('kode', $regencyCode)->first();
                    
                    // Get province code from regency code (first 2 characters: xx)
                    $provinceCode = explode('.', $regencyCode)[0];
                    $province = Wilayah::where('kode', $provinceCode)->first();
                    
                    return [
                        'code' => $district->kode,
                        'name' => $district->nama,
                        'type' => 'Kecamatan',
                        'district_name' => $district->nama,
                        'regency_name' => $regency ? $regency->nama : '',
                        'regency_code' => $regencyCode,
                        'province_name' => $province ? $province->nama : '',
                        'province_code' => $provinceCode
                    ];
                });
            
            $results = $results->merge($districts);
            
            // Search regencies (kabupaten/kota) if not enough results
            if ($results->count() < 10) {
                $regencies = Wilayah::kabupatenKota()
                    ->where('nama', 'LIKE', '%' . $query . '%')
                    ->orderBy('nama')
                    ->limit(10 - $results->count())
                    ->get()
                    ->map(function ($regency) {
                        $provinceCode = explode('.', $regency->kode)[0];
                        $province = Wilayah::where('kode', $provinceCode)->first();
                        
                        return [
                            'code' => $regency->kode,
                            'name' => $regency->nama,
                            'type' => 'Kabupaten/Kota',
                            'district_name' => '',
                            'regency_name' => $regency->nama,
                            'regency_code' => $regency->kode,
                            'province_name' => $province ? $province->nama : '',
                            'province_code' => $provinceCode
                        ];
                    });
                
                $results = $results->merge($regencies);
            }
            
            return response()->json([
                'status' => 'success',
                'data' => $results->take(15)->values()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error searching regencies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get districts by regency code
     */
    public function getDistricts($regencyCode): JsonResponse
    {
        try {
            $districts = Wilayah::kecamatan($regencyCode)
                ->orderBy('nama')
                ->get()
                ->map(function ($district) {
                    return [
                        'code' => $district->kode,
                        'name' => $district->nama
                    ];
                });
            
            return response()->json([
                'data' => $districts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching districts: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Get villages by district code
     */
    public function getVillages($districtCode): JsonResponse
    {
        try {
            $villages = Wilayah::kelurahan($districtCode)
                ->orderBy('nama')
                ->get()
                ->map(function ($village) {
                    return [
                        'code' => $village->kode,
                        'name' => $village->nama
                    ];
                });
            
            return response()->json([
                'data' => $villages
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching villages: ' . $e->getMessage()
            ], 500);
        }
    }
}