<?php

namespace Database\Factories;

use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    // database/factories/PaymentFactory.php
    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory(),
            'payment_method' => fake()->randomElement(['credit_card', 'paypal', 'cash']),
            'amount' => fake()->randomFloat(2, 100, 2000),
            'currency' => 'USD',
            'status' => fake()->randomElement(['CREATED', 'COMPLETED', 'APPROVED', 'FAILED', 'REFUNDED']),
            'transaction_id' => 'TXN-' . fake()->unique()->randomNumber(6),
            'details' => ['card_last4' => fake()->randomNumber(4)],
        ];
    }
}
