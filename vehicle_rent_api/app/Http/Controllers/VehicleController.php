<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\Agency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VehicleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    /**
     * Display a listing of vehicles.
     */
    public function index(Request $request)
    {

        $vehicles = Vehicle::filter($request->only([
            'search',
            'brand',
            'min',
            'max',
            'transmission',
            'fuel'
        ]))->get();

        foreach ($vehicles as $vehicle) {
            // Convert image paths to URLs
            $vehicle->images = collect($vehicle->images)->map(fn($path) => Storage::url($path))->toArray();
        }

        return response()->json($vehicles);
    }

    /**
     * Store a newly created vehicle.
     */
    public function store(Request $request)
    {

        try {
            $validated = $request->validate([
                'brand' => 'required|string|max:255',
                'model' => 'required|string|max:255',
                'year' => 'required|integer|min:1900|max:' . now()->year,
                'color' => 'required|string|max:100',
                'license_plate' => 'required|string|unique:vehicles,license_plate',
                'vin' => 'required|string|unique:vehicles,vin',
                'mileage' => 'required|integer|min:0',
                'engine_type' => 'required|string|max:50',
                'transmission' => 'required|string|max:50',
                'fuel_type' => 'required|string|max:50',
                'seats' => 'required|integer|min:1',
                'doors' => 'required|integer|min:1',
                'price_per_day' => 'required|numeric|min:0',
                'price_per_week' => 'nullable|numeric|min:0',
                'price_per_month' => 'nullable|numeric|min:0',
                'discount_rate' => 'nullable|numeric|between:0,100',
                'minimum_rental_days' => 'required|integer|min:1',
                'status' => 'required|string|in:available,not_available,rented,maintenance',
                'description' => 'nullable|string',
                'images' => 'required|array|min:1',
                'images.*' => 'file|image|mimes:jpg,jpeg,png,webp|max:5048',
                'features' => 'nullable|array',
                'delivery_fee_per_km' => 'nullable|numeric|min:0',
                'available_from' => 'required|date|after_or_equal:today',
                'available_to' => 'nullable|date|after:available_from',
                'blackout_dates' => 'nullable|array',
                'blackout_dates.*' => 'date'
            ]);

            $agency = $request->user()->agency;
            if (!$agency) {
                return response()->json(['message' => 'You must create an agency befor adding vehicles !'], 403);
            }

            // Handle image uploads
            $imagePaths = [];
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = $image->store('vehicles', 'public');
                    $imagePaths[] = $path;
                }
                $validated['images'] = $imagePaths;
            }

            $vehicle = $agency->vehicles()->create($validated);

            // Convert image paths to URLs
            // $vehicle->images = collect($vehicle->images)->map(fn($path) => Storage::url($path))->toArray();

            // $vehicle = $vehicle->load('agency');
            // $vehicle->agency->logo_path = Storage::url($vehicle->agency->logo_path);

            return response()->json([
                'message' => 'Vehicle created successfully',
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Server Error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified vehicle.
     */
    public function show(Vehicle $vehicle)
    {
        $vehicle->images = collect($vehicle->images)->map(fn($path) => Storage::url($path))->toArray();
        return $vehicle->load('agency');
    }

    /**
     * Update the specified vehicle.
     */
    public function update(Request $request, Vehicle $vehicle)
    {
        try {
            $validated = $request->validate([
                'brand' => 'sometimes|string|max:255',
                'model' => 'sometimes|string|max:255',
                'year' => 'sometimes|integer|min:1900|max:' . now()->year,
                'color' => 'sometimes|string|max:100',
                'license_plate' => 'sometimes|string|unique:vehicles,license_plate,' . $vehicle->id,
                'vin' => 'sometimes|string|unique:vehicles,vin,' . $vehicle->id,
                'mileage' => 'sometimes|integer|min:0',
                'engine_type' => 'sometimes|string|max:50',
                'transmission' => 'sometimes|string|max:50',
                'fuel_type' => 'sometimes|string|max:50',
                'seats' => 'sometimes|integer|min:1',
                'doors' => 'sometimes|integer|min:1',
                'price_per_day' => 'sometimes|numeric|min:0',
                'price_per_week' => 'nullable|numeric|min:0',
                'price_per_month' => 'nullable|numeric|min:0',
                'discount_rate' => 'nullable|numeric|between:0,100',
                'minimum_rental_days' => 'sometimes|integer|min:1',
                'status' => 'sometimes|string|in:available,not_available,rented,maintenance',
                'description' => 'nullable|string',
                'features' => 'nullable|array',
                'delivery_fee_per_km' => 'nullable|numeric|min:0',
                'available_from' => 'sometimes|date',
                'available_to' => 'nullable|date|after:available_from',
                'blackout_dates' => 'nullable|array',
                'blackout_dates.*' => 'date'
            ]);

            // Handle image updates
            $storageUrl = Storage::url('');
            $finalImages = [];

            // Process existing images
            $existingImages = $request->input('images', []);
            foreach ($existingImages as $image) {
                // Convert URL to storage path if needed
                if (Str::startsWith($image, $storageUrl)) {
                    $finalImages[] = Str::after($image, $storageUrl);
                } else {
                    $finalImages[] = $image;
                }
            }

            // Process new images
            if ($request->hasFile('new_images')) {
                foreach ($request->file('new_images') as $image) {
                    $path = $image->store('vehicles', 'public');
                    $finalImages[] = $path;
                }
            }

            // Delete images that were removed
            $imagesToDelete = array_diff($vehicle->images, $finalImages);
            foreach ($imagesToDelete as $oldImage) {
                Storage::disk('public')->delete($oldImage);
            }

            $validated['images'] = $finalImages;

            // Update vehicle
            $vehicle->update($validated);

            // Convert image paths to URLs for response
            $vehicle->images = collect($vehicle->images)->map(fn($path) => Storage::url($path))->toArray();

            return response()->json([
                'message' => 'Vehicle updated successfully',
                'vehicle' => $vehicle->load('agency'),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Server Error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified vehicle.
     */
    public function destroy(Vehicle $vehicle)
    {
        // Delete associated images
        foreach ($vehicle->images as $image) {
            Storage::disk('public')->delete($image);
        }

        $vehicle->delete();

        return response()->json([
            'message' => 'Vehicle deleted successfully'
        ]);
    }






    // Add to VehicleController.php
    public function getByAgency($agencyId)
    {
        $vehicles = Vehicle::where('agency_id', $agencyId)
            ->with('agency')
            ->get();

        // Convert image paths to URLs
        $vehicles->transform(function ($vehicle) {
            $vehicle->images = collect($vehicle->images)
                ->map(fn($path) => Storage::url($path))
                ->toArray();
            return $vehicle;
        });

        return response()->json($vehicles);
    }
}
