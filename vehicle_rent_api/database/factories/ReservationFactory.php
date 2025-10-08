<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Agency;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Reservation>
 */
class ReservationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    // database/factories/ReservationFactory.php
    public function definition(): array
    {
        $pickupDate = fake()->dateTimeBetween('+1 day', '+1 week');

        return [
            'client_id' => User::factory()->client(),
            'agency_id' => Agency::factory(),
            'vehicle_id' => Vehicle::factory(),
            'reservation_number' => 'RES-' . fake()->unique()->randomNumber(6),
            'pickup_date' => $pickupDate,
            'return_date' => fake()->dateTimeBetween($pickupDate, '+2 weeks'),
            'pickup_type' => fake()->randomElement(['agency pickup', 'home delivery']),
            'pickup_coordinations' => [fake()->latitude(), fake()->longitude()],
            'delevry_coordinations' => [fake()->latitude(), fake()->longitude()],
            'return_coordinations' => [fake()->latitude(), fake()->longitude()],
            'status' => fake()->randomElement([
                'pending',
                'confirmed',
                'paid',
                'active',
                'completed',
                'cancelled',
                'refunded'
            ]),
            'daily_rate' => fake()->randomFloat(2, 30, 200),
            'total_amount' => fake()->randomFloat(2, 200, 2000),
            'discount_amount' => fake()->randomFloat(2, 0, 100),
            'delivery_fee' => fake()->randomFloat(2, 0, 50),
            'final_amount' => fake()->randomFloat(2, 200, 1900),
            'additional_equipment' => ['child seat', 'roof rack'],
            'equipment_cost' => fake()->randomFloat(2, 10, 50),
        ];
    }
}
