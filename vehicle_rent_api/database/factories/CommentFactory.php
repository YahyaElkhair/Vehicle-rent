<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    // database/factories/CommentFactory.php
    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'user_id' => User::factory()->client(),
            'content' => fake()->paragraph(),
            'likes_count' => fake()->numberBetween(0, 50),
            'rating' => fake()->numberBetween(1, 5),
        ];
    }
}
