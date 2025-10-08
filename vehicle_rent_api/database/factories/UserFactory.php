<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Spatie\Permission\Models\Role;

class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => bcrypt('xlr80000'),
            'client_coordinates' => [fake()->latitude(), fake()->longitude()],
            'cin' => fake()->unique()->regexify('[A-Z0-9]{10}'),
            'cin_images_path' => [
                'https://placehold.co/600x400?text=CIN_Front',
                'https://placehold.co/600x400?text=CIN_Back'
            ],
            'email_verified_at' => now(),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn(array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function client(): static
    {
        return $this->afterCreating(function (User $user) {
            $clientRole = Role::where('name', 'client')->first();
            $user->assignRole($clientRole);
        });
    }

    public function agencyManager(): static
    {
        return $this->afterCreating(function (User $user) {
            $managerRole = Role::where('name', 'agency manager')->first();
            $user->assignRole($managerRole);
        });
    }

    public function admin(): static
    {
        return $this->afterCreating(function (User $user) {
            $adminRole = Role::where('name', 'admin')->first();
            $user->assignRole($adminRole);
        });
    }
    
}
