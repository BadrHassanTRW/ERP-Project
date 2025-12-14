<?php

namespace Modules\System\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\System\Models\Permission;
use Modules\System\Models\Role;

class RoleService
{
    /**
     * Get all roles.
     *
     * @return Collection
     */
    public function getAllRoles(): Collection
    {
        return Role::with('permissions')->get();
    }

    /**
     * Create a new role.
     *
     * @param array $data
     * @return Role
     * @throws ValidationException
     */
    public function createRole(array $data): Role
    {
        // Check for duplicate name
        if (Role::where('name', $data['name'])->exists()) {
            throw ValidationException::withMessages([
                'name' => ['A role with this name already exists.'],
            ]);
        }

        return DB::transaction(function () use ($data) {
            $role = Role::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_system' => $data['is_system'] ?? false,
            ]);

            // Assign permissions if provided
            if (!empty($data['permission_ids'])) {
                $this->validatePermissionIds($data['permission_ids']);
                $role->permissions()->sync($data['permission_ids']);
            }

            return $role->load('permissions');
        });
    }


    /**
     * Update an existing role.
     *
     * @param int $id
     * @param array $data
     * @return Role
     * @throws ValidationException
     */
    public function updateRole(int $id, array $data): Role
    {
        $role = Role::findOrFail($id);

        // Check for duplicate name if name is being changed
        if (!empty($data['name']) && $data['name'] !== $role->name) {
            if (Role::where('name', $data['name'])->where('id', '!=', $id)->exists()) {
                throw ValidationException::withMessages([
                    'name' => ['A role with this name already exists.'],
                ]);
            }
        }

        return DB::transaction(function () use ($role, $data) {
            $updateData = [];

            if (isset($data['name'])) {
                $updateData['name'] = $data['name'];
            }

            if (array_key_exists('description', $data)) {
                $updateData['description'] = $data['description'];
            }

            if (isset($data['is_system'])) {
                $updateData['is_system'] = $data['is_system'];
            }

            if (!empty($updateData)) {
                $role->update($updateData);
            }

            return $role->fresh()->load('permissions');
        });
    }

    /**
     * Delete a role.
     *
     * @param int $id
     * @return bool
     * @throws ValidationException
     */
    public function deleteRole(int $id): bool
    {
        $role = Role::findOrFail($id);

        // Check if role has assigned users
        if ($this->hasAssignedUsers($id)) {
            throw ValidationException::withMessages([
                'role' => ['Cannot delete role that has assigned users.'],
            ]);
        }

        return DB::transaction(function () use ($role) {
            // Detach all permissions
            $role->permissions()->detach();
            
            return $role->delete();
        });
    }

    /**
     * Assign permissions to a role.
     *
     * @param int $roleId
     * @param array $permissionIds
     * @return Role
     * @throws ValidationException
     */
    public function assignPermissions(int $roleId, array $permissionIds): Role
    {
        $role = Role::findOrFail($roleId);

        // Validate all permission IDs exist
        $this->validatePermissionIds($permissionIds);

        $role->permissions()->sync($permissionIds);

        return $role->fresh()->load('permissions');
    }

    /**
     * Check if a role has assigned users.
     *
     * @param int $roleId
     * @return bool
     */
    public function hasAssignedUsers(int $roleId): bool
    {
        $role = Role::findOrFail($roleId);
        
        return $role->users()->count() > 0;
    }

    /**
     * Validate that all permission IDs exist.
     *
     * @param array $permissionIds
     * @return bool
     * @throws ValidationException
     */
    public function validatePermissionIds(array $permissionIds): bool
    {
        if (empty($permissionIds)) {
            return true;
        }

        $existingCount = Permission::whereIn('id', $permissionIds)->count();

        if ($existingCount !== count($permissionIds)) {
            throw ValidationException::withMessages([
                'permission_ids' => ['One or more permission IDs are invalid.'],
            ]);
        }

        return true;
    }

    /**
     * Get a single role by ID.
     *
     * @param int $id
     * @return Role
     */
    public function getRole(int $id): Role
    {
        return Role::with('permissions')->findOrFail($id);
    }
}
