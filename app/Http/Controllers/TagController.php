<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TagController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tags = Tag::query()
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->when($request->is_active !== null, function ($q) use ($request) {
                $q->where('is_active', (bool)$request->is_active);
            })
            ->orderBy('name', 'asc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'status' => 'success',
            'data' => $tags,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!Auth::check() || !Auth::user()->hasPermission('products.edit')) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150|unique:tags,name',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $tag = Tag::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => Auth::id(),
        ]);

        return response()->json(['status' => 'success', 'data' => $tag], 201);
    }

    public function show(Tag $tag): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => $tag]);
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        if (!Auth::check() || !Auth::user()->hasPermission('products.edit')) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150|unique:tags,name,' . $tag->id,
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $tag->update([
            'name' => $validated['name'] ?? $tag->name,
            'description' => $validated['description'] ?? $tag->description,
            'is_active' => $validated['is_active'] ?? $tag->is_active,
        ]);

        return response()->json(['status' => 'success', 'data' => $tag]);
    }

    public function destroy(Tag $tag): JsonResponse
    {
        if (!Auth::check() || !Auth::user()->hasPermission('products.delete')) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $tag->delete();
        return response()->json(['status' => 'success', 'message' => 'Tag deleted']);
    }
}
