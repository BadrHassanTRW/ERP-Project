<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Modules\System\Http\Requests\RoleRequest;
use Modules\System\Services\RoleService;
use Modules\System\Services\PermissionService;

class RoleController extends Controller
{
    protected RoleService $roleService;
    protected PermissionService $permissionService;

    public function __construct(RoleService $roleService, PermissionService $permissionService)
    {
        $this->roleService = $roleService;
        $this->permissionService = $permissionService;
    }

    /**
     * Display a list of all roles.
     * GET /api/roles
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $roles = $this->roleService->getAllRoles();

        return response()->json([
            'success' => true,
            'data' => [
                'roles' => $roles,
            ],
        ]);
    }

    /**
     * Store a newly created role.
     * POST /api/roles
     *
     * @param RoleRequest $request
     * @return JsonResponse
     */
    public function store(RoleRequest $request): JsonResponse
    {
        try {
            $role = $this->roleService->createRole($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Role created successfully.',
                'data' => [
                    'role' => $role,
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
     * Display the specified role.
     * GET /api/roles/{role}
     *
     * @param int $role
     * @return JsonResponse
     */
    public function show(int $role): JsonResponse
    {
        try {
            $roleData = $this->roleService->getRole($role);

            return response()->json([
                'success' => true,
                'data' => [
                    'role' => $roleData,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found.',
                'error_code' => 'NOT_FOUND',
            ], 404);
        }
    }

    /**
     * Update the specified role.
     * PUT /api/roles/{role}
     *
     * @param RoleRequest $request
     * @param int $role
     * @return JsonResponse
     */
    public function update(RoleRequest $request, int $role): JsonResponse
    {
        try {
            $roleData = $this->roleService->updateRole($role, $request->validated());

            // Clear permission cache for all users with this role
            $this->permissionService->clearRoleUsersPermissionsCache($role);

            return response()->json([
                'success' => true,
                'message' => 'Role updated successfully.',
                'data' => [
                    'role' => $roleData,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found.',
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
     * Remove the specified role.
     * DELETE /api/roles/{role}
     *
     * @param int $role
     * @return JsonResponse
     */
    public function destroy(int $role): JsonResponse
    {
        try {
            $this->roleService->deleteRole($role);

            return response()->json([
                'success' => true,
                'message' => 'Role deleted successfully.',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found.',
                'error_code' => 'NOT_FOUND',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->errors()['role'][0] ?? 'Cannot delete role.',
                'error_code' => 'VALIDATION_ERROR',
            ], 422);
        }
    }

    /**
     * Assign permissions to a role.
     * POST /api/roles/{role}/permissions
     *
     * @param Request $request
     * @param string|int $role
     * @return JsonResponse
     */
    public function assignPermissions(Request $request, string|int $role): JsonResponse
    {
        // Accept both 'permissions' and 'permission_ids' for flexibility
        $permissionIds = $request->input('permissions') ?? $request->input('permission_ids') ?? [];
        
        $request->merge(['permission_ids' => $permissionIds]);
        
        $request->validate([
            'permission_ids' => ['required', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        try {
            $roleData = $this->roleService->assignPermissions((int) $role, $permissionIds);

            // Clear permission cache for all users with this role
            $this->permissionService->clearRoleUsersPermissionsCache((int) $role);

            return response()->json([
                'success' => true,
                'message' => 'Permissions assigned successfully.',
                'data' => [
                    'role' => $roleData,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found.',
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
}
