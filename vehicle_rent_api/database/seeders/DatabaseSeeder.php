<?php

namespace Database\Seeders;

use App\Models\Advertisement;
use App\Models\Agency;
use App\Models\Comment;
use App\Models\Payment;
use App\Models\Post;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing roles and permissions
        Permission::query()->delete();
        Role::query()->delete();
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles and permissions
        $this->call(RolesAndPermissionsSeeder::class);

        // // Create clients
        // User::factory()->client()->count(70)->create();
        // User::factory()->agencyManager()->count(15)->create();

        // // Create agency managers and their agencies
        // Agency::factory()->count(15)->create();


        // // Create vehicles
        // $vehicles = Vehicle::factory()->count(50)->create();

        // // Create posts
        // $posts = Post::factory()->count(50)->create();

        // // Create comments
        // Comment::factory()->count(200)->create();

        // // Create reservations
        // Reservation::factory()->count(100)->create();

        // // Create payments
        // Payment::factory()->count(100)->create();

        // // Create advertisements
        // Advertisement::factory()->count(30)->create();

        // // Update rating stats for posts
        // Post::each(function ($post) {
        //     $post->updateRatingStats();
        // });

    }
}
