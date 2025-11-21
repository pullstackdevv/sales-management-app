<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
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
            ->get();

        // Transform data for frontend
        $transformedRoles = $roles->map(function ($role) {
            return [
                'role' => $role->name,
                'description' => $role->description,
                'permissions' => $role->getPermissionNames(),
                'is_active' => $role->is_active,
                'is_system' => $role->is_system,
                'users_count' => $role->users_count
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $transformedRoles
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // Check permission
        if (!Auth::user()->hasPermission('roles.create')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to create roles.'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:255',
            'permissions' => 'required|array',
            'permissions.*' => 'required|string',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $role = Role::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Sync permissions
            $role->syncPermissions($validated['permissions']);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Role created successfully',
                'data' => [
                    'role' => $role->name,
                    'description' => $role->description,
                    'permissions' => $role->getPermissionNames(),
                    'is_active' => $role->is_active,
                    'is_system' => $role->is_system
                ]
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
            'data' => [
                'role' => $role->name,
                'description' => $role->description,
                'permissions' => $role->getPermissionNames(),
                'is_active' => $role->is_active,
                'is_system' => $role->is_system,
                'users_count' => $role->users()->count()
            ]
        ]);
    }

    public function update(Request $request, string $roleName): JsonResponse
    {
        // Check permission
        if (!Auth::user()->hasPermission('roles.edit')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to edit roles.'
            ], 403);
        }

        $role = Role::where('name', $roleName)->firstOrFail();

        $validated = $request->validate([
            'description' => 'nullable|string|max:255',
            'permissions' => 'required|array',
            'permissions.*' => 'required|string'
        ]);

        try {
            DB::beginTransaction();

            // Update role description
            $role->update([
                'description' => $validated['description'] ?? $role->description,
            ]);

            // Sync permissions
            $role->syncPermissions($validated['permissions']);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Role updated successfully',
                'data' => [
                    'role' => $role->name,
                    'description' => $role->description,
                    'permissions' => $role->getPermissionNames(),
                    'is_active' => $role->is_active,
                    'is_system' => $role->is_system
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }


    public function destroy(Role $role): JsonResponse
    {
        // Check permission
        if (!Auth::user()->hasPermission('roles.delete')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You do not have permission to delete roles.'
            ], 403);
        }

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
                'is_active' => !$role->is_active
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Role status updated successfully',
                'data' => [
                    'role' => $role->name,
                    'description' => $role->description,
                    'permissions' => $role->getPermissionNames(),
                    'is_active' => $role->is_active,
                    'is_system' => $role->is_system
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getPermissions(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => Role::getAllPermissions()
        ]);
    }

    public function getAllPermissions(): JsonResponse
    {
        $permissions = Permission::orderBy('module')->orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => $permissions
        ]);
    }
}
