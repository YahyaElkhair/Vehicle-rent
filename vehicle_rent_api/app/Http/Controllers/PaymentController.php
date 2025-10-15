<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

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
        try {
            $validated = $request->validate([
                'reservation_id' => 'required|exists:reservations,id',
                'payment_method' => 'required|in:credit_card,paypal,cash',
                'amount' => 'required|numeric|min:0',
                'currency' => 'string|max:3',
                'status' => 'required|in:CREATED,COMPLETED,APPROVED,FAILED,REFUNDED',
                'transaction_id' => 'nullable|string',
                'details' => 'nullable|array'
            ]);

            // Start transaction
            DB::beginTransaction();

            // Create payment
            $payment = Payment::create($validated);

            // Update reservation status based on payment method
            $reservation = Reservation::find($validated['reservation_id']);

            if ($validated['payment_method'] === 'cash') {
                // For cash payments, set status to confirmed (waiting for payment at pickup)
                $reservation->update(['status' => 'confirmed']);
            } elseif (in_array($validated['status'], ['COMPLETED', 'APPROVED'])) {
                // For online payments that are completed, set to paid
                $reservation->update(['status' => 'paid']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment created successfully',
                'data' => $payment->load('reservation')
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment details
     */
    public function show($id)
    {
        try {
            $payment = Payment::with('reservation')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $payment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:CREATED,COMPLETED,APPROVED,FAILED,REFUNDED',
                'details' => 'nullable|array'
            ]);

            $payment = Payment::findOrFail($id);

            DB::beginTransaction();

            $payment->update($validated);

            // Update reservation status if payment is completed
            if (in_array($validated['status'], ['COMPLETED', 'APPROVED'])) {
                $payment->reservation->update(['status' => 'paid']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment status updated',
                'data' => $payment->fresh()
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment status',
                'error' => $e->getMessage()
            ], 500);
        }
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
