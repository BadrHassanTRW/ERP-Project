<?php

namespace Modules\System\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Modules\System\Models\AuditLog;

class AuditLogService
{
    /**
     * Create a new audit log entry.
     *
     * @param string $action The action performed (login, create, update, delete, etc.)
     * @param string $resource The resource type affected (users, roles, permissions, etc.)
     * @param int|null $resourceId The ID of the affected resource
     * @param array $data Additional data including old_values, new_values, ip_address, user_agent
     * @return AuditLog
     */
    public function log(
        string $action,
        string $resource,
        ?int $resourceId = null,
        array $data = []
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $data['user_id'] ?? auth()->id(),
            'action' => $action,
            'resource' => $resource,
            'resource_id' => $resourceId,
            'old_values' => $data['old_values'] ?? null,
            'new_values' => $data['new_values'] ?? null,
            'ip_address' => $data['ip_address'] ?? request()->ip(),
            'user_agent' => $data['user_agent'] ?? request()->userAgent(),
        ]);
    }

    /**
     * Get audit logs with filtering and pagination.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getLogs(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = AuditLog::with('user:id,name,email');

        // Filter by user
        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        // Filter by action
        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        // Filter by resource
        if (!empty($filters['resource'])) {
            $query->where('resource', $filters['resource']);
        }

        // Filter by resource_id
        if (!empty($filters['resource_id'])) {
            $query->where('resource_id', $filters['resource_id']);
        }

        // Filter by date range - start date
        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }

        // Filter by date range - end date
        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        // Sort by created_at descending (most recent first)
        $sortDirection = $filters['sort_direction'] ?? 'desc';
        $query->orderBy('created_at', $sortDirection);

        return $query->paginate($perPage);
    }

    /**
     * Log a login action.
     *
     * @param int $userId
     * @param Request|null $request
     * @return AuditLog
     */
    public function logLogin(int $userId, ?Request $request = null): AuditLog
    {
        return $this->log('login', 'auth', null, [
            'user_id' => $userId,
            'ip_address' => $request?->ip() ?? request()->ip(),
            'user_agent' => $request?->userAgent() ?? request()->userAgent(),
        ]);
    }

    /**
     * Log a logout action.
     *
     * @param int $userId
     * @param Request|null $request
     * @return AuditLog
     */
    public function logLogout(int $userId, ?Request $request = null): AuditLog
    {
        return $this->log('logout', 'auth', null, [
            'user_id' => $userId,
            'ip_address' => $request?->ip() ?? request()->ip(),
            'user_agent' => $request?->userAgent() ?? request()->userAgent(),
        ]);
    }

    /**
     * Log a create action.
     *
     * @param string $resource
     * @param int $resourceId
     * @param array $newValues
     * @param Request|null $request
     * @return AuditLog
     */
    public function logCreate(
        string $resource,
        int $resourceId,
        array $newValues = [],
        ?Request $request = null
    ): AuditLog {
        return $this->log('create', $resource, $resourceId, [
            'new_values' => $this->sanitizeValues($newValues),
            'ip_address' => $request?->ip() ?? request()->ip(),
            'user_agent' => $request?->userAgent() ?? request()->userAgent(),
        ]);
    }

    /**
     * Log an update action.
     *
     * @param string $resource
     * @param int $resourceId
     * @param array $oldValues
     * @param array $newValues
     * @param Request|null $request
     * @return AuditLog
     */
    public function logUpdate(
        string $resource,
        int $resourceId,
        array $oldValues = [],
        array $newValues = [],
        ?Request $request = null
    ): AuditLog {
        return $this->log('update', $resource, $resourceId, [
            'old_values' => $this->sanitizeValues($oldValues),
            'new_values' => $this->sanitizeValues($newValues),
            'ip_address' => $request?->ip() ?? request()->ip(),
            'user_agent' => $request?->userAgent() ?? request()->userAgent(),
        ]);
    }

    /**
     * Log a delete action.
     *
     * @param string $resource
     * @param int $resourceId
     * @param array $oldValues
     * @param Request|null $request
     * @return AuditLog
     */
    public function logDelete(
        string $resource,
        int $resourceId,
        array $oldValues = [],
        ?Request $request = null
    ): AuditLog {
        return $this->log('delete', $resource, $resourceId, [
            'old_values' => $this->sanitizeValues($oldValues),
            'ip_address' => $request?->ip() ?? request()->ip(),
            'user_agent' => $request?->userAgent() ?? request()->userAgent(),
        ]);
    }

    /**
     * Sanitize values to remove sensitive data.
     *
     * @param array $values
     * @return array
     */
    protected function sanitizeValues(array $values): array
    {
        $sensitiveFields = [
            'password',
            'password_confirmation',
            'current_password',
            'new_password',
            'token',
            'api_token',
            'remember_token',
            'secret',
        ];

        foreach ($sensitiveFields as $field) {
            if (isset($values[$field])) {
                $values[$field] = '[REDACTED]';
            }
        }

        return $values;
    }
}
