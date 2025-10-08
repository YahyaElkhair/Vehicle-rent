<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ReservationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $reservations = Reservation::with(['client', 'payment', 'vehicle.agency'])
            ->where('client_id', Auth::id())
            ->latest()
            ->paginate(10);


        foreach ($reservations as $reservation) {
            $reservation->vehicle->images = collect($reservation->vehicle->images)->map(fn($path) => Storage::url($path))->toArray();
            $reservation->vehicle->agency->logo_path = Storage::url($reservation->vehicle->agency->logo_path);
        }

        return response()->json($reservations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'agency_id' => 'required|exists:agencies,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'pickup_date' => 'required|date|after_or_equal:' . now()->toDateString(),
            'return_date' => 'required|date|after:pickup_date',
            'pickup_type' => 'nullable|in:self pickup,delivery',
            'pickup_coordinations' => 'nullable',
            'delevry_coordinations' => 'nullable',
            'return_coordinations' => 'nullable',
            'daily_rate' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'delivery_fee' => 'nullable|numeric|min:0',
            'final_amount' => 'required|numeric|min:0',
            'additional_equipment' => 'nullable',
            'equipment_cost' => 'nullable|numeric|min:0',
        ]);

        $validated['reservation_number'] = 'RES-' . Str::upper(Str::random(8));

        $reservation = $request->user()->reservations()->create($validated);

        return response()->json([
            'message' => 'Reservation created successfully',
            'data' => $reservation->load('vehicle')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Reservation $reservation): JsonResponse
    {
        // if ($reservation->client_id !== Auth::id()) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }
        $reservation = $reservation->load(['client', 'payment', 'vehicle.agency']);
        $reservation->vehicle->images = collect($reservation->vehicle->images)->map(fn($path) => Storage::url($path))->toArray();
        $reservation->vehicle->agency->logo_path = Storage::url($reservation->vehicle->agency->logo_path);

        return response()->json($reservation);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Reservation $reservation): JsonResponse
    {
        // if ($reservation->client_id !== Auth::id()) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        // if ($reservation->status !== 'pending') {
        //     return response()->json([
        //         'message' => 'Only pending reservations can be modified'
        //     ], 400);
        // }


        $validated = $request->validate([
            'pickup_date' => 'sometimes|date|after:now',
            'return_date' => 'sometimes|date|after:pickup_date',
            'pickup_type' => 'sometimes|in:self pickup,delivery',
            'pickup_coordinations' => 'sometimes|json',
            'delevry_coordinations' => 'sometimes|json',
            'return_coordinations' => 'sometimes|json',
            'daily_rate' => 'sometimes|numeric|min:0',
            'total_amount' => 'sometimes|numeric|min:0',
            'discount_amount' => 'sometimes|numeric|min:0',
            'delivery_fee' => 'sometimes|numeric|min:0',
            'final_amount' => 'sometimes|numeric|min:0',
            'additional_equipment' => 'sometimes|json',
            'equipment_cost' => 'sometimes|numeric|min:0'
        ]);

        $reservation->update($validated);

        return response()->json([
            'message' => 'Reservation updated successfully',
            'data' => $reservation
        ]);
    }

    /**
     * Cancel the specified reservation.
     */
    public function destroy(Request $request, $reservation): JsonResponse
    {
        // if ($reservation->client_id !== Auth::id()) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        // if (!in_array($reservation->status, ['pending', 'confirmed'])) {
        //     return response()->json([
        //         'message' => 'Only pending or confirmed reservations can be cancelled'
        //     ], 400);
        // }

        try {
            $reservation = Reservation::findOrFail($reservation);
            $validated = $request->validate([
                'cancellation_reason' => 'nullable|string'
            ]);

            $reservation->update([
                'status' => 'cancelled',
                'cancellation_reason' => isset($validated['cancellation_reason']) ? $validated['cancellation_reason'] : null
            ]);

            $reservation->delete();

            return response()->json([
                'message' => 'Reservation cancelled successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Reservation not found !']);
        }
    }

    /**
     * Get reservation by reservation number
     */
    public function findByNumber(string $reservationNumber): JsonResponse
    {
        try {
            $reservation = Reservation::with(['client', 'payment', 'vehicle.agency'])
                ->where('reservation_number', $reservationNumber)
                ->where('client_id', Auth::id())
                ->firstOrFail();
            $reservation->vehicle->images = collect($reservation->vehicle->images)->map(fn($path) => Storage::url($path))->toArray();
            $reservation->vehicle->agency->logo_path = Storage::url($reservation->vehicle->agency->logo_path);

            return response()->json($reservation);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'No reservation found for the given number !']);
        }
    }


    public function getByAgency($agencyId)
    {
        $reservations = Reservation::where('agency_id', $agencyId)
            ->with(['vehicle', 'client', 'payment'])
            ->orderBy('pickup_date', 'desc')
            ->get();

        return response()->json($reservations);
    }

}
