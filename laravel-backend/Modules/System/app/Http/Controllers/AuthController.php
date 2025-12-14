<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\System\Http\Requests\ForgotPasswordRequest;
use Modules\System\Http\Requests\LoginRequest;
use Modules\System\Http\Requests\RegisterRequest;
use Modules\System\Http\Requests\ResetPasswordRequest;
use Modules\System\Services\AuthService;

class AuthController extends SystemController
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Register a new user.
     * POST /api/auth/register
     *
     * @param RegisterRequest $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $user = $this->authService->register($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Registration successful. Please check your email to verify your account.',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
                'error_code' => 'VALIDATION_ERROR',
            ], 422);
        }
    }


    /**
     * Login user and return token.
     * POST /api/auth/login
     *
     * @param LoginRequest $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login(
                $request->input('email'),
                $request->input('password')
            );

            // Get user permissions through roles
            $permissions = $result['user']->getAllPermissions()->pluck('name')->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => [
                        'id' => $result['user']->id,
                        'name' => $result['user']->name,
                        'email' => $result['user']->email,
                        'email_verified_at' => $result['user']->email_verified_at,
                        'avatar' => $result['user']->avatar,
                        'is_active' => $result['user']->is_active,
                        'roles' => $result['user']->roles->map(fn($role) => [
                            'id' => $role->id,
                            'name' => $role->name,
                        ]),
                    ],
                    'token' => $result['token'],
                    'permissions' => $permissions,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication failed',
                'errors' => $e->errors(),
                'error_code' => 'AUTHENTICATION_ERROR',
            ], 401);
        }
    }

    /**
     * Logout user and revoke token.
     * POST /api/auth/logout
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Verify user's email.
     * GET /api/auth/verify-email/{token}
     *
     * @param string $token
     * @return JsonResponse
     */
    public function verifyEmail(string $token): JsonResponse
    {
        $verified = $this->authService->verifyEmail($token);

        if ($verified) {
            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully. You can now login.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired verification token.',
            'error_code' => 'INVALID_TOKEN',
        ], 400);
    }

    /**
     * Send password reset link.
     * POST /api/auth/forgot-password
     *
     * @param ForgotPasswordRequest $request
     * @return JsonResponse
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->authService->sendPasswordResetLink($request->input('email'));

        // Always return success to not reveal if email exists
        return response()->json([
            'success' => true,
            'message' => 'If your email is registered, you will receive a password reset link.',
        ]);
    }

    /**
     * Reset user's password.
     * POST /api/auth/reset-password
     *
     * @param ResetPasswordRequest $request
     * @return JsonResponse
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $this->authService->resetPassword(
                $request->input('token'),
                $request->input('email'),
                $request->input('password')
            );

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully. You can now login with your new password.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Password reset failed',
                'errors' => $e->errors(),
                'error_code' => 'VALIDATION_ERROR',
            ], 400);
        }
    }
}
