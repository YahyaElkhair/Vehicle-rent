<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use App\Models\Advertisement;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AdvertisementController extends Controller
{


    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    /**
     * Display a listing of all advertisements (optionally filtered by post or status).
     */
    public function index(Request $request)
    {
        $ads = Advertisement::with('post')
            ->when($request->post_id, fn($q) => $q->where('post_id', $request->post_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->get();
            
        foreach ($ads as $ad) {
            $ad->post->agency->logo_path = Storage::url($ad->post->agency->logo_path );
            $ad->post->vehicle->images = collect($ad->post->vehicle->images)->map(fn($path) => Storage::url($path) )->toArray();

        }

        return response()->json($ads);
    }

    /**
     * Store a new advertisement boost manually (e.g. free or admin-added).
     */
    public static function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'post_id'       => 'required|exists:posts,id',
                'amount'        => 'required|numeric|min:0',
                'duration_days' => 'required|integer|min:1',
                'paypal_order_id' => 'nullable|string|unique:advertisements,paypal_order_id',
                'starts_at' => 'nullable|after_or_equal:'.now()

            ]);
            $post = Post::findOrFail($validated['post_id']);

    
            $startsAt = $validated['starts_at'] ?? now();
            $endsAt   = Carbon::parse($startsAt)->addDays($validated['duration_days']);
            $validated['starts_at'] = $startsAt;
            $validated['ends_at'] = $endsAt;
            $validated['status'] = 'active';

            $validated['paypal_order_id'] ?? null ;

            $ad = $post->advertisements()->create($validated);


            return response()->json(['message' => 'Advertisement created', 'advertisement' => $ad], 201);

        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Post not found.'], 404);
        }  


    }

    /**
     * Display the specified advertisement.
     */
    public function show($id)
    {
        try {
            $advertisement = Advertisement::with([
                'post',
            ])->findOrFail($id);


            $advertisement->post->agency->logo_path = Storage::url($advertisement->post->agency->logo_path );
            $advertisement->post->vehicle->images = collect($advertisement->post->vehicle->images)->map(fn($path) => Storage::url($path) )->toArray();

            return response()->json($advertisement);

        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Advertisement not found.'], 404);
        }        

    }

    /**
     * Update an existing advertisement (e.g. extend duration).
     */
    public static function update(Request $request)
    {
        try {
            $ad = Advertisement::findOrFail($request->advertisement_id);
            $validated = $request->validate([
                'post_id'       => 'required|exists:posts,id',
                'amount'        => 'required|numeric|min:0',
                'duration_days' => 'required|integer|min:1',
                'paypal_order_id' => 'nullable|string|unique:advertisements,paypal_order_id',
                'starts_at' => 'nullable|after_or_equal:'.now()
            ]);
            Post::findOrFail($validated['post_id']);

            if($ad->status === 'active'){
                $adEndAt = $ad->ends_at;
                $endsAt   = Carbon::parse($adEndAt)->addDays($validated['duration_days']);
                $validated['ends_at'] = $endsAt;
                $validated['amount'] += $ad->amount;
                $validated['duration_days'] += $ad->duration_days;

            }else{
                $startsAt = $validated['starts_at'] ?? now();
                $endsAt   = Carbon::parse($startsAt)->addDays($validated['duration_days']);
                $validated['starts_at'] = $startsAt;
                $validated['ends_at'] = $endsAt;
                $validated['status'] = 'active';
            }
            $original = $ad->getOriginal();
            $ad->update($validated);
            $updated = $ad->fresh()->toArray();

            return response()->json([
                'message' => 'Advertisement updated', 
                'ad' => $ad,
                'changes' => $ad->getChanges(),
            
            ], 201);

        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Post not found.'], 404);
        }
    }

    /**
     * Remove an advertisement (soft delete).
     */
    public function destroy(Advertisement $advertisement)
    {
        $advertisement->delete();

        return response()->json(['message' => 'Advertisement deleted']);
    }

}
