<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Payment;
use App\Models\Advertisement;
use Illuminate\Http\Request;
use Srmklive\PayPal\Services\PayPal as PayPalClient;

class PayPalController extends Controller
{
    // public function createOrder(Request $request)
    // {
    //     $request->validate([
    //         'type' => 'required|in:reservation,advertisement',
    //         'reservation_id' => 'required_if:type,reservation|exists:reservations,id',
    //         'post_id' => 'required_if:type,advertisement|exists:posts,id',
    //         'duration_days' => 'required_if:type,advertisement|integer|min:1'
    //     ]);

    //     if ($request->type === 'reservation') {
    //         return $this->handleReservationOrder($request);
    //     }

    //     return $this->handleAdvertisementOrder($request);
    // }

    // private function handleReservationOrder(Request $request)
    // {
    //     $reservation = Reservation::findOrFail($request->reservation_id);
    //     $provider = new PayPalClient;
    //     $provider->setApiCredentials(config('paypal'));
    //     $token = $provider->getAccessToken();
    //     $provider->setAccessToken($token);

    //     $order = $provider->createOrder([
    //         "intent" => "CAPTURE",
    //         "purchase_units" => [[
    //             "reference_id" => 'reservation_' . $reservation->id,
    //             "description" => 'Vehicle Reservation #' . $reservation->reservation_number,
    //             "amount" => [
    //                 "currency_code" => "USD",
    //                 "value" => number_format($reservation->final_amount, 2, '.', ''),
    //             ]
    //         ]],
    //         "application_context" => [
    //             "cancel_url" => route('payment.cancel'),
    //             "return_url" => route('payment.success')
    //         ]
    //     ]);

    //     if (isset($order['id']) && $order['id']) {
    //         return response()->json([
    //             'orderID' => $order['id'],
    //             'approveUrl' => collect($order['links'])->firstWhere('rel', 'approve')['href'],
    //         ]);
    //     }

    //     return response()->json(['error' => 'Failed to create PayPal order'], 500);
    // }

    // private function handleAdvertisementOrder(Request $request)
    // {
    //     // Existing advertisement logic (unchanged)
    //     // ...
    // }

    // public function captureOrder(Request $request)
    // {
    //     $request->validate([
    //         'type' => 'required|in:reservation,advertisement',
    //         'orderID' => 'required',
    //         'reservation_id' => 'required_if:type,reservation|exists:reservations,id',
    //         'post_id' => 'required_if:type,advertisement|exists:posts,id',
    //         'duration_days' => 'required_if:type,advertisement|integer|min:1',
    //         'method' => 'required|in:store,update',
    //         'advertisement_id' => 'required_if:type,advertisement,method,update|exists:advertisements,id',
    //     ]);

    //     if ($request->type === 'reservation') {
    //         return $this->captureReservationOrder($request);
    //     }

    //     return $this->captureAdvertisementOrder($request);
    // }

    // private function captureReservationOrder(Request $request)
    // {
    //     $provider = new PayPalClient;
    //     $provider->setApiCredentials(config('paypal'));
    //     $token = $provider->getAccessToken();
    //     $provider->setAccessToken($token);

    //     $response = $provider->capturePaymentOrder($request->orderID);

    //     if ($response['status'] === 'COMPLETED') {
    //         $reservation = Reservation::find($request->reservation_id);
    //         $reservation->update(['status' => 'paid']);

    //         Payment::create([
    //             'reservation_id' => $reservation->id,
    //             'amount' => $reservation->final_amount,
    //             'status' => $response['status'],
    //             'transaction_id' => $response['id'],
    //             'details' => $response,
    //         ]);

    //         return response()->json([
    //             'status' => 'success',
    //             'reservation' => $reservation
    //         ]);
    //     }

    //     return response()->json(['error' => 'Payment failed'], 400);
    // }

    // private function captureAdvertisementOrder(Request $request)
    // {
    //     // Existing advertisement logic (unchanged)
    //     // ...
    // }
}