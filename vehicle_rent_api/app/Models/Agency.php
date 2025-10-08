<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agency extends Model
{
    /** @use HasFactory<\Database\Factories\AgencyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'registration_number',
        'email',
        'phone',
        'description',
        'logo_path',
        'is_active',
        'agency_coordinates',
        'manager_id'
    ];


    protected $casts = [
        'agency_coordinates' => 'array',
    ];

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }


    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}
