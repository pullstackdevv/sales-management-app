<?php

namespace App\Http\Controllers;

use App\Models\LoyaltySetting;
use App\Models\LoyaltyTier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LoyaltyController extends Controller
{
    public function settingsPage()
    {
        return Inertia::render('Loyalty/LoyaltySettings');
    }

    public function tierPage()
    {
        return Inertia::render('Loyalty/LoyaltyTiers');
    }

    public function getSettings()
    {
        $settings = LoyaltySetting::all()->keyBy('key');
        
        return response()->json([
            'settings' => [
                'point_rate' => [
                    'value' => $settings->get('point_rate')?->value ?? '10000',
                    'description' => 'Berapa rupiah untuk mendapatkan 1 poin',
                    'is_active' => $settings->get('point_rate')?->is_active ?? true,
                ],
                'min_redeem_amount' => [
                    'value' => $settings->get('min_redeem_amount')?->value ?? '50000',
                    'description' => 'Minimal nilai rupiah yang bisa di-redeem',
                    'is_active' => $settings->get('min_redeem_amount')?->is_active ?? true,
                ],
                'max_redeem_percentage' => [
                    'value' => $settings->get('max_redeem_percentage')?->value ?? '20',
                    'description' => 'Maksimal persentase redeem dari total transaksi',
                    'is_active' => $settings->get('max_redeem_percentage')?->is_active ?? true,
                ],
                'redeem_options' => [
                    'value' => $settings->get('redeem_options')?->value ?? '50000,100000,200000',
                    'description' => 'Pilihan nilai rupiah untuk redeem (pisahkan dengan koma)',
                    'is_active' => $settings->get('redeem_options')?->is_active ?? true,
                ],
                'loyalty_active' => [
                    'value' => $settings->get('loyalty_active')?->value ?? '1',
                    'description' => 'Status aktif sistem loyalty',
                    'is_active' => $settings->get('loyalty_active')?->is_active ?? true,
                ],
            ],
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.value' => 'required|string',
            'settings.*.is_active' => 'boolean',
        ]);

        $userId = auth()->id();

        foreach ($validated['settings'] as $key => $data) {
            LoyaltySetting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $data['value'],
                    'is_active' => $data['is_active'] ?? true,
                    'updated_by' => $userId,
                ]
            );
        }

        return response()->json([
            'message' => 'Pengaturan loyalty berhasil disimpan',
        ]);
    }

    public function getTiers(Request $request)
    {
        $query = LoyaltyTier::query();

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
        }

        $tiers = $query->ordered()
            ->withCount('customerPoints')
            ->get();

        return response()->json([
            'tiers' => $tiers,
        ]);
    }

    public function storeTier(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'min_annual_spend' => 'required|numeric|min:0',
            'max_annual_spend' => 'nullable|numeric|min:0',
            'multiplier' => 'required|numeric|min:0.1|max:10',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:100',
            'benefits' => 'nullable|string',
            'order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();

        if (LoyaltyTier::where('slug', $validated['slug'])->exists()) {
            return response()->json([
                'message' => 'Tier dengan nama tersebut sudah ada',
            ], 422);
        }

        $tier = LoyaltyTier::create($validated);

        return response()->json([
            'message' => 'Tier berhasil ditambahkan',
            'tier' => $tier,
        ], 201);
    }

    public function showTier(LoyaltyTier $tier)
    {
        $tier->loadCount('customerPoints');
        
        return response()->json([
            'tier' => $tier,
        ]);
    }

    public function updateTier(Request $request, LoyaltyTier $tier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'min_annual_spend' => 'required|numeric|min:0',
            'max_annual_spend' => 'nullable|numeric|min:0',
            'multiplier' => 'required|numeric|min:0.1|max:10',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:100',
            'benefits' => 'nullable|string',
            'order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $newSlug = Str::slug($validated['name']);
        
        if ($newSlug !== $tier->slug && LoyaltyTier::where('slug', $newSlug)->exists()) {
            return response()->json([
                'message' => 'Tier dengan nama tersebut sudah ada',
            ], 422);
        }

        $validated['slug'] = $newSlug;
        $validated['updated_by'] = auth()->id();

        $tier->update($validated);

        return response()->json([
            'message' => 'Tier berhasil diperbarui',
            'tier' => $tier,
        ]);
    }

    public function destroyTier(LoyaltyTier $tier)
    {
        return response()->json([
            'message' => 'Tier tidak dapat dihapus. Gunakan toggle status untuk menonaktifkan tier.',
        ], 422);
    }

    public function toggleTierStatus(LoyaltyTier $tier)
    {
        $tier->update([
            'is_active' => !$tier->is_active,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Status tier berhasil diubah',
            'tier' => $tier,
        ]);
    }

    public function getActiveTiers()
    {
        $tiers = LoyaltyTier::active()->ordered()->get();

        return response()->json([
            'tiers' => $tiers,
        ]);
    }
}
