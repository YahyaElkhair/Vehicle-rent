<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Type\Decimal;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'payment_method',
        'amount',
        'currency',
        'status',
        'transaction_id',
        'details'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'details' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Status constants
    const STATUS_CREATED = 'CREATED';
    const STATUS_COMPLETED = 'COMPLETED';
    const STATUS_APPROVED = 'APPROVED';
    const STATUS_FAILED = 'FAILED';
    const STATUS_REFUNDED = 'REFUNDED';

    // Payment methods
    const METHOD_PAYPAL = 'paypal';
    const METHOD_STRIPE = 'stripe';
    const METHOD_CASH = 'cash';

    /**
     * Relationship to Reservation
     */
    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    /**
     * Check if payment is successful
     */
    public function isSuccessful()
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_APPROVED]);
    }

    /**
     * Get formatted amount with currency
     */
    public function getFormattedAmountAttribute()
    {
        return $this->currency . ' ' . number_format( $this->amount, 2);
    }
}