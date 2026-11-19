<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AppointmentController extends Controller
{
    // GET /api/appointments
    // Customer → only their own. Admin → everyone's. Optional filters: ?status= and ?date=
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Appointment::with(['service', 'user:id,name,email,phone']) // load related rows in one go
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time');

        if (! $user->isAdmin()) {
            $query->where('user_id', $user->id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('date')) {
            $query->whereDate('appointment_date', $request->query('date'));
        }

        return response()->json(['data' => $query->get()]);
    }

    // GET /api/appointments/{appointment}
    public function show(Request $request, Appointment $appointment)
    {
        $this->ensureCanAccess($request, $appointment);

        return response()->json(['data' => $appointment->load(['service', 'user:id,name,email,phone'])]);
    }

    // POST /api/appointments — book a slot
    public function store(Request $request)
    {
        $data = $request->validate([
            // must be an existing AND active service
            'service_id' => ['required', 'integer', Rule::exists('services', 'id')->where('is_active', true)],
            'appointment_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'appointment_time' => ['required', Rule::in(Appointment::TIME_SLOTS)],
            'notes' => 'nullable|string|max:1000',
        ], [
            'service_id.exists' => 'This service does not exist or is not available.',
            'appointment_time.in' => 'Please choose one of the available time slots (09:00 to 17:00, on the hour).',
        ]);

        // Today's date is allowed, but not a time that has already passed (e.g. 13:00 when it's 16:30).
        if (Appointment::slotInPast($data['appointment_date'], $data['appointment_time'])) {
            throw ValidationException::withMessages([
                'appointment_time' => 'This time has already passed. Choose a later time.',
            ]);
        }

        // Check + insert inside ONE transaction. lockForUpdate() locks this service's row,
        // so if two people book the same slot at the same instant, the second request
        // waits for the first to finish, then sees the slot is taken.
        $appointment = DB::transaction(function () use ($data, $request) {
            Service::whereKey($data['service_id'])->lockForUpdate()->first();

            if (Appointment::slotTaken($data['service_id'], $data['appointment_date'], $data['appointment_time'])) {
                return null;
            }

            return Appointment::create([
                ...$data,
                'user_id' => $request->user()->id,
                'status' => 'pending',
            ]);
        });

        if (! $appointment) {
            // 409 Conflict = the request is valid, but clashes with existing data.
            return response()->json([
                'message' => 'This time slot is already booked. Please choose another time.',
                'errors' => ['appointment_time' => ['This time slot is already booked.']],
            ], 409);
        }

        $appointment->load(['service', 'user:id,name,email,phone']);

        // Tell the Node.js service so it creates the confirmation notification,
        // and remember when it was sent so the booking page can show it later.
        $notified = $this->sendBookingNotification($appointment);
        if ($notified) {
            $appointment->update(['notification_sent_at' => now()]);
        }

        return response()->json([
            'message' => 'Appointment booked successfully.',
            'data' => $appointment,
            'notification_sent' => $notified,
        ], 201);
    }

    // PATCH /api/appointments/{appointment}/status
    // Admin → any status. Customer → may only cancel their own booking.
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $this->ensureCanAccess($request, $appointment);

        $data = $request->validate([
            'status' => ['required', Rule::in(Appointment::STATUSES)],
        ]);

        if (! $request->user()->isAdmin() && $data['status'] !== 'cancelled') {
            return response()->json(['message' => 'Customers can only cancel their bookings.'], 403);
        }

        $appointment->update(['status' => $data['status']]);

        return response()->json([
            'message' => 'Appointment status updated.',
            'data' => $appointment->load(['service', 'user:id,name,email,phone']),
        ]);
    }

    // Admins can access any appointment; customers only their own (else 403).
    private function ensureCanAccess(Request $request, Appointment $appointment): void
    {
        $user = $request->user();
        abort_unless($user->isAdmin() || $appointment->user_id === $user->id, 403, 'This is not your appointment.');
    }

    /**
     * POST the booking to the Node.js notification service.
     * Returns true if Node accepted it. If Node is down or errors, we log a warning
     * and return false — the booking itself is already saved and must not fail.
     */
    private function sendBookingNotification(Appointment $appointment): bool
    {
        try {
            $response = Http::timeout(3)
                ->withHeaders(['X-Service-Key' => config('services.notification.key')])
                ->post(config('services.notification.url').'/notifications', [
                    'appointment_id' => $appointment->id,
                    'customer_name' => $appointment->user->name,
                    'customer_email' => $appointment->user->email,
                    'service_name' => $appointment->service->name,
                    'appointment_date' => $appointment->appointment_date->format('Y-m-d'),
                    'appointment_time' => $appointment->appointment_time,
                ]);

            if ($response->successful()) {
                Log::info("Confirmation email sent for booking #{$appointment->id} to {$appointment->user->email}");
            } else {
                Log::warning("Notification service returned {$response->status()} for booking #{$appointment->id}", ['body' => $response->body()]);
            }

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning("Notification service unreachable for booking #{$appointment->id}: ".$e->getMessage());

            return false;
        }
    }
}
