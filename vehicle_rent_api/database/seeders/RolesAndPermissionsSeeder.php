<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Permissions
        Permission::create(['name' => 'rent vehicles']);
        Permission::create(['name' => 'manage vehicle']);
        Permission::create(['name' => 'manage users']);

        // Roles
        $admin = Role::create(['name' => 'admin']);
        $client = Role::create(['name' => 'client']);
        $agency_manager = Role::create(['name' => 'agency manager']);

        // Assign permissions to roles
        $admin->givePermissionTo(['manage vehicle', 'manage users']);
        $client->givePermissionTo(['rent vehicles']);
        $agency_manager->givePermissionTo(['manage vehicle']);
    }
}
