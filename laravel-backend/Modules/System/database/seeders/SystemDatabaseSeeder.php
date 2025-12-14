<?php

namespace Modules\System\Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\System\Models\Permission;
use Modules\System\Models\Role;

class SystemDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = $this->createPermissions();
        
        // Create roles
        $roles = $this->createRoles($permissions);
        
        // Create admin user
        $this->createAdminUser($roles['super_admin']);
    }

    private function createPermissions(): array
    {
        $permissionData = [
            // Users module
            ['name' => 'users.view', 'description' => 'View users list', 'module' => 'users'],
            ['name' => 'users.create', 'description' => 'Create new users', 'module' => 'users'],
            ['name' => 'users.edit', 'description' => 'Edit existing users', 'module' => 'users'],
            ['name' => 'users.delete', 'description' => 'Delete users', 'module' => 'users'],
            
            // Roles module
            ['name' => 'roles.view', 'description' => 'View roles list', 'module' => 'roles'],
            ['name' => 'roles.create', 'description' => 'Create new roles', 'module' => 'roles'],
            ['name' => 'roles.edit', 'description' => 'Edit existing roles', 'module' => 'roles'],
            ['name' => 'roles.delete', 'description' => 'Delete roles', 'module' => 'roles'],
            
            // Permissions module
            ['name' => 'permissions.view', 'description' => 'View permissions list', 'module' => 'permissions'],
            
            // Audit logs module
            ['name' => 'audit_logs.view', 'description' => 'View audit logs', 'module' => 'audit_logs'],
            
            // Settings module
            ['name' => 'settings.view', 'description' => 'View system settings', 'module' => 'settings'],
            ['name' => 'settings.edit', 'description' => 'Edit system settings', 'module' => 'settings'],
        ];

        $permissions = [];
        foreach ($permissionData as $data) {
            $permissions[$data['name']] = Permission::firstOrCreate(
                ['name' => $data['name']],
                $data
            );
        }

        return $permissions;
    }

    private function createRoles(array $permissions): array
    {
        // Super Admin - all permissions
        $superAdmin = Role::firstOrCreate(
            ['name' => 'Super Admin'],
            ['description' => 'Full system access', 'is_system' => true]
        );
        $superAdmin->permissions()->sync(array_map(fn($p) => $p->id, $permissions));

        // Manager - most permissions
        $manager = Role::firstOrCreate(
            ['name' => 'Manager'],
            ['description' => 'Management access', 'is_system' => true]
        );
        $managerPermissions = ['users.view', 'users.create', 'users.edit', 'roles.view', 'audit_logs.view'];
        $manager->permissions()->sync(
            array_map(fn($name) => $permissions[$name]->id, $managerPermissions)
        );

        // Sales Rep
        $salesRep = Role::firstOrCreate(
            ['name' => 'Sales Rep'],
            ['description' => 'Sales representative access', 'is_system' => true]
        );
        $salesRep->permissions()->sync([$permissions['users.view']->id]);

        // Accountant
        $accountant = Role::firstOrCreate(
            ['name' => 'Accountant'],
            ['description' => 'Accounting access', 'is_system' => true]
        );
        $accountant->permissions()->sync([$permissions['users.view']->id]);

        return [
            'super_admin' => $superAdmin,
            'manager' => $manager,
            'sales_rep' => $salesRep,
            'accountant' => $accountant,
        ];
    }

    private function createAdminUser(Role $superAdminRole): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        $admin->roles()->syncWithoutDetaching([$superAdminRole->id]);

        $this->command->info('Admin user created:');
        $this->command->info('  Email: admin@example.com');
        $this->command->info('  Password: password123');
    }
}
