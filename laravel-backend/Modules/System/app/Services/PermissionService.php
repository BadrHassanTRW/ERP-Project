<?php

namespace Modules\System\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Modules\System\Models\Permission;

class PermissionService
{
    /**
     * Cache TTL in seconds (1 hour).
     */
    protected const CACHE_TTL = 3600;

    /**
     * Get all permissions.
     *
     * @return Collection
     */
    public function getAllPermissions(): Collection
    {
        return Permission::all();
    }

    /**
     * Get all permissions grouped by module.
     *
     * @return array
     */
    public function getPermissionsGroupedByModule(): array
    {
        $permissions = Permission::all();

        return $permissions->groupBy('module')->map(function ($modulePermissions) {
            return $modulePermissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'description' => $permission->description,
                ];
            })->values()->toArray();
        })->toArray();
    }

    /**
     * Check if a user has a specific permission.
     *
     * @param User $user
     * @param string $permission
     * @return bool
     */
    public function userHasPermission(User $user, string $permission): bool
    {
        $cacheKey = $this->getUserPermissionsCacheKey($user->id);

        $permissions = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            return $this->getUserPermissions($user)->pluck('name')->toArray();
        });

        return in_array($permission, $permissions);
    }


    /**
     * Get all permissions for a user through their roles.
     *
     * @param User $user
     * @return Collection
     */
    public function getUserPermissions(User $user): Collection
    {
        return $user->roles()
            ->with('permissions')
            ->get()
            ->pluck('permissions')
            ->flatten()
            ->unique('id')
            ->values();
    }

    /**
     * Validate that all permission IDs exist.
     *
     * @param array $permissionIds
     * @return bool
     */
    public function validatePermissionIds(array $permissionIds): bool
    {
        if (empty($permissionIds)) {
            return true;
        }

        $existingCount = Permission::whereIn('id', $permissionIds)->count();

        return $existingCount === count($permissionIds);
    }

    /**
     * Get cache key for user permissions.
     *
     * @param int $userId
     * @return string
     */
    protected function getUserPermissionsCacheKey(int $userId): string
    {
        return "user_permissions:{$userId}";
    }

    /**
     * Clear cached permissions for a user.
     *
     * @param int $userId
     * @return void
     */
    public function clearUserPermissionsCache(int $userId): void
    {
        Cache::forget($this->getUserPermissionsCacheKey($userId));
    }

    /**
     * Clear cached permissions for all users with a specific role.
     *
     * @param int $roleId
     * @return void
     */
    public function clearRoleUsersPermissionsCache(int $roleId): void
    {
        $userIds = \DB::table('role_user')
            ->where('role_id', $roleId)
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            $this->clearUserPermissionsCache($userId);
        }
    }
}
