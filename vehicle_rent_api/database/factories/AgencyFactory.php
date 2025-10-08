<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AgencyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company() . ' Car Rentals',
            'registration_number' => 'REG-' . fake()->unique()->randomNumber(5),
            'email' => fake()->unique()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'description' => fake()->paragraph(),
            'logo_path' => 'https://placehold.co/600x400?text=' . fake()->word() . '+Logo',
            'is_active' => true,
            'agency_coordinates' => [fake()->latitude(), fake()->longitude()],
            'manager_id' => User::factory()->agencyManager(),
        ];
    }
}
