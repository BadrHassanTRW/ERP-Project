<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Use stateless API (token-based auth, no CSRF required)
        // $middleware->statefulApi(); // Disabled - using Bearer tokens instead
        
        // Apply rate limiting to API routes
        $middleware->throttleApi('api');
        
        // Apply input sanitization to API routes
        $middleware->api(append: [
            \Modules\System\Http\Middleware\SanitizeInput::class,
        ]);
        
        // Register custom middleware aliases
        $middleware->alias([
            'permission' => \Modules\System\Http\Middleware\CheckPermission::class,
            'audit' => \Modules\System\Http\Middleware\AuditLogger::class,
            'sanitize' => \Modules\System\Http\Middleware\SanitizeInput::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle validation exceptions
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                    'error_code' => 'VALIDATION_ERROR',
                ], 422);
            }
        });

        // Handle authentication exceptions
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated',
                    'error_code' => 'UNAUTHENTICATED',
                ], 401);
            }
        });

        // Handle authorization exceptions
        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden',
                    'error_code' => 'FORBIDDEN',
                ], 403);
            }
        });

        // Handle model not found exceptions
        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                $modelName = class_basename($e->getModel());
                return response()->json([
                    'success' => false,
                    'message' => "{$modelName} not found",
                    'error_code' => 'RESOURCE_NOT_FOUND',
                ], 404);
            }
        });

        // Handle route not found exceptions
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found',
                    'error_code' => 'NOT_FOUND',
                ], 404);
            }
        });

        // Handle method not allowed exceptions
        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Method not allowed',
                    'error_code' => 'METHOD_NOT_ALLOWED',
                ], 405);
            }
        });

        // Handle rate limiting exceptions
        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                $retryAfter = $e->getHeaders()['Retry-After'] ?? null;
                return response()->json([
                    'success' => false,
                    'message' => 'Too many requests. Please try again later.',
                    'error_code' => 'TOO_MANY_REQUESTS',
                    'retry_after' => $retryAfter,
                ], 429);
            }
        });

        // Handle generic HTTP exceptions
        $exceptions->render(function (HttpException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'An error occurred',
                    'error_code' => 'HTTP_ERROR',
                ], $e->getStatusCode());
            }
        });

        // Handle all other exceptions (generic fallback)
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                // In production, don't expose internal error details
                $message = config('app.debug') 
                    ? $e->getMessage() 
                    : 'An internal server error occurred';
                
                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'error_code' => 'INTERNAL_SERVER_ERROR',
                ], 500);
            }
        });
    })->create();
