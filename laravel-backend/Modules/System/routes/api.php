<?php

use Illuminate\Support\Facades\Route;
use Modules\System\Http\Controllers\AuditLogController;
use Modules\System\Http\Controllers\AuthController;
use Modules\System\Http\Controllers\PermissionController;
use Modules\System\Http\Controllers\ProfileController;
use Modules\System\Http\Controllers\RoleController;
use Modules\System\Http\Controllers\SystemController;
use Modules\System\Http\Controllers\SystemSettingController;
use Modules\System\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| Authentication Routes (Public)
|--------------------------------------------------------------------------
| POST /api/auth/register
| POST /api/auth/login
| GET /api/auth/verify-email/{token}
| POST /api/auth/forgot-password
| POST /api/auth/reset-password
| Requirements: 1.1-1.5, 2.1-2.3, 3.1-3.5
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/verify-email/{token}', [AuthController::class, 'verifyEmail']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

/*
|--------------------------------------------------------------------------
| Protected Routes (Require Authentication)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Logout Route (Authenticated)
    |--------------------------------------------------------------------------
    | POST /api/auth/logout
    | Requirements: 2.3
    */
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | Profile Routes (Self-Management)
    |--------------------------------------------------------------------------
    | GET /api/profile
    | PUT /api/profile
    | PUT /api/profile/password
    | POST /api/profile/avatar
    | Requirements: 5.1-5.5
    */
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::put('/password', [ProfileController::class, 'updatePassword']);
        Route::post('/avatar', [ProfileController::class, 'updateAvatar']);
    });

    /*
    |--------------------------------------------------------------------------
    | User Management Routes (Admin Only)
    |--------------------------------------------------------------------------
    | GET /api/users
    | POST /api/users
    | GET /api/users/{id}
    | PUT /api/users/{id}
    | DELETE /api/users/{id}
    | POST /api/users/{user}/roles
    | Requirements: 4.1-4.5
    */
    Route::middleware(['permission:users.view'])->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
    });
    Route::middleware(['permission:users.create'])->group(function () {
        Route::post('/users', [UserController::class, 'store']);
    });
    Route::middleware(['permission:users.edit'])->group(function () {
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::post('/users/{user}/roles', [UserController::class, 'assignRoles']);
    });
    Route::middleware(['permission:users.delete'])->group(function () {
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Role Management Routes (Admin Only)
    |--------------------------------------------------------------------------
    | GET /api/roles
    | POST /api/roles
    | GET /api/roles/{id}
    | PUT /api/roles/{id}
    | DELETE /api/roles/{id}
    | POST /api/roles/{id}/permissions
    | Requirements: 6.1-6.5
    */
    Route::middleware(['permission:roles.view'])->group(function () {
        Route::get('/roles', [RoleController::class, 'index']);
        Route::get('/roles/{role}', [RoleController::class, 'show']);
    });
    Route::middleware(['permission:roles.create'])->group(function () {
        Route::post('/roles', [RoleController::class, 'store']);
    });
    Route::middleware(['permission:roles.edit'])->group(function () {
        Route::put('/roles/{role}', [RoleController::class, 'update']);
        Route::post('/roles/{role}/permissions', [RoleController::class, 'assignPermissions']);
    });
    Route::middleware(['permission:roles.delete'])->group(function () {
        Route::delete('/roles/{role}', [RoleController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Permission Routes (Admin Only)
    |--------------------------------------------------------------------------
    | GET /api/permissions
    | GET /api/permissions/grouped
    | Requirements: 7.1
    */
    Route::middleware(['permission:permissions.view'])->group(function () {
        Route::get('/permissions', [PermissionController::class, 'index']);
        Route::get('/permissions/grouped', [PermissionController::class, 'grouped']);
    });

    /*
    |--------------------------------------------------------------------------
    | Audit Log Routes (Admin Only)
    |--------------------------------------------------------------------------
    | GET /api/audit-logs
    | Requirements: 8.2
    */
    Route::middleware(['permission:audit_logs.view'])->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });

    /*
    |--------------------------------------------------------------------------
    | System Settings Routes (Admin Only)
    |--------------------------------------------------------------------------
    | GET /api/settings
    | PUT /api/settings
    | GET /api/settings/{key}
    | POST /api/settings/logo
    | DELETE /api/settings/logo
    | POST /api/settings/clear-cache
    | Requirements: 9.1-9.5
    */
    Route::middleware(['permission:settings.view'])->group(function () {
        Route::get('/settings', [SystemSettingController::class, 'index']);
        Route::get('/settings/{key}', [SystemSettingController::class, 'show']);
    });
    Route::middleware(['permission:settings.edit'])->group(function () {
        Route::put('/settings', [SystemSettingController::class, 'update']);
        Route::post('/settings/logo', [SystemSettingController::class, 'uploadLogo']);
        Route::delete('/settings/logo', [SystemSettingController::class, 'deleteLogo']);
        Route::post('/settings/clear-cache', [SystemSettingController::class, 'clearCache']);
    });

    /*
    |--------------------------------------------------------------------------
    | System Resources (Legacy)
    |--------------------------------------------------------------------------
    */
    Route::prefix('v1')->group(function () {
        Route::apiResource('systems', SystemController::class)->names('system');
    });
});
