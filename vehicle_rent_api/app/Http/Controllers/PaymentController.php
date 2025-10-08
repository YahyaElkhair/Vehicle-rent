<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index()
    {
        return Payment::with('reservation')->paginate(10);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reservation_id' => 'required|exists:reservations,id',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'required|string|size:3',
            'transaction_id' => 'required|string',
            'details' => 'sometimes|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if reservation exists
            $reservation = Reservation::findOrFail($request->reservation_id);

            // Create payment
            $payment = Payment::create([
                'reservation_id' => $request->reservation_id,
                'payment_method' => 'paypal',
                'amount' => $request->amount,
                'currency' => strtoupper($request->currency),
                'status' => Payment::STATUS_COMPLETED,
                'transaction_id' => $request->transaction_id,
                'details' => $request->details ?? []
            ]);

            // Update reservation status
            $reservation->update(['status' => 'confirmed']);

            return response()->json([
                'message' => 'Payment created successfully',
                'data' => $payment
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Payment creation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        return Payment::with('reservation')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:CREATED,COMPLETED,APPROVED,FAILED,REFUNDED',
            'details' => 'sometimes|array'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $payment->update($request->only(['status', 'details']));

        return response()->json([
            'message' => 'Payment updated successfully',
            'data' => $payment
        ]);
    }

    public function destroy($id)
    {
        $payment = Payment::findOrFail($id);
        $payment->delete();

        return response()->json([
            'message' => 'Payment deleted successfully'
        ], 204);
    }


    public function getByAgency(Request $req)
    {
        $agency = $req->user()->agency;

        $payments = Payment::whereHas('reservation', function ($query) use ($agency) {
            $query->where('agency_id', $agency->id);
        })
            ->with('reservation.vehicle')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($payments);
    }

    
}
