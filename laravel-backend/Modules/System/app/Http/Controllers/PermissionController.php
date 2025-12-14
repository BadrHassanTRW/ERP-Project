<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Modules\System\Services\PermissionService;

class PermissionController extends Controller
{
    protected PermissionService $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * Display a list of all permissions.
     * GET /api/permissions
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $permissions = $this->permissionService->getAllPermissions();

        return response()->json([
            'success' => true,
            'data' => [
                'permissions' => $permissions,
            ],
        ]);
    }

    /**
     * Display permissions grouped by module.
     * GET /api/permissions/grouped
     *
     * @return JsonResponse
     */
    public function grouped(): JsonResponse
    {
        $permissions = $this->permissionService->getPermissionsGroupedByModule();

        return response()->json([
            'success' => true,
            'data' => [
                'permissions' => $permissions,
            ],
        ]);
    }
}
