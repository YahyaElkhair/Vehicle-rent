<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\Agency;
use App\Models\Vehicle;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Factory;

class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition(): array
    {
        $allOptions = ['agency pickup', 'home delivery', 'airport delivery'];

        // Generate 1-3 random unique delivery options
        $deliveryOptions = fake()->randomElements(
            $allOptions,
            fake()->numberBetween(1, 3)
        );

        return [
            'agency_id' => Agency::factory(),
            'vehicle_id' => Vehicle::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraphs(3, true),
            'status' => fake()->randomElement(['published', 'draft']),
            'delivery_options' => $deliveryOptions,
            'min_driver_age' => fake()->numberBetween(21, 25),
            'min_license_years' => fake()->numberBetween(1, 3),
            'slug' => fake()->unique()->slug(),
            'meta_title' => fake()->sentence(),
            'meta_description' => fake()->sentence(),
        ];
    }
}
