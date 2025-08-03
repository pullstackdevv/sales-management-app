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
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($query, $role) {
                $query->where('role', $role);
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
            'role' => 'required|in:owner,admin,staff,warehouse',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $user = User::create([
                ...$validated,
                'password' => Hash::make($validated['password']),
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'User created successfully',
                'data' => $user
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
            'role' => 'sometimes|required|in:owner,admin,staff,warehouse',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $user->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'User updated successfully',
                'data' => $user->fresh()
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
            'password' => 'required|string|min:8|confirmed'
        ]);

        try {
            DB::beginTransaction();

            $user->update([
                'password' => Hash::make($validated['password']),
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
}