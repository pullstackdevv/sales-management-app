<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BannerController extends Controller
{
    public function index()
    {
        $banners = Banner::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
        $data = $banners->map(function ($b) {
            return [
                'id' => $b->id,
                'image_url' => asset('storage/' . $b->image_path),
            ];
        });
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'banners' => 'required|array',
            'banners.*' => 'file|mimes:jpg,jpeg,png,webp|max:4096|dimensions:width=800,height=200',
        ]);

        $created = [];
        $startOrder = (int) Banner::max('sort_order');
        $order = $startOrder >= 0 ? $startOrder + 1 : 0;
        foreach ($request->file('banners') as $file) {
            $path = $file->store('settings', 'public');
            $created[] = Banner::create(['image_path' => $path, 'is_active' => true, 'sort_order' => $order]);
            $order++;
        }

        return response()->json(['success' => true, 'data' => $created]);
    }

    public function destroy(Banner $banner)
    {
        if ($banner->image_path) {
            Storage::disk('public')->delete($banner->image_path);
        }
        $banner->delete();
        return response()->json(['success' => true]);
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:banners,id',
        ]);

        $ids = $validated['ids'];
        \DB::transaction(function () use ($ids) {
            foreach ($ids as $index => $id) {
                Banner::where('id', $id)->update(['sort_order' => $index]);
            }
        });

        return response()->json(['success' => true]);
    }
}
