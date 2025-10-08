<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\Reservation;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AgencyController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Load all agencies with their manager and vehicles
        return Agency::with(['manager', 'vehicles'])->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'registration_number' => 'required|string|unique:agencies,registration_number',
                'email' => 'required|email|unique:agencies,email',
                'phone' => 'required|string|max:20',
                'agency_coordinates' => 'required',
                'description' => 'nullable|string',
                'logo_path' => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:5048',
                'is_active' => 'boolean',
            ]);

            // Handle logo
            if (!isset($validated['logo_path'])) {
                $randomColor = '';
                do {
                    $randomColor = substr(str_shuffle('ABCDEF0123456789'), 0, 6);
                } while (strtolower($randomColor) === 'ffffff');

                $validated['logo_path'] = "https://ui-avatars.com/api/?name={$request->name}&background={$randomColor}&color=ffff&length=2&bold=true&format=svg";
            } else {
                $validated['logo_path'] = $request->file('logo_path')->store('agency_logos', 'public');
            }

            $agency = $request->user()->agency()->create($validated);
            $agency->logo_path = Storage::url($agency->logo_path);

            return response()->json($agency->load('manager'), 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->errorInfo[1] == 1062) {
                return response()->json([
                    'message' => 'Each user can manage only one agency'
                ], 422);
            }
            return response()->json([
                'error' => 'Database error',
                'message' => $e->getMessage(),
            ], 500);
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
            $agency = Agency::with([
                'manager',
                'vehicles',
            ])->findOrFail($id);
            if (!Str::startsWith($agency->logo_path, 'https')) {
                $agency->logo_path = Storage::url($agency->logo_path);
            }

            return response()->json($agency);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Agency not found.'], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Agency $agency)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'registration_number' => 'sometimes|string|unique:agencies,registration_number,' . $agency->id,
            'email' => 'sometimes|email|unique:agencies,email,' . $agency->id,
            'phone' => 'sometimes|string|max:20',
            'agency_coordinates' => 'sometimes|string', // JSON string
            'description' => 'nullable|string',
            'logo_path' => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:5048',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($request->hasFile('logo_path')) {
            // Delete old logo if needed...
            $validated['logo_path'] = $request->file('logo_path')->store('agency_logos', 'public');
        }

        // Decode JSON string to array if needed
        if (isset($validated['agency_coordinates']) && is_string($validated['agency_coordinates'])) {
            $validated['agency_coordinates'] = json_decode($validated['agency_coordinates'], true);
        }

        $agency->update($validated);

        // Fix full URL for logo
        if (!Str::startsWith($agency->logo_path, 'https')) {
            $agency->logo_path = Storage::url($agency->logo_path);
        }

        return response()->json($agency->load(['manager', 'vehicles']), 200);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Agency $agency)
    {
        $agency->delete();

        return response()->json(['message' => 'Agency deleted successfully.']);
    }


    public function getMyAgency(Request $request)
    {
        try {
            $agency = $request->user()->agency;

            if (!$agency) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agency not found',
                    'error_code' => 'AGENCY_NOT_FOUND'
                ], 404);
            }

            if (!Str::startsWith($agency->logo_path, 'https')) {
                $agency->logo_path = Storage::url($agency->logo_path);
            }
            return response()->json([
                'success' => true,
                'data' => $agency->load(['manager', 'vehicles'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch agency data',
                'error' => $e->getMessage(),
                'error_code' => 'SERVER_ERROR'
            ], 500);
        }
    }


    public function getPostsByAgency(Request $request)
    {
        try {
            $agency = $request->user()->agency;


            if (!$agency) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agency not found',
                    'error_code' => 'AGENCY_NOT_FOUND'
                ], 404);
            }

            $posts = $agency->posts()
                ->with('vehicle')
                ->get();
            foreach ($posts as $post) {
                if (!Str::startsWith($post->agency->logo_path, 'https')) {
                    $post->agency->logo_path  = Storage::url($post->agency->logo_path);
                }

                $post->vehicle->images = collect($post->vehicle->images)->map(fn($path) => Storage::url($path))->toArray();
            }
            return response()->json([
                'success' => true,
                'data' => $posts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch posts',
                'error' => $e->getMessage(),
                'error_code' => 'SERVER_ERROR'
            ], 500);
        }
    }







    public function getReservationsByAgency(Request $request)
    {
        try {
            $agency = $request->user()->agency;

            if (!$agency) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agency not found',
                    'error_code' => 'AGENCY_NOT_FOUND'
                ], 404);
            }

            $reservations = Reservation::where('agency_id', $agency->id)
                ->with(['vehicle', 'client', 'payment'])
                ->orderBy('pickup_date', 'desc')
                ->get();
            foreach ($reservations as $reservation) {
                if (!Str::startsWith($reservation->agency->logo_path, 'https')) {
                    $reservation->agency->logo_path  = Storage::url($reservation->agency->logo_path);
                }
            }
            return response()->json([
                'success' => true,
                'data' => $reservations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reservations',
                'error' => $e->getMessage(),
                'error_code' => 'SERVER_ERROR'
            ], 500);
        }
    }

    public function getVehiclesByAgency(Request $request)
    {
        try {
            $agency = $request->user()->agency;

            if (!$agency) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agency not found',
                    'error_code' => 'AGENCY_NOT_FOUND'
                ], 404);
            }

            $vehicles = $agency->vehicles()->get();

            foreach ($vehicles as $vehicle) {
                if (!Str::startsWith($vehicle->agency->logo_path, 'https')) {
                    $vehicle->agency->logo_path  = Storage::url($vehicle->agency->logo_path);
                }
                $vehicle->images = collect($vehicle->images)->map(fn($path) => Storage::url($path))->toArray();
            }


            return response()->json([
                'success' => true,
                'data' => $vehicles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vehicles',
                'error' => $e->getMessage(),
                'error_code' => 'SERVER_ERROR'
            ], 500);
        }
    }



    public function getAgencyDashboardData(Request $request)
    {
        try {

            $agency = $request->user()->agency;

            if (!$agency) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agency not found',
                    'error_code' => 'AGENCY_NOT_FOUND'
                ], 404);
            }
            if (!Str::startsWith($agency->logo_path, 'https')) {
                $agency->logo_path  = Storage::url($agency->logo_path);
            }

            $vehicles = $agency->vehicles()->get();

            foreach ($vehicles as $vehicle) {
                $vehicle->images = collect($vehicle->images)->map(fn($path) => Storage::url($path))->toArray();
            }

            $reservations = Reservation::whereIn('vehicle_id', $agency->vehicles->pluck('id'))->with(['vehicle', 'payment'])->get();

            foreach ($reservations as $reservation) {
                $reservation->vehicle->images = collect($reservation->vehicle->images)->map(fn($path) => Storage::url($path))->toArray();
            }


            return response()->json([
                'success' => true,
                'data' => [
                    "vehicles" => $vehicles,
                    "reservations" => $reservations,
                    "agency" => $agency,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch data',
                'error' => $e->getMessage(),
                'error_code' => 'SERVER_ERROR'
            ], 500);
        }
    }
}
