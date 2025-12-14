<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Modules\System\Services\AuditLogService;

class AuditLogController extends Controller
{
    protected AuditLogService $auditLogService;

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Display a paginated list of audit logs with filtering.
     * GET /api/audit-logs
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'action' => ['nullable', 'string', 'in:login,logout,create,update,delete'],
            'resource' => ['nullable', 'string'],
            'resource_id' => ['nullable', 'integer'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_direction' => ['nullable', 'string', 'in:asc,desc'],
        ]);

        $filters = $request->only([
            'user_id',
            'action',
            'resource',
            'resource_id',
            'start_date',
            'end_date',
            'sort_direction',
        ]);

        $perPage = $request->input('per_page', 15);

        $logs = $this->auditLogService->getLogs($filters, $perPage);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}
