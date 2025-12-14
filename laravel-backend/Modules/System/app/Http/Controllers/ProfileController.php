<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;
use Modules\System\Http\Requests\AvatarRequest;
use Modules\System\Http\Requests\PasswordRequest;
use Modules\System\Http\Requests\ProfileRequest;

class ProfileController extends Controller
{
    /**
     * Display the authenticated user's profile.
     * GET /api/profile
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'email_verified_at' => $user->email_verified_at,
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'roles' => $user->roles,
                ],
            ],
        ]);
    }


    /**
     * Update the authenticated user's profile.
     * PUT /api/profile
     *
     * @param ProfileRequest $request
     * @return JsonResponse
     */
    public function update(ProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        // Check if email is being changed
        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;

        if ($emailChanged) {
            // Store the new email for verification
            // The actual email change will happen after verification
            DB::table('email_verification_tokens')->updateOrInsert(
                ['email' => $data['email']],
                [
                    'token' => hash('sha256', Str::random(64)),
                    'created_at' => now(),
                ]
            );

            // Remove email from update data - it will be updated after verification
            unset($data['email']);

            // Update other fields
            if (!empty($data)) {
                $user->update($data);
            }

            return response()->json([
                'success' => true,
                'message' => 'Profile updated. Please verify your new email address.',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'avatar' => $user->avatar,
                        'email_verified_at' => $user->email_verified_at,
                        'is_active' => $user->is_active,
                    ],
                    'email_verification_required' => true,
                ],
            ]);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'email_verified_at' => $user->email_verified_at,
                    'is_active' => $user->is_active,
                ],
            ],
        ]);
    }

    /**
     * Update the authenticated user's password.
     * PUT /api/profile/password
     *
     * @param PasswordRequest $request
     * @return JsonResponse
     */
    public function updatePassword(PasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => [
                    'current_password' => ['The current password is incorrect.'],
                ],
                'error_code' => 'VALIDATION_ERROR',
            ], 422);
        }

        $user->password = Hash::make($request->input('password'));
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully.',
        ]);
    }

    /**
     * Update the authenticated user's avatar.
     * POST /api/profile/avatar
     *
     * @param AvatarRequest $request
     * @return JsonResponse
     */
    public function updateAvatar(AvatarRequest $request): JsonResponse
    {
        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');

        $user->avatar = $path;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Avatar updated successfully.',
            'data' => [
                'avatar' => $path,
                'avatar_url' => Storage::disk('public')->url($path),
            ],
        ]);
    }
}
