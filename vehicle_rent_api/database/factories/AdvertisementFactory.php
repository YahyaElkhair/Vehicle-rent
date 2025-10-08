<?php

namespace Database\Factories;

use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Advertisement>
 */
class AdvertisementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    // database/factories/AdvertisementFactory.php
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-1 month', '+1 week');

        return [
            'post_id' => Post::factory(),
            'amount' => fake()->randomFloat(2, 50, 500),
            'status' => fake()->randomElement(['pending', 'active', 'expired', 'cancelled']),
            'advertisement_type' => fake()->randomElement(['standard', 'premium']),
            'duration_days' => fake()->numberBetween(7, 30),
            'starts_at' => $start,
            'ends_at' => (clone $start)->modify('+' . fake()->numberBetween(7, 30) . ' days'),
            'paypal_order_id' => 'PAYID-' . fake()->unique()->randomNumber(6),
        ];
    }
}
