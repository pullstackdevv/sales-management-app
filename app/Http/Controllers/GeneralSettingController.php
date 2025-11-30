<?php

namespace App\Http\Controllers;

use App\Models\GeneralSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GeneralSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = GeneralSetting::orderBy('setting_name')->get();
        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    public function publicSettings(): JsonResponse
    {
        $keys = [
            'site_logo_path',
            'site_icon_path',
            'social_facebook_url',
            'social_instagram_url',
            'social_twitter_url',
            'social_youtube_url',
            'social_tiktok_url',
            'social_whatsapp_url',
        ];

        $settings = GeneralSetting::whereIn('setting_name', $keys)
            ->pluck('setting_value', 'setting_name');

        $fileUrl = function ($path) {
            return $path ? asset('storage/' . $path) : null;
        };

        $result = [
            'site_logo_url' => $fileUrl($settings['site_logo_path'] ?? null),
            'site_icon_url' => $fileUrl($settings['site_icon_path'] ?? null),
            'social_facebook_url' => $settings['social_facebook_url'] ?? null,
            'social_instagram_url' => $settings['social_instagram_url'] ?? null,
            'social_twitter_url' => $settings['social_twitter_url'] ?? null,
            'social_youtube_url' => $settings['social_youtube_url'] ?? null,
            'social_tiktok_url' => $settings['social_tiktok_url'] ?? null,
            'social_whatsapp_url' => $settings['social_whatsapp_url'] ?? null,
        ];

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $request->validate([
            'site_logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'site_icon' => 'nullable|file|mimes:jpg,jpeg,png,webp,ico,svg|max:1024',
            'social_facebook_url' => 'nullable|url',
            'social_instagram_url' => 'nullable|url',
            'social_twitter_url' => 'nullable|url',
            'social_youtube_url' => 'nullable|url',
            'social_tiktok_url' => 'nullable|url',
            'social_whatsapp_url' => 'nullable|url',
        ]);
        $fileFields = [
            'site_logo' => 'site_logo_path',
            'site_icon' => 'site_icon_path',
        ];

        foreach ($fileFields as $input => $settingName) {
            if ($request->hasFile($input)) {
                $file = $request->file($input);
                $ext = $file->getClientOriginalExtension();
                $filename = $settingName . '_' . Str::random(8) . '.' . $ext;
                $path = $file->storeAs('settings', $filename, 'public');

                $existing = GeneralSetting::where('setting_name', $settingName)->first();
                if ($existing && $existing->setting_value) {
                    Storage::disk('public')->delete($existing->setting_value);
                }

                GeneralSetting::updateOrCreate(
                    ['setting_name' => $settingName],
                    ['setting_value' => $path, 'is_active' => true]
                );
            }
        }

        // remove banner handling

        $textFields = [
            'social_facebook_url',
            'social_instagram_url',
            'social_twitter_url',
            'social_youtube_url',
            'social_tiktok_url',
            'social_whatsapp_url',
        ];

        foreach ($textFields as $field) {
            $value = $request->input($field);
            if ($value !== null) {
                GeneralSetting::updateOrCreate(
                    ['setting_name' => $field],
                    ['setting_value' => $value, 'is_active' => true]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'General settings updated'
        ]);
    }

    public function destroy(string $settingName): JsonResponse
    {
        $setting = GeneralSetting::where('setting_name', $settingName)->first();
        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found'
            ], 404);
        }

        $fileFields = ['site_logo_path', 'site_icon_path'];
        if (in_array($settingName, $fileFields) && $setting->setting_value) {
            Storage::disk('public')->delete($setting->setting_value);
        }

        $setting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Setting deleted'
        ]);
    }
}
