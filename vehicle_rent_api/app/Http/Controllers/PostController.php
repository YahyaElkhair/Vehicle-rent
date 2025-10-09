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

        // Pagination
        $posts = $query->paginate(50);

        return response()->json($posts);
    }

    public function store(Request $request)
    {
        try {
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

            $validated['slug'] = Str::slug($validated['title']);
            $post = $request->user()->agency->posts()->create($validated);

            $post = $post->load(['agency', 'vehicle']);

            // Process logo path
            if ($post->agency && $post->agency->logo_path && !Str::startsWith($post->agency->logo_path, 'https')) {
                $post->agency->logo_path = Storage::url($post->agency->logo_path);
            }

            // Process vehicle images
            if ($post->vehicle && $post->vehicle->images) {
                $post->vehicle->images = collect($post->vehicle->images)
                    ->map(fn($path) => Storage::url($path))
                    ->toArray();
            }

            return response()->json([
                'success' => true,
                'message' => 'Post created successfully',
                'data' => $post
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->errorInfo[1] == 1062) {
                return response()->json([
                    'success' => false,
                    'message' => 'Each post must have a unique vehicle and title'
                ], 422);
            }
            return response()->json([
                'success' => false,
                'message' => 'Database error occurred'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unexpected error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $post = Post::with([
                'agency',
                'vehicle',
                'comments' => function ($q) {
                    $q->whereNull('deleted_at')->with('user');
                }
            ])->findOrFail($id);

            $post->increment('view_count');

            // Process logo path with null check
            if ($post->agency && $post->agency->logo_path && !Str::startsWith($post->agency->logo_path, 'https')) {
                $post->agency->logo_path = Storage::url($post->agency->logo_path);
            }

            // Process vehicle images with null checks
            if ($post->vehicle && $post->vehicle->images) {
                $post->vehicle->images = collect($post->vehicle->images)
                    ->map(function ($path) {
                        if (Str::startsWith($path, ['http://', 'https://'])) {
                            return $path;
                        }
                        return Storage::url($path);
                    })
                    ->toArray();
            } else if ($post->vehicle) {
                // If vehicle exists but has no images, set empty array
                $post->vehicle->images = [];
            }

            return response()->json([
                'success' => true,
                'data' => $post
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch post',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $post = Post::findOrFail($id);

            // Authorization check
            $agency = $request->user()->agency;

            if (!$agency) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have an agency'
                ], 403);
            }

            if ($post->agency_id !== $agency->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to edit this post'
                ], 403);
            }

            $validated = $request->validate([
                'vehicle_id' => 'sometimes|exists:vehicles,id',
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'status' => 'sometimes|in:draft,published,archived',
                'delivery_options' => 'sometimes|array',
                'delivery_options.*' => 'in:agency pickup,delivery',
                'min_driver_age' => 'sometimes|integer|min:18|max:99',
                'min_license_years' => 'sometimes|integer|min:1|max:50',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
            ]);

            // Update slug if title changed
            if (isset($validated['title'])) {
                $validated['slug'] = Str::slug($validated['title']);
            }

            $post->update($validated);
            $post = $post->load(['agency', 'vehicle']);

            // Process logo path
            if ($post->agency && $post->agency->logo_path && !Str::startsWith($post->agency->logo_path, 'https')) {
                $post->agency->logo_path = Storage::url($post->agency->logo_path);
            }

            // Process vehicle images
            if ($post->vehicle && $post->vehicle->images) {
                $post->vehicle->images = collect($post->vehicle->images)
                    ->map(fn($path) => Storage::url($path))
                    ->toArray();
            } else if ($post->vehicle) {
                $post->vehicle->images = [];
            }

            return response()->json([
                'success' => true,
                'message' => 'Post updated successfully',
                'data' => $post
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update post',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $post = Post::findOrFail($id);

            // Authorization check
            $agency = $request->user()->agency;

            if (!$agency) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have an agency'
                ], 403);
            }

            if ($post->agency_id !== $agency->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this post'
                ], 403);
            }

            // Check for active reservations with null check
            if ($post->vehicle) {
                $activeReservations = $post->vehicle->reservations()
                    ->whereIn('status', ['pending', 'confirmed', 'active'])
                    ->count();

                if ($activeReservations > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot delete post with active reservations'
                    ], 422);
                }
            }

            // Delete associated data
            $post->comments()->delete();
            $post->advertisements()->delete();
            $post->delete();

            return response()->json([
                'success' => true,
                'message' => 'Post deleted successfully'
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete post',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getByAgency($agencyId)
    {
        $posts = Post::where('agency_id', $agencyId)
            ->with(['agency', 'vehicle'])
            ->get();

        $posts->each(function ($post) {
            if ($post->agency && $post->agency->logo_path && !Str::startsWith($post->agency->logo_path, 'https')) {
                $post->agency->logo_path = Storage::url($post->agency->logo_path);
            }
            if ($post->vehicle && $post->vehicle->images) {
                $post->vehicle->images = collect($post->vehicle->images)
                    ->map(fn($path) => Storage::url($path))
                    ->toArray();
            } else if ($post->vehicle) {
                $post->vehicle->images = [];
            }
        });

        return response()->json([
            'success' => true,
            'data' => $posts
        ]);
    }
}
