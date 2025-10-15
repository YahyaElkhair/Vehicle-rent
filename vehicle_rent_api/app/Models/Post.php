<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'agency_id',
        'vehicle_id',
        'title',
        'description',
        'status',
        'delivery_options',
        'min_driver_age',
        'min_license_years',
        'view_count',
        'rental_count',
        'average_rating',
        'total_reviews',
        'rating_distribution', // ✅ New JSON column
        'slug',
        'meta_title',
        'meta_description'
    ];

    protected $casts = [
        'status' => 'string',
        'delivery_options' => 'array',
        'rating_distribution' => 'array', // ✅ Cast to array
        'min_driver_age' => 'integer',
        'min_license_years' => 'integer',
        'view_count' => 'integer',
        'rental_count' => 'integer',
        'average_rating' => 'decimal:2', // ✅ Changed to 2 decimals
        'total_reviews' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['rating_breakdown']; // ✅ Auto-append to JSON

    // ✅ Relationships
    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function ratings()
    {
        return $this->hasMany(Comment::class)->whereNotNull('rating');
    }

    public function advertisements()
    {
        return $this->hasMany(Advertisement::class);
    }

    // ✅ Accessor: Get formatted rating breakdown for frontend
    public function getRatingBreakdownAttribute()
    {
        $distribution = $this->rating_distribution ?? [];

        return [
            'average' => (float) $this->average_rating,
            'total' => $this->total_reviews,
            'stars' => [
                5 => $distribution['5'] ?? 0,
                4 => $distribution['4'] ?? 0,
                3 => $distribution['3'] ?? 0,
                2 => $distribution['2'] ?? 0,
                1 => $distribution['1'] ?? 0,
            ],
            'percentages' => $this->calculatePercentages($distribution),
        ];
    }

    // ✅ Calculate percentages for rating bars
    private function calculatePercentages($distribution)
    {
        if ($this->total_reviews == 0) {
            return [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        }

        $percentages = [];
        foreach ([5, 4, 3, 2, 1] as $star) {
            $count = $distribution[$star] ?? 0;
            $percentages[$star] = round(($count / $this->total_reviews) * 100, 1);
        }

        return $percentages;
    }

    // ✅ Check if user has already commented/rated
    public function hasUserCommented($userId)
    {
        return $this->comments()->where('user_id', $userId)->exists();
    }

    // ✅ Get user's comment
    public function getUserComment($userId)
    {
        return $this->comments()->where('user_id', $userId)->first();
    }

    // ✅ Update rating statistics (called automatically by Comment model)
    public function updateRatingStats()
    {
        $ratings = $this->comments()
            ->whereNotNull('rating')
            ->pluck('rating');

        if ($ratings->isEmpty()) {
            $this->update([
                'average_rating' => 0.00,
                'total_reviews' => 0,
                'rating_distribution' => null,
            ]);
            return;
        }

        // Calculate distribution
        $distribution = [
            '5' => $ratings->filter(fn($r) => $r == 5)->count(),
            '4' => $ratings->filter(fn($r) => $r == 4)->count(),
            '3' => $ratings->filter(fn($r) => $r == 3)->count(),
            '2' => $ratings->filter(fn($r) => $r == 2)->count(),
            '1' => $ratings->filter(fn($r) => $r == 1)->count(),
        ];

        $this->update([
            'average_rating' => round($ratings->avg(), 2),
            'total_reviews' => $ratings->count(),
            'rating_distribution' => $distribution,
        ]);
    }

    // ✅ SCOPES

    // 🔹 Scope: vehicle status
    public function scopeVehicleStatus($query, $status)
    {
        return $query->whereHas('vehicle', function ($q) use ($status) {
            $q->where('status', $status);
        });
    }

    // 🔹 Scope: min driver age
    public function scopeMinDriverAge($query, $age)
    {
        return $query->where('min_driver_age', '<=', $age);
    }

    // 🔹 Scope: license years
    public function scopeMinLicenseYears($query, $years)
    {
        return $query->where('min_license_years', '<=', $years);
    }

    // 🔹 Scope: agency filter
    public function scopeByAgencyName($query, $agencyName)
    {
        return $query->whereHas('agency', function ($q) use ($agencyName) {
            $q->where('name', 'like', "%$agencyName%");
        });
    }

    // 🔹 Scope: vehicle brand
    public function scopeByVehicleBrand($query, $brand)
    {
        return $query->whereHas('vehicle', function ($q) use ($brand) {
            $q->where('brand', 'like', "%$brand%");
        });
    }

    // 🔹 Scope: popular
    public function scopePopular($query, $minViews = 100)
    {
        return $query->where('view_count', '>=', $minViews)->orderBy('view_count', 'desc');
    }

    // 🔹 Scope: delivery option
    public function scopeDeliveryOption($query, $option)
    {
        return $query->whereJsonContains('delivery_options', $option);
    }

    // 🔹 Scope: search keyword
    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'like', "%$keyword%")
                ->orWhere('description', 'like', "%$keyword%")
                ->orWhereHas('vehicle', function ($vq) use ($keyword) {
                    $vq->where('brand', 'like', "%$keyword%")
                        ->orWhere('model', 'like', "%$keyword%");
                });
        });
    }

    // 🔹 Scope: price range
    public function scopePriceBetween($query, $min, $max)
    {
        return $query->whereHas('vehicle', function ($q) use ($min, $max) {
            $q->whereBetween('price_per_day', [$min, $max]);
        });
    }

    // 🔹 Scope: minimum rating filter
    public function scopeWithMinRating($query, $minRating)
    {
        return $query->where('average_rating', '>=', $minRating)
            ->where('total_reviews', '>', 0);
    }

    // 🔹 Scope: vehicle age
    public function scopeByVehicleAge($query, $age)
    {
        $currentYear = now()->year;

        if ($age === '1') {
            // New: 0-1 year
            return $query->whereHas('vehicle', function ($q) use ($currentYear) {
                $q->where('year', '>=', $currentYear - 1);
            });
        } elseif ($age === '3') {
            // Young: 1-3 years
            return $query->whereHas('vehicle', function ($q) use ($currentYear) {
                $q->whereBetween('year', [$currentYear - 3, $currentYear - 1]);
            });
        } elseif ($age === '5') {
            // Mature: 3-5 years
            return $query->whereHas('vehicle', function ($q) use ($currentYear) {
                $q->whereBetween('year', [$currentYear - 5, $currentYear - 3]);
            });
        } elseif ($age === '5+') {
            // Classic: 5+ years
            return $query->whereHas('vehicle', function ($q) use ($currentYear) {
                $q->where('year', '<', $currentYear - 5);
            });
        } else {
            // Specific age input
            $ageInt = (int)$age;
            return $query->whereHas('vehicle', function ($q) use ($currentYear, $ageInt) {
                $q->where('year', '=', $currentYear - $ageInt);
            });
        }
    }

    // 🔹 Scope: dynamic filter
    public function scopeFilter($query, $filters)
    {
        return $query
            ->when($filters['vehicle_status'] ?? null, fn($q, $status) => $q->vehicleStatus($status))
            ->when($filters['popular'] ?? null, fn($q, $minViews) => $q->popular($minViews))
            ->when($filters['agency_name'] ?? null, fn($q, $agencyName) => $q->byAgencyName($agencyName))
            ->when($filters['brand'] ?? null, fn($q, $brand) => $q->byVehicleBrand($brand))
            ->when($filters['vehicle_age'] ?? null, fn($q, $age) => $q->byVehicleAge($age))
            ->when($filters['license'] ?? null, fn($q, $years) => $q->minLicenseYears($years))
            ->when($filters['delivery'] ?? null, fn($q, $delivery) => $q->deliveryOption($delivery))
            ->when($filters['search'] ?? null, fn($q, $s) => $q->search($s))
            ->when($filters['min_rating'] ?? null, fn($q, $rating) => $q->withMinRating($rating))
            ->when(isset($filters['min']) && isset($filters['max']), fn($q) => $q->priceBetween($filters['min'], $filters['max']));
    }

    // 🔹 Scope: sorting
    public function scopeSortBy($query, $field = 'created_at', $direction = 'desc')
    {
        return $query->orderBy($field, $direction);
    }
}
