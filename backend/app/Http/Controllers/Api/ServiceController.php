<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    // GET /api/services — public list of active services.
    // An admin can add ?all=1 to also see hidden (inactive) ones.
    public function index(Request $request)
    {
        $query = Service::orderBy('name');

        // This route is public, so we check the token "optionally" with the sanctum guard.
        $isAdmin = $request->user('sanctum')?->isAdmin();
        if (! ($isAdmin && $request->boolean('all'))) {
            $query->where('is_active', true);
        }

        return response()->json(['data' => $query->get()]);
    }

    // GET /api/services/{service} — one service.
    // {service} is turned into a Service model automatically (route model binding);
    // a non-existent id returns 404 by itself.
    public function show(Request $request, Service $service)
    {
        $this->hideDisabledFromCustomers($request, $service);

        return response()->json(['data' => $service]);
    }

    // GET /api/services/{service}/availability?date=YYYY-MM-DD
    // Every time slot for that day, marked available or not.
    public function availability(Request $request, Service $service)
    {
        $this->hideDisabledFromCustomers($request, $service);

        $data = $request->validate(['date' => 'required|date_format:Y-m-d']);

        // Times already booked (not cancelled) for this service on this date.
        $taken = Appointment::where('service_id', $service->id)
            ->whereDate('appointment_date', $data['date'])
            ->where('status', '!=', 'cancelled')
            ->pluck('appointment_time')
            ->all();

        // A slot is free if nobody booked it and it hasn't already passed (today's earlier times).
        $slots = array_map(fn ($time) => [
            'time' => $time,
            'available' => ! in_array($time, $taken) && ! Appointment::slotInPast($data['date'], $time),
        ], Appointment::TIME_SLOTS);

        return response()->json(['date' => $data['date'], 'slots' => $slots]);
    }

    // POST /api/services (admin)
    public function store(Request $request)
    {
        $service = Service::create($this->validateService($request));

        return response()->json(['message' => 'Service created.', 'data' => $service], 201);
    }

    // PUT /api/services/{service} (admin) — send only the fields you want to change
    public function update(Request $request, Service $service)
    {
        $service->update($this->validateService($request, isUpdate: true));

        return response()->json(['message' => 'Service updated.', 'data' => $service]);
    }

    // DELETE /api/services/{service} (admin)
    public function destroy(Service $service)
    {
        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }

    // A disabled service behaves like it doesn't exist (404) for everyone except admins.
    private function hideDisabledFromCustomers(Request $request, Service $service): void
    {
        abort_if(! $service->is_active && ! $request->user('sanctum')?->isAdmin(), 404);
    }

    // Shared validation for create + update.
    // On update, "sometimes" = only validate a field if it was sent.
    private function validateService(Request $request, bool $isUpdate = false): array
    {
        $required = $isUpdate ? 'sometimes' : 'required';

        return $request->validate([
            'name' => "$required|string|max:255",
            'description' => 'nullable|string|max:2000',
            'duration_minutes' => "$required|integer|min:5|max:480",
            'price' => "$required|numeric|min:0",
            'is_active' => 'sometimes|boolean',
        ]);
    }
}
