<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $roles = Role::withCount('users')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $roles
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:255',
            'permissions' => 'required|array',
            'permissions.*' => 'required|string|exists:permissions,name',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $role = Role::create([
                ...$validated,
                'created_by' => Auth::id()
            ]);

            $role->syncPermissions($validated['permissions']);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Role created successfully',
                'data' => $role->load(['permissions', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $role->load(['permissions', 'users' => function ($query) {
                $query->withCount(['orders', 'verifiedPayments', 'stockMovements', 'stockOpnames'])
                    ->latest();
            }])
        ]);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        if ($role->is_system && $request->name !== $role->name) {
            throw ValidationException::withMessages([
                'name' => ['Cannot rename system role.']
            ]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:roles,name,' . $role->id,
            'description' => 'nullable|string|max:255',
            'permissions' => 'sometimes|required|array',
            'permissions.*' => 'required|string|exists:permissions,name',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $role->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Role updated successfully',
                'data' => $role->fresh()->load(['permissions', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->is_system) {
            throw ValidationException::withMessages([
                'role' => ['Cannot delete system role.']
            ]);
        }

        if ($role->users()->exists()) {
            throw ValidationException::withMessages([
                'role' => ['Cannot delete role that has users assigned.']
            ]);
        }

        try {
            DB::beginTransaction();

            $role->update(['deleted_by' => Auth::id()]);
            $role->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Role deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleStatus(Role $role): JsonResponse
    {
        if ($role->is_system) {
            throw ValidationException::withMessages([
                'role' => ['Cannot change status of system role.']
            ]);
        }

        try {
            DB::beginTransaction();

            $role->update([
                'is_active' => !$role->is_active,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Role status updated successfully',
                'data' => $role->fresh()->load(['permissions', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
} 