<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $fields = $request->validate([
            'user_type' => 'required|string',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'cin' => 'nullable|string|max:20',
            'cin_images_path' => 'nullable|array',
            'cin_images_path.*' => 'string'
        ]);
        $user = User::create($fields);

        switch ($fields['user_type']) {
            case 'agency manager':
                $user->assignRole('agency manager');
                break;
            case 'client':
                $user->assignRole('client');
                break;
        }

        $token = $user->createToken($request->name);

        return [
            'user' => $user->with('roles')->get(),
            'token' => $token->plainTextToken,
            'role' => $fields['user_type']

        ];
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return [
                'errors' => [
                    'email' => ['The provided credentials are incorrect.']
                ]
            ];
        }

        $token = $user->createToken($user->name);

        return [
            'user' => $user,
            'token' => $token->plainTextToken,
            'role' => $user->getRoleNames()[0]
        ];
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return [
            'message' => 'You are logged out.'
        ];
    }


    public function user(Request $request)
    {
        $user = $request->user()->load(['roles', 'agency', 'comments', 'reservations']);
        if ($user->agency != null && !Str::startsWith($user->agency->logo_path, 'https')) {
            $user->agency->logo_path = Storage::url($user->agency->logo_path);
        }
        return $user;
    }

    public function updatePassword(Request $request, $userId)
    {
        $user = $request->user();

        // Verify the requested user matches authenticated user
        if ($user->id != $userId) {
            return response()->json([
                'message' => 'Unauthorized action'
            ], 403);
        }

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }
}
