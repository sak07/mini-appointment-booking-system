<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/register — create a customer account and return a token
    public function register(Request $request)
    {
        // If validation fails, Laravel automatically returns 422 with the field errors.
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'required|string|min:8|confirmed', // must match "password_confirmation"
        ]);

        // Role is forced to customer — nobody can register themselves as admin.
        $user = User::create([...$data, 'role' => 'customer']);

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user,
            'token' => $user->createToken('api')->plainTextToken,
        ], 201);
    }

    // POST /api/login — check email + password, return a token
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        // Same message whether the email or the password is wrong (doesn't reveal which emails exist).
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'The email or password is incorrect.',
            ]);
        }

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $user->createToken('api')->plainTextToken,
        ]);
    }

    // GET /api/me — the logged-in user
    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    // POST /api/logout — delete the token used for this request, so it stops working
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
