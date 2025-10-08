<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    /** @use HasFactory<\Database\Factories\VehicleFactory> */
    use HasFactory;

    protected $fillable = [
        'agency_id',
        'brand',
        'model',
        'year',
        'color',
        'license_plate',
        'vin',
        'mileage',
        'engine_type',
        'transmission',
        'fuel_type',
        'seats',
        'doors',
        'price_per_day',
        'price_per_week',
        'price_per_month',
        'discount_rate',
        'minimum_rental_days',
        'status',
        'description',
        'images',
        'features',
        'delivery_fee_per_km',
        'available_from',
        'available_to',
        'blackout_dates',
        'type'
    ];

    protected $casts = [
        'year' => 'integer',
        'mileage' => 'integer',
        'seats' => 'integer',
        'doors' => 'integer',
        'price_per_day' => 'decimal:2',
        'price_per_week' => 'decimal:2',
        'price_per_month' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'minimum_rental_days' => 'integer',
        'status' => 'string',
        'images' => 'array',
        'features' => 'array',
        'delivery_fee_per_km' => 'decimal:2',
        'available_from' => 'date',
        'available_to' => 'date',
        'blackout_dates' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function agency()
    {
        return $this->belongsTo(Agency::class, 'agency_id');
    }

    public function post()
    {
        return $this->hasOne(Post::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }



    // app/Models/Vehicle.php
    public function scopeFilter($query, array $filters)
    {
        $query->when(
            $filters['search'] ?? false,
            fn($query, $search) =>
            $query->where(
                fn($query) =>
                $query->where('brand', 'like', '%' . $search . '%')
                    ->orWhere('model', 'like', '%' . $search . '%')
            )
        );

        $query->when(
            $filters['brand'] ?? false,
            fn($query, $brand) =>
            $query->where('brand', $brand)
        );

        $query->when(
            $filters['min'] ?? false,
            fn($query, $min) =>
            $query->where('price_per_day', '>=', $min)
        );

        $query->when(
            $filters['max'] ?? false,
            fn($query, $max) =>
            $query->where('price_per_day', '<=', $max)
        );

        $query->when(
            $filters['transmission'] ?? false,
            fn($query, $transmission) =>
            $query->where('transmission_type', $transmission)
        );

        $query->when(
            $filters['fuel'] ?? false,
            fn($query, $fuel) =>
            $query->where('fuel_type', $fuel)
        );
    }
}
