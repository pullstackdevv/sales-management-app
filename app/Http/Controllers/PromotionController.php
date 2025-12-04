<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Check permission
        if (!auth()->user()->hasPermission('promotions.view')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        $promotions = Promotion::with(['creator'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'active') {
                    $query->active();
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->when($request->storefront, function ($query, $storefront) {
                if ($storefront === 'yes') {
                    $query->storefront();
                } elseif ($storefront === 'no') {
                    $query->where('is_storefront', false);
                }
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->orderBy('sort_order')->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $promotions
        ]);
    }

    public function data(): Response
    {
        return Inertia::render('Promotion/PromotionData');
    }

    public function create(): Response
    {
        return Inertia::render('Promotion/PromotionAdd');
    }

    public function store(Request $request): JsonResponse
    {
        // Check permission
        if (!auth()->user()->hasPermission('promotions.create')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_storefront' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        try {
            DB::beginTransaction();

            $promotion = Promotion::create([
                ...$validated,
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Promosi berhasil dibuat',
                'data' => $promotion->load('creator')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Promotion $promotion): JsonResponse
    {
        // Check permission
        if (!auth()->user()->hasPermission('promotions.view')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $promotion->load(['creator'])
        ]);
    }

    public function edit(Promotion $promotion): Response
    {
        return Inertia::render('Promotion/PromotionEdit', [
            'promotion' => $promotion->load('creator')
        ]);
    }

    public function update(Request $request, Promotion $promotion): JsonResponse
    {
        // Check permission
        if (!auth()->user()->hasPermission('promotions.edit')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_storefront' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        try {
            DB::beginTransaction();

            $promotion->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Promosi berhasil diupdate',
                'data' => $promotion->fresh()->load('creator')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Promotion $promotion): JsonResponse
    {
        // Check permission
        if (!auth()->user()->hasPermission('promotions.delete')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            DB::beginTransaction();

            $promotion->update(['deleted_by' => Auth::id()]);
            $promotion->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Promosi berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleStatus(Promotion $promotion): JsonResponse
    {
        // Check permission
        if (!auth()->user()->hasPermission('promotions.toggle_status')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            DB::beginTransaction();

            $promotion->update([
                'is_active' => !$promotion->is_active,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Status promosi berhasil diupdate',
                'data' => $promotion->fresh()->load('creator')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleStorefront(Promotion $promotion): JsonResponse
    {
        // Check permission
        if (!auth()->user()->hasPermission('promotions.toggle_storefront')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            DB::beginTransaction();

            $promotion->update([
                'is_storefront' => !$promotion->is_storefront,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Status storefront berhasil diupdate',
                'data' => $promotion->fresh()->load('creator')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getActivePromotions(): JsonResponse
    {
        $promotions = Promotion::currentlyActive()
            ->storefront()
            ->select('id', 'title', 'description', 'start_date', 'end_date')
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $promotions
        ]);
    }

    public function reorder(Request $request): JsonResponse
    {
        if (!auth()->user()->hasPermission('promotions.edit')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:promotions,id',
        ]);

        $ids = $validated['ids'];

        DB::transaction(function () use ($ids) {
            foreach ($ids as $index => $id) {
                Promotion::where('id', $id)->update(['sort_order' => $index]);
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Urutan promosi berhasil diperbarui'
        ]);
    }
}
