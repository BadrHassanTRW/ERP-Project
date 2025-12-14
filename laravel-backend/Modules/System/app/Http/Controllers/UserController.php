<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Modules\System\Http\Requests\UserRequest;
use Modules\System\Services\UserService;

class UserController extends Controller
{
    protected UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Display a paginated list of users.
     * GET /api/users
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['name', 'email', 'is_active', 'role_id', 'sort_by', 'sort_direction']);
        $perPage = $request->input('per_page', 15);

        $users = $this->userService->getAllUsers($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Store a newly created user.
     * POST /api/users
     *
     * @param UserRequest $request
     * @return JsonResponse
     */
    public function store(UserRequest $request): JsonResponse
    {
        try {
            $user = $this->userService->createUser($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'User created successfully.',
                'data' => [
                    'user' => $user,
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
     * Display the specified user.
     * GET /api/users/{user}
     *
     * @param int $user
     * @return JsonResponse
     */
    public function show(int $user): JsonResponse
    {
        try {
            $userData = $this->userService->getUser($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $userData,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }
    }

    /**
     * Update the specified user.
     * PUT /api/users/{user}
     *
     * @param UserRequest $request
     * @param int $user
     * @return JsonResponse
     */
    public function update(UserRequest $request, int $user): JsonResponse
    {
        try {
            $userData = $this->userService->updateUser($user, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully.',
                'data' => [
                    'user' => $userData,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
                'error_code' => 'NOT_FOUND',
            ], 404);
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
     * Remove the specified user (soft delete).
     * DELETE /api/users/{user}
     *
     * @param int $user
     * @return JsonResponse
     */
    public function destroy(int $user): JsonResponse
    {
        try {
            $this->userService->deleteUser($user);

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully.',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }
    }

    /**
     * Assign roles to a user.
     * POST /api/users/{user}/roles
     *
     * @param Request $request
     * @param int $user
     * @return JsonResponse
     */
    public function assignRoles(Request $request, int $user): JsonResponse
    {
        $request->validate([
            'role_ids' => ['required', 'array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ]);

        try {
            $userData = $this->userService->assignRoles($user, $request->input('role_ids'));

            return response()->json([
                'success' => true,
                'message' => 'Roles assigned successfully.',
                'data' => [
                    'user' => $userData,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }
    }
}
