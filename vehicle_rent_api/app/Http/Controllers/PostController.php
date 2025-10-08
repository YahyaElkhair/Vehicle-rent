<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PostController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    public function index(Request $request)
    {
        $query = Post::query()->with('vehicle.agency');
        // Apply main filters using the filter scope
        $query->filter($request->only([
            'popular',
            'agency_name',
            'brand',
            'vehicle_status',
            'vehicle_age',
            'license',
            'delivery',
            'search',
            'min',
            'max'
        ]));

        // Handle sorting - using scopeSortBy
        // $sortBy = $request->get('sort_by', 'created_at');
        // $direction = $request->get('order', 'desc');

        // $query->sortBy($sortBy, $direction);


        // Pagination
        $posts = $query->paginate(50);

        return response()->json($posts);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request data
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'nullable|in:draft,published,archived',
            'delivery_options' => 'required|array',
            'delivery_options.*' => 'in:agency pickup,delivery',
            'min_driver_age' => 'nullable|integer|min:18|max:99',
            'min_license_years' => 'nullable|integer|min:1|max:50',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
        ]);

        // Create the post
        try {

            $validated['slug'] = Str::slug($validated['title']);
            $post = $request->user()->agency->posts()->create($validated);

            $post = $post->load(['agency', 'vehicle']);
            $post->agency->logo_path = Storage::url($post->agency->logo_path);
            $post->vehicle->images = collect($post->vehicle->images)->map(fn($path) => Storage::url($path))->toArray();

            return response()->json([
                'message' => 'Post created successfully',
                'post' => $post
            ], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            $errorCode = $e->errorInfo[1]; // MySQL error code
            if ($errorCode == 1062) {
                return response()->json([
                    'error' => 'Each post must have a unique vehicle and title'
                ], 422);
            } elseif ($errorCode == 1452) {
                // Foreign key constraint fails
                return response()->json([
                    'error' => 'Invalid vehicle or agency ID (foreign key constraint failed).'
                ], 422);
            } elseif ($errorCode == 1048) {
                // Column cannot be null
                return response()->json([
                    'error' => 'A required field is missing. Please check your input.'
                ], 422);
            } else {
                return response()->json([
                    'error' => 'An unexpected database error occurred. Please try again later.'
                ], 500);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unexpected error occurred',
                'message' => $e->getMessage(),
                // 'trace' => $e->getTrace() // Uncomment for debugging
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $post = Post::with([
                'agency',
                'vehicle',
                'comments' => function ($q) {
                    $q->whereNull('deleted_at')
                        ->with('user');
                }
            ])->findOrFail($id); // throws exception if not found

            $post->increment('view_count');

            if (!Str::startsWith($post->agency->logo_path, 'https')) {
                $post->agency->logo_path = Storage::url($post->agency->logo_path);
            }
            
            $post->vehicle->images = collect($post->vehicle->images)->map(fn($path) => Storage::url($path))->toArray();

            return response()->json($post);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Post not found.'], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Post $post)
    {
        $validated = $request->validate([
            'vehicle_id' => 'sometimes|exists:vehicles,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'status' => 'sometimes|in:draft,published,archived',
            'delivery_options' => 'sometimes|array',
            'delivery_options.*' => 'in:agency pickup,delivery',
            'min_driver_age' => 'sometimes|integer|min:18|max:99',
            'min_license_years' => 'sometimes|integer|min:1|max:50',
            'meta_title' => 'sometimes|string|max:255',
            'meta_description' => 'sometimes|string|max:500',
        ]);

        // Create the post
        $post->update($validated);
        $post = $post->load(['agency', 'vehicle']);
        $post->agency->logo_path = Storage::url($post->agency->logo_path);
        $post->vehicle->images = collect($post->vehicle->images)->map(fn($path) => Storage::url($path))->toArray();

        return response()->json([
            'message' => 'Post updated successfully',
            'post' => $post
        ], 201);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post)
    {
        $post->delete();
        return response()->json(['message' => 'Post deleted successfully.']);
    }

    /**
     * Update post rating
     */
    public function rate(Post $post, int $rating)
    {
        $validated = validator(['rating' => $rating], [
            'rating' => 'required|integer|between:1,5'
        ])->validate();

        // Update rating counts
        $post->increment($this->getStarFieldName($rating));
        $post->increment('total_reviews');

        // Calculate new average
        $average = $this->calculateAverageRating($post);
        $post->update(['average_rating' => $average]);

        return response()->json(['average_rating' => $average]);
    }

    private function getStarFieldName(int $rating): string
    {
        return match ($rating) {
            1 => 'one_star_count',
            2 => 'two_star_count',
            3 => 'three_star_count',
            4 => 'four_star_count',
            5 => 'five_star_count',
        };
    }

    private function calculateAverageRating(Post $post): float
    {
        $total = ($post->five_star_count * 5)
            + ($post->four_star_count * 4)
            + ($post->three_star_count * 3)
            + ($post->two_star_count * 2)
            + ($post->one_star_count * 1);

        return round($total / $post->total_reviews, 1);
    }






    // Add to PostController.php
    public function getByAgency($agencyId)
    {
        $posts = Post::where('agency_id', $agencyId)
            ->with(['agency', 'vehicle'])
            ->get();

        // Convert image paths to URLs
        $posts->each(function ($post) {
            $post->agency->logo_path = Storage::url($post->agency->logo_path);
            $post->vehicle->images = collect($post->vehicle->images)
                ->map(fn($path) => Storage::url($path))
                ->toArray();
        });

        return response()->json($posts);
    }
}
