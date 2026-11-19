<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    /** @use HasFactory<\Database\Factories\ServiceFactory> */
    use HasFactory;

    // Columns that may be filled from request data (protects against unexpected fields).
    protected $fillable = ['name', 'description', 'duration_minutes', 'price', 'is_active'];

    // Return these as proper number/boolean types in JSON instead of strings.
    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
            'price' => 'float',
            'is_active' => 'boolean',
        ];
    }

    // A service has many appointments.
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
