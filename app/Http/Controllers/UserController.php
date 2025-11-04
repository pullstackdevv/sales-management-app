<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->with('role')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->role_id, function ($query, $roleId) {
                $query->where('role_id', $roleId);
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|string',
            'is_active' => 'boolean',

        ]);

        try {
            DB::beginTransaction();

            // Convert role name to role_id
            $role = Role::where('name', $validated['role_id'])->first();
            if (!$role) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Role not found'
                ], 400);
            }

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role_id' => $role->id,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'User created successfully',
                'data' => $user->load('role')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $user->load([
                'role',
                'orders' => function ($query) {
                    $query->with(['items', 'payments', 'shipping'])
                        ->latest();
                }
            ])
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|required|string|min:8|confirmed',
            'role_id' => 'sometimes|required|string',
            'is_active' => 'boolean',

        ]);

        try {
            DB::beginTransaction();

            $updateData = [];
            
            if (isset($validated['name'])) {
                $updateData['name'] = $validated['name'];
            }
            
            if (isset($validated['email'])) {
                $updateData['email'] = $validated['email'];
            }
            
            if (isset($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }
            
            if (isset($validated['role_id'])) {
                // Convert role name to role_id
                $role = Role::where('name', $validated['role_id'])->first();
                if (!$role) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Role not found'
                    ], 400);
                }
                $updateData['role_id'] = $role->id;
            }
            
            if (isset($validated['is_active'])) {
                $updateData['is_active'] = $validated['is_active'];
            }
            
            $updateData['updated_by'] = Auth::id();

            $user->update($updateData);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'User updated successfully',
                'data' => $user->fresh('role')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages([
                'user' => ['Cannot delete your own account.']
            ]);
        }

        if ($user->orders()->exists()) {
            throw ValidationException::withMessages([
                'user' => ['Cannot delete user that has orders.']
            ]);
        }

        if ($user->verifiedPayments()->exists()) {
            throw ValidationException::withMessages([
                'user' => ['Cannot delete user that has verified payments.']
            ]);
        }

        if ($user->stockMovements()->exists()) {
            throw ValidationException::withMessages([
                'user' => ['Cannot delete user that has stock movements.']
            ]);
        }

        if ($user->stockOpnames()->exists()) {
            throw ValidationException::withMessages([
                'user' => ['Cannot delete user that has stock opnames.']
            ]);
        }

        try {
            DB::beginTransaction();

            $user->update(['deleted_by' => Auth::id()]);
            $user->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function toggleStatus(User $user): JsonResponse
    {
        try {
            DB::beginTransaction();

            $user->update([
                'is_active' => !$user->is_active,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'User status updated successfully',
                'data' => $user->fresh()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function changePassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed'
        ]);

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Current password is incorrect'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $user->update([
                'password' => Hash::make($validated['new_password']),
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Password changed successfully',
                'data' => $user->fresh()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Change password for current authenticated user (Web/Inertia)
     */
    public function changePasswordWeb(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed'
        ]);

        $user = Auth::user();

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return back()->withErrors([
                'current_password' => 'Password saat ini tidak benar'
            ]);
        }

        try {
            DB::beginTransaction();

            $user->update([
                'password' => Hash::make($validated['new_password']),
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return back()->with('success', 'Password berhasil diubah');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors([
                'new_password' => 'Terjadi kesalahan saat mengubah password'
            ]);
        }
    }



    public function getRolePermissions(): JsonResponse
    {
        $roles = Role::where('is_active', true)->get();
        
        $rolePermissions = [];
        foreach ($roles as $role) {
            $rolePermissions[$role->name] = [
                'description' => $role->description,
                'permissions' => $role->permissions ?? []
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $rolePermissions
        ]);
    }
}