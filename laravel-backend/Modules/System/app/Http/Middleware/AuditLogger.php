<?php

namespace Modules\System\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\System\Services\AuditLogService;
use Symfony\Component\HttpFoundation\Response;

class AuditLogger
{
    protected AuditLogService $auditLogService;

    /**
     * HTTP methods that should be logged.
     */
    protected array $loggableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    /**
     * Routes that should not be logged.
     */
    protected array $excludedRoutes = [
        'api/auth/login',
        'api/auth/logout',
        'api/auth/register',
    ];

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->shouldLog($request, $response)) {
            $this->logAction($request, $response);
        }

        return $response;
    }

    /**
     * Determine if the request should be logged.
     *
     * @param Request $request
     * @param Response $response
     * @return bool
     */
    protected function shouldLog(Request $request, Response $response): bool
    {
        // Only log for authenticated users
        if (!$request->user()) {
            return false;
        }

        // Only log specific HTTP methods
        if (!in_array($request->method(), $this->loggableMethods)) {
            return false;
        }

        // Don't log excluded routes
        $path = $request->path();
        foreach ($this->excludedRoutes as $excludedRoute) {
            if (str_starts_with($path, $excludedRoute)) {
                return false;
            }
        }

        // Only log successful responses (2xx status codes)
        $statusCode = $response->getStatusCode();
        if ($statusCode < 200 || $statusCode >= 300) {
            return false;
        }

        return true;
    }

    /**
     * Log the action.
     *
     * @param Request $request
     * @param Response $response
     * @return void
     */
    protected function logAction(Request $request, Response $response): void
    {
        $action = $this->determineAction($request);
        $resource = $this->determineResource($request);
        $resourceId = $this->determineResourceId($request, $response);

        $this->auditLogService->log(
            $action,
            $resource,
            $resourceId,
            [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'new_values' => $this->sanitizeRequestData($request->all()),
            ]
        );
    }

    /**
     * Determine the action based on HTTP method.
     *
     * @param Request $request
     * @return string
     */
    protected function determineAction(Request $request): string
    {
        return match ($request->method()) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => strtolower($request->method()),
        };
    }

    /**
     * Determine the resource from the request path.
     *
     * @param Request $request
     * @return string
     */
    protected function determineResource(Request $request): string
    {
        $segments = $request->segments();
        
        // Remove 'api' prefix if present
        if (!empty($segments) && $segments[0] === 'api') {
            array_shift($segments);
        }

        // Get the first segment as the resource name
        return !empty($segments) ? $segments[0] : 'unknown';
    }

    /**
     * Determine the resource ID from the request or response.
     *
     * @param Request $request
     * @param Response $response
     * @return int|null
     */
    protected function determineResourceId(Request $request, Response $response): ?int
    {
        // Try to get ID from route parameter
        $routeId = $request->route('id') ?? $request->route('user') ?? $request->route('role');
        if ($routeId) {
            return (int) $routeId;
        }

        // For POST requests, try to get ID from response
        if ($request->method() === 'POST') {
            $content = $response->getContent();
            if ($content) {
                $data = json_decode($content, true);
                if (isset($data['data']['id'])) {
                    return (int) $data['data']['id'];
                }
                // Check nested structures
                foreach (['user', 'role', 'permission', 'setting'] as $key) {
                    if (isset($data['data'][$key]['id'])) {
                        return (int) $data['data'][$key]['id'];
                    }
                }
            }
        }

        return null;
    }

    /**
     * Sanitize request data to remove sensitive information.
     *
     * @param array $data
     * @return array
     */
    protected function sanitizeRequestData(array $data): array
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
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }

        return $data;
    }
}
