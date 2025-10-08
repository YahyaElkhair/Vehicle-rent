<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\AgencyController;
use App\Http\Controllers\PayPalController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\AdvertisementController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\UserController;

// Route::get('/user', function (Request $request) {
//     return $request->user()->load(['agency', 'comments', 'reservations']);
// })->middleware('auth:sanctum');

Route::apiResource('users', UserController::class);
Route::apiResource('agencies', AgencyController::class);
Route::apiResource('vehicle', VehicleController::class);
Route::apiResource('posts', PostController::class);
Route::apiResource('comment', CommentController::class);
Route::apiResource('advertisements', AdvertisementController::class);
Route::apiResource('payments', PaymentController::class);



Route::controller(AuthController::class)->group(function () {
    Route::post('/register', 'register')->name('auth.register');
    Route::post('/login', 'login')->name('auth.login');

    // Protected routes
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/logout', 'logout')->name('auth.logout');
        Route::get('/user', 'user')->name('auth.user');

        Route::put('/users/{user}/password', 'updatePassword');
    });
});


//PayPal
Route::middleware(['auth:sanctum'])->group(function () {

    Route::controller(PayPalController::class)->group(function () {
        Route::post('paypal/order', 'createOrder');
        Route::post('paypal/capture', 'captureOrder');
    });

    Route::apiResource('reservation', ReservationController::class);
    Route::get('reservations/by-number/{reservationNumber}', [ReservationController::class, 'findByNumber']);
});


Route::controller(AgencyController::class)->group(function () {
    Route::get('agency/my-agency', 'getMyAgency');
    Route::get('agency/vehicles', 'getVehiclesByAgency');
    Route::get('agency/posts', 'getPostsByAgency');
    Route::get('agency/reservations', 'getReservationsByAgency'); // New route
    Route::get('agency/dashboard-data', 'getAgencyDashboardData');
});
