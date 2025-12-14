<?php

namespace Modules\System\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserService
{
    /**
     * Get all users with pagination and filtering.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getAllUsers(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::with('roles');

        // Filter by name
        if (!empty($filters['name'])) {
            $query->where('name', 'like', '%' . $filters['name'] . '%');
        }

        // Filter by email
        if (!empty($filters['email'])) {
            $query->where('email', 'like', '%' . $filters['email'] . '%');
        }

        // Filter by active status
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        // Filter by role
        if (!empty($filters['role_id'])) {
            $query->whereHas('roles', function ($q) use ($filters) {
                $q->where('roles.id', $filters['role_id']);
            });
        }

        // Sort by field
        $sortField = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        return $query->paginate($perPage);
    }


    /**
     * Create a new user.
     *
     * @param array $data
     * @return User
     * @throws ValidationException
     */
    public function createUser(array $data): User
    {
        // Check for duplicate email
        if (User::where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages([
                'email' => ['The email has already been taken.'],
            ]);
        }

        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'avatar' => $data['avatar'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Assign roles if provided
            if (!empty($data['role_ids'])) {
                $user->roles()->sync($data['role_ids']);
            }

            // Optionally mark email as verified if created by admin
            if (!empty($data['email_verified'])) {
                $user->email_verified_at = now();
                $user->save();
            }

            return $user->load('roles');
        });
    }

    /**
     * Update an existing user.
     *
     * @param int $id
     * @param array $data
     * @return User
     * @throws ValidationException
     */
    public function updateUser(int $id, array $data): User
    {
        $user = User::findOrFail($id);

        // Check for duplicate email if email is being changed
        if (!empty($data['email']) && $data['email'] !== $user->email) {
            if (User::where('email', $data['email'])->where('id', '!=', $id)->exists()) {
                throw ValidationException::withMessages([
                    'email' => ['The email has already been taken.'],
                ]);
            }
        }

        return DB::transaction(function () use ($user, $data) {
            $updateData = [];

            if (isset($data['name'])) {
                $updateData['name'] = $data['name'];
            }

            if (isset($data['email'])) {
                $updateData['email'] = $data['email'];
            }

            if (isset($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            if (array_key_exists('avatar', $data)) {
                $updateData['avatar'] = $data['avatar'];
            }

            if (isset($data['is_active'])) {
                $updateData['is_active'] = $data['is_active'];
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            // Update roles if provided
            if (isset($data['role_ids'])) {
                $user->roles()->sync($data['role_ids']);
            }

            return $user->fresh()->load('roles');
        });
    }

    /**
     * Soft delete a user and revoke all sessions.
     *
     * @param int $id
     * @return bool
     */
    public function deleteUser(int $id): bool
    {
        $user = User::findOrFail($id);

        return DB::transaction(function () use ($user) {
            // Revoke all active tokens/sessions
            $user->tokens()->delete();

            // Soft delete the user
            return $user->delete();
        });
    }

    /**
     * Assign roles to a user.
     *
     * @param int $userId
     * @param array $roleIds
     * @return User
     */
    public function assignRoles(int $userId, array $roleIds): User
    {
        $user = User::findOrFail($userId);
        
        $user->roles()->sync($roleIds);

        return $user->fresh()->load('roles');
    }

    /**
     * Get a single user by ID.
     *
     * @param int $id
     * @return User
     */
    public function getUser(int $id): User
    {
        return User::with('roles')->findOrFail($id);
    }
}
