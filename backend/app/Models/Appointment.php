<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Appointment extends Model
{
    /** @use HasFactory<\Database\Factories\AppointmentFactory> */
    use HasFactory;

    public const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

    // Fixed daily time slots a customer can choose from (hourly, 09:00–17:00).
    public const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    protected $fillable = ['user_id', 'service_id', 'appointment_date', 'appointment_time', 'status', 'notes', 'notification_sent_at'];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date:Y-m-d', // JSON shows "2026-12-01" instead of a full timestamp
            'notification_sent_at' => 'datetime', // when the confirmation email was sent (null = not sent)
        ];
    }

    // An appointment belongs to one user (the customer)...
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ...and to one service.
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Has this date + time already passed? (e.g. 13:00 today when it's now 16:30)
     * Uses the app time zone (config/app.php → Asia/Dubai).
     */
    public static function slotInPast(string $date, string $time): bool
    {
        return now()->greaterThanOrEqualTo(Carbon::parse("$date $time"));
    }

    /**
     * Duplicate-booking rule: is this SERVICE already booked at this date + time?
     * Different services may run in parallel. Cancelled bookings don't block the slot.
     */
    public static function slotTaken(int $serviceId, string $date, string $time): bool
    {
        return static::where('service_id', $serviceId)
            ->whereDate('appointment_date', $date)
            ->where('appointment_time', $time)
            ->where('status', '!=', 'cancelled')
            ->exists();
    }
}
