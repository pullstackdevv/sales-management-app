<?php

namespace App\Http\Controllers;

use App\Helpers\ResponseFormatter;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    public function login(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            [
                'email' => ['required', 'email'],
                'password' => ['required'],
            ],
        );

        if ($validator->fails()) {
            return ResponseFormatter::fail(
                message: "Validation failed",
                errors: $validator->errors(),
            );
        }

        try {
            $credentials = $request->only('email', 'password');
    
            if (!Auth::attempt($credentials)) {
                return ResponseFormatter::fail('Wrong email or password');
            }

            $user = Auth::user();
            $token = $user->createToken('auth_token')->plainTextToken;

        } catch (\Throwable $th) {
            return ResponseFormatter::error(
                message: "Something wrong",
                errors: $th,
            );
        }

        return ResponseFormatter::success(
            message: "Successfully logged in",
            data: [
                'user' => $user,
                'token' => $token,
            ],
        );
    }

    /**
     * Handle user registration.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'min:6', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return ResponseFormatter::fail(
                "Invalid validation",
                $validator->errors(),
            );
        }

        DB::beginTransaction();

        try {
            $validated = $validator->validate();

            $name = $validated['name'];
            $email = $validated['email'];
            $password = $validated['password'];

            $user = User::create([
                'name'     => $name,
                'email'    => $email,
                'password' => Hash::make($password),
            ]);

            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();

            return ResponseFormatter::error("Something wrong", $th);
        }
        
        $token = $user->createToken('auth_token')->plainTextToken;

        return ResponseFormatter::success(
            message: "User successfully registered",
            data: [
                'user' => $user,
                'token' => $token,
            ],
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return ResponseFormatter::success(
                message: "Successfully logged out"
            );
        } catch (\Throwable $th) {
            return ResponseFormatter::error(
                message: "Something wrong",
                errors: $th,
            );
        }
    }

    /**
     * Get authenticated user.
     */
    public function me(Request $request)
    {
        try {
            return ResponseFormatter::success(
                message: "User data retrieved successfully",
                data: $request->user()
            );
        } catch (\Throwable $th) {
            return ResponseFormatter::error(
                message: "Something wrong",
                errors: $th,
            );
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
