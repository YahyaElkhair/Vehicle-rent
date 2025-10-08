<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory, SoftDeletes;

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
        'five_star_count',
        'four_star_count',
        'three_star_count',
        'two_star_count',
        'one_star_count',
        'total_reviews',
        'slug',
        'meta_title',
        'meta_description'
    ];

    protected $casts = [
        'status' => 'string',
        'delivery_options' => 'array',
        'min_driver_age' => 'integer',
        'min_license_years' => 'integer',
        'view_count' => 'integer',
        'rental_count' => 'integer',
        'average_rating' => 'decimal:1',
        'five_star_count' => 'integer',
        'four_star_count' => 'integer',
        'three_star_count' => 'integer',
        'two_star_count' => 'integer',
        'one_star_count' => 'integer',
        'total_reviews' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

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

    public function advertisements()
    {
        return $this->hasMany(Advertisement::class);
    }

    // 🔹 Scope: status
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

    // 🔹 Scope: vehicle
    public function scopeByVehicleBrand($query, $brand)
    {
        return $query->whereHas('vehicle', function ($q) use ($brand) {
            $q->where('brand', 'like', "%$brand%");
        });
    }

    // 🔹 Scope: popular
    public function scopePopular($query, $minViews = 100)
    {
        return $query->where('view_count', '>=', $minViews)->orderby('view_count', 'desc');
    }

    // 🔹 Scope: delivery option
    public function scopeDeliveryOption($query, $option)
    {
        return $query->where('delivery_options', $option);
    }

    // 🔹 Scope: search keyword
    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'like', "%$keyword%")
                ->orWhere('description', 'like', "%$keyword%");
        });
    }

    // 🔹 Scope: price range
    public function scopePriceBetween($query, $min, $max)
    {
        return $query->whereHas('vehicle', function ($q) use ($min, $max) {
            $q->whereBetween('price_per_day', [$min, $max]);
        });
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
            ->when(isset($filters['min']) && isset($filters['max']), fn($q) => $q->priceBetween($filters['min'], $filters['max']));
    }

    // 🔹 Scope: sorting
    public function scopeSortBy($query, $field = 'created_at', $direction = 'desc')
    {
        return $query->orderBy($field, $direction);
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
                // Corrected: Lower bound = currentYear-3, Upper bound = currentYear-1
                $q->whereBetween('year', [$currentYear - 3, $currentYear - 1]);
            });
        } elseif ($age === '5') {
            // Mature: 3-5 years
            return $query->whereHas('vehicle', function ($q) use ($currentYear) {
                // Corrected: Lower bound = currentYear-5, Upper bound = currentYear-3
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
    public function scopeWithRatingStats($query)
    {
        return $query->withCount([
            'comments as total_reviews',
            'comments as five_star_count' => function ($q) {
                $q->where('rating', 5);
            },
            'comments as four_star_count' => function ($q) {
                $q->where('rating', 4);
            },
            'comments as three_star_count' => function ($q) {
                $q->where('rating', 3);
            },
            'comments as two_star_count' => function ($q) {
                $q->where('rating', 2);
            },
            'comments as one_star_count' => function ($q) {
                $q->where('rating', 1);
            }
        ]);
    }

    public function updateRatingStats()
    {
        // Use only non-deleted comments
        $comments = $this->comments;

        $this->total_reviews = $comments->count();

        // Calculate star counts
        $this->five_star_count = $comments->where('rating', 5)->count();
        $this->four_star_count = $comments->where('rating', 4)->count();
        $this->three_star_count = $comments->where('rating', 3)->count();
        $this->two_star_count = $comments->where('rating', 2)->count();
        $this->one_star_count = $comments->where('rating', 1)->count();

        // Calculate average
        $totalStars = $this->five_star_count * 5
            + $this->four_star_count * 4
            + $this->three_star_count * 3
            + $this->two_star_count * 2
            + $this->one_star_count * 1;

        $this->average_rating = $this->total_reviews > 0
            ? round($totalStars / $this->total_reviews, 1)
            : 0;

        $this->save();
    }
}
