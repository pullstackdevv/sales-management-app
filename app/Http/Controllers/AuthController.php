<?php

namespace App\Http\Controllers;

use App\Helpers\ResponseFormatter;
// use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        } catch (\Throwable $th) {
            return ResponseFormatter::error(
                message: "Something wrong",
                errors: $th,
            );
        }


        return ResponseFormatter::success(
            message: "Successfully logged in",
            data: Auth::user(),
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
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
