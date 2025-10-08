<?php

namespace Database\Factories;

use App\Models\Agency;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    // database/factories/VehicleFactory.php
    public function definition(): array
    {
        $brands = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Tesla'];
        $models = ['Camry', 'Civic', 'F-150', 'X5', 'C-Class', 'Model 3'];
        $types = ['car', 'motorcycle', 'truck'];

        return [
            'agency_id' => Agency::factory(),
            'brand' => fake()->randomElement($brands),
            'model' => fake()->randomElement($models),
            'year' => fake()->numberBetween(2010, 2024),
            'color' => fake()->safeColorName(),
            'license_plate' => fake()->regexify('[A-Z]{2}[0-9]{3}[A-Z]{2}'),
            'vin' => fake()->unique()->regexify('[A-HJ-NPR-Z0-9]{17}'),
            'mileage' => fake()->numberBetween(1000, 100000),
            'engine_type' => fake()->randomElement(['V6', 'V8', 'I4', 'Electric']),
            'transmission' => fake()->randomElement(['automatic', 'manual']),
            'fuel_type' => fake()->randomElement(['gasoline', 'diesel', 'electric', 'hybrid']),
            'seats' => fake()->numberBetween(2, 8),
            'doors' => fake()->numberBetween(2, 5),
            'price_per_day' => fake()->randomFloat(2, 30, 200),
            'price_per_week' => fake()->randomFloat(2, 150, 1000),
            'price_per_month' => fake()->randomFloat(2, 1000, 5000),
            'discount_rate' => fake()->randomFloat(2, 0, 20),
            'minimum_rental_days' => fake()->numberBetween(1, 7),
            'status' => fake()->randomElement(['available', 'not available', 'rented']),
            'description' => fake()->paragraph(),
            'images' => [
                'https://placehold.co/600x400?text=' . fake()->word(),
                'https://placehold.co/600x400?text=' . fake()->word()
            ],
            'features' => fake()->randomElements(['AC', 'GPS', 'Bluetooth', 'Sunroof', 'Heated Seats'], 3),
            'delivery_fee_per_km' => fake()->randomFloat(2, 1, 5),
            'available_from' => now(),
            'available_to' => now()->addMonths(6),
            'blackout_dates' => [now()->addDays(10)->format('Y-m-d')],
            'type' => fake()->randomElement($types),
        ];
    }
}
