<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Employee;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'password' => 'required',
        ]);

        $user = null;

        if ($request->filled('email')) {
            $request->validate(['email' => 'email']);
            $credentials = $request->only('email', 'password');
            if (!Auth::attempt($credentials)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }
            $user = User::where('email', $request->email)->first();
        } elseif ($request->filled('nip')) {
            $request->validate(['nip' => 'string']);
            $employee = Employee::where('nip', $request->nip)->first();
            if (!$employee || !$employee->user) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            $user = $employee->user;
            if (!Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }
        } else {
            return response()->json(['message' => 'Email or NIP is required'], 422);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'role' => $user->role ?? 'user',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}