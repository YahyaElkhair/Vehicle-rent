<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reservation extends Model
{
    /** @use HasFactory<\Database\Factories\ReservationFactory> */
    use HasFactory , SoftDeletes;

    protected $fillable = [
        'client_id',
        'agency_id',
        'vehicle_id',
        'reservation_number',
        'pickup_date',
        'return_date',
        'pickup_type',
        'pickup_coordinations',
        'delevry_coordinations',
        'return_coordinations',
        'status',
        'cancelled_at',
        'cancellation_reason',
        'refund_amount',
        'daily_rate',
        'total_amount',
        'discount_amount',
        'delivery_fee',
        'final_amount',
        'additional_equipment',
        'equipment_cost',
        'delivery_coordinations'
    ];

    protected $casts = [
        'pickup_date' => 'datetime',
        'return_date' => 'datetime',
        'pickup_coordinations' => 'array',
        'delevry_coordinations' => 'array',
        'return_coordinations' => 'array',
        'cancelled_at' => 'datetime',
        'daily_rate' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'additional_equipment' => 'array',
        'equipment_cost' => 'decimal:2',
        'refund_amount' => 'decimal:2'
    ];

    public function client(){
        return $this->belongsTo(User::class , 'client_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

}
