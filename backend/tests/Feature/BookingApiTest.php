<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * API tests covering the Task 6 checklist.
 * Run: php artisan test
 *
 * - Uses an in-memory SQLite database (phpunit.xml), never your MySQL data.
 * - RefreshDatabase = every test starts with empty tables.
 * - Http::fake() replaces the real Node service, so Node doesn't need to run.
 */
class BookingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Fake Node service (no real network call), answering like the real one:
        // POST /notifications → 201 created, GET /notifications → the log.
        Http::fake(fn ($request) => $request->method() === 'POST'
            ? Http::response(['message' => 'Notification created.'], 201)
            : Http::response(['data' => [['id' => 1, 'subject' => 'Booking confirmed']], 'count' => 1], 200));
    }

    private function tomorrow(): string
    {
        return now()->addDay()->format('Y-m-d');
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    // ---------- Authentication ----------

    public function test_customer_can_register_and_then_login(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertCreated()
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonStructure(['token']);

        $this->postJson('/api/login', ['email' => 'jane@example.com', 'password' => 'secret123'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);
    }

    public function test_login_with_wrong_password_fails(): void
    {
        User::factory()->create(['email' => 'jane@example.com', 'password' => 'secret123']);

        $this->postJson('/api/login', ['email' => 'jane@example.com', 'password' => 'wrong-pass'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'The email or password is incorrect.');
    }

    // ---------- Booking ----------

    public function test_customer_can_book_and_laravel_notifies_node(): void
    {
        $customer = User::factory()->create();
        $service = Service::factory()->create(['name' => 'Haircut']);

        $this->actingAs($customer)->postJson('/api/appointments', [
            'service_id' => $service->id,
            'appointment_date' => $this->tomorrow(),
            'appointment_time' => '10:00',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('notification_sent', true);

        $this->assertDatabaseHas('appointments', ['user_id' => $customer->id, 'appointment_time' => '10:00']);
        $this->assertNotNull(Appointment::first()->notification_sent_at); // remembered for the details page

        // Check exactly what Laravel sent to the Node service.
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/notifications')
            && $request->hasHeader('X-Service-Key')
            && $request['service_name'] === 'Haircut'
            && $request['customer_email'] === $customer->email
            && $request['appointment_time'] === '10:00');
    }

    public function test_duplicate_booking_for_same_service_date_and_time_is_rejected(): void
    {
        $service = Service::factory()->create();
        $slot = ['service_id' => $service->id, 'appointment_date' => $this->tomorrow(), 'appointment_time' => '11:00'];

        $this->actingAs(User::factory()->create())->postJson('/api/appointments', $slot)->assertCreated();

        $this->actingAs(User::factory()->create())->postJson('/api/appointments', $slot)
            ->assertStatus(409)
            ->assertJsonPath('message', 'This time slot is already booked. Please choose another time.');

        $this->assertDatabaseCount('appointments', 1);
    }

    public function test_different_service_at_same_date_and_time_is_allowed(): void
    {
        $first = Service::factory()->create();
        $second = Service::factory()->create();
        $customer = User::factory()->create();

        foreach ([$first, $second] as $service) {
            $this->actingAs($customer)->postJson('/api/appointments', [
                'service_id' => $service->id,
                'appointment_date' => $this->tomorrow(),
                'appointment_time' => '12:00',
            ])->assertCreated();
        }

        $this->assertDatabaseCount('appointments', 2);
    }

    public function test_cancelled_slot_can_be_booked_again(): void
    {
        $cancelled = Appointment::factory()->create(['status' => 'cancelled', 'appointment_time' => '13:00']);

        $this->actingAs(User::factory()->create())->postJson('/api/appointments', [
            'service_id' => $cancelled->service_id,
            'appointment_date' => $cancelled->appointment_date->format('Y-m-d'),
            'appointment_time' => '13:00',
        ])->assertCreated();
    }

    public function test_booking_still_succeeds_when_node_service_is_down(): void
    {
        // Every HTTP call now fails as if Node were not running.
        Http::fake(fn () => throw new ConnectionException('Connection refused'));

        $this->actingAs(User::factory()->create())->postJson('/api/appointments', [
            'service_id' => Service::factory()->create()->id,
            'appointment_date' => $this->tomorrow(),
            'appointment_time' => '09:00',
        ])->assertCreated()
            ->assertJsonPath('notification_sent', false);

        $this->assertDatabaseCount('appointments', 1);
        $this->assertNull(Appointment::first()->notification_sent_at);
    }

    public function test_booking_validation_errors(): void
    {
        Service::factory()->create(['is_active' => false]); // hidden service can't be booked either

        $this->actingAs(User::factory()->create())->postJson('/api/appointments', [
            'service_id' => 999,
            'appointment_date' => '2020-01-01',
            'appointment_time' => '10:30',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['service_id', 'appointment_date', 'appointment_time']);
    }

    public function test_guest_cannot_book(): void
    {
        $this->postJson('/api/appointments', [])->assertUnauthorized();
    }

    // ---------- Status updates ----------

    public function test_admin_can_update_status_but_customer_cannot_confirm(): void
    {
        $appointment = Appointment::factory()->create();

        $this->actingAs($appointment->user)
            ->patchJson("/api/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertForbidden();

        $this->actingAs($this->admin())
            ->patchJson("/api/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->actingAs($this->admin())
            ->patchJson("/api/appointments/{$appointment->id}/status", ['status' => 'done'])
            ->assertStatus(422);
    }

    public function test_customer_can_cancel_own_booking_but_not_someone_elses(): void
    {
        $mine = Appointment::factory()->create();
        $someoneElses = Appointment::factory()->create(['appointment_time' => '15:00']);

        $this->actingAs($mine->user)
            ->patchJson("/api/appointments/{$mine->id}/status", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->actingAs($mine->user)
            ->patchJson("/api/appointments/{$someoneElses->id}/status", ['status' => 'cancelled'])
            ->assertForbidden();
    }

    // ---------- Listing ----------

    public function test_customer_can_open_own_booking_details_but_not_someone_elses(): void
    {
        $mine = Appointment::factory()->create(['notification_sent_at' => now()]);
        $someoneElses = Appointment::factory()->create(['appointment_time' => '15:00']);

        $this->actingAs($mine->user)->getJson("/api/appointments/{$mine->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $mine->id)
            ->assertJsonStructure(['data' => ['service' => ['name'], 'user' => ['email'], 'notification_sent_at']]);

        $this->actingAs($mine->user)->getJson("/api/appointments/{$someoneElses->id}")->assertForbidden();
    }

    public function test_customer_sees_only_own_bookings_and_admin_sees_all(): void
    {
        $mine = Appointment::factory()->create();
        Appointment::factory()->create(['appointment_time' => '16:00']);

        $this->actingAs($mine->user)->getJson('/api/appointments')
            ->assertOk()->assertJsonCount(1, 'data');

        $this->actingAs($this->admin())->getJson('/api/appointments')
            ->assertOk()->assertJsonCount(2, 'data');
    }

    // ---------- Services ----------

    public function test_service_list_hides_inactive_and_only_admin_can_create(): void
    {
        Service::factory()->create(['name' => 'Visible']);
        Service::factory()->create(['name' => 'Hidden', 'is_active' => false]);

        $this->getJson('/api/services')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Visible');

        $new = ['name' => 'Manicure', 'duration_minutes' => 30, 'price' => 50];

        $this->actingAs(User::factory()->create())->postJson('/api/services', $new)->assertForbidden();

        $this->actingAs($this->admin())->postJson('/api/services', $new)
            ->assertCreated()
            ->assertJsonPath('data.name', 'Manicure');
    }

    public function test_admin_can_edit_a_service_but_customer_cannot(): void
    {
        $service = Service::factory()->create(['name' => 'Beard Trim', 'price' => 40, 'duration_minutes' => 30]);
        $changes = ['name' => 'Beard Trim Deluxe', 'description' => 'With oil.', 'duration_minutes' => 45, 'price' => 55];

        $this->actingAs(User::factory()->create())
            ->putJson("/api/services/{$service->id}", $changes)
            ->assertForbidden();

        $this->actingAs($this->admin())
            ->putJson("/api/services/{$service->id}", ['name' => '', 'price' => -1])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'price']);

        $this->actingAs($this->admin())
            ->putJson("/api/services/{$service->id}", $changes)
            ->assertOk()
            ->assertJsonPath('data.name', 'Beard Trim Deluxe')
            ->assertJsonPath('data.price', 55);

        $this->assertDatabaseHas('services', ['id' => $service->id, 'name' => 'Beard Trim Deluxe', 'duration_minutes' => 45]);
    }

    public function test_disabled_service_is_hidden_and_cannot_be_booked_but_can_be_enabled_again(): void
    {
        $service = Service::factory()->create();
        $existing = Appointment::factory()->create(['service_id' => $service->id]);
        $admin = $this->admin();
        $customer = User::factory()->create();

        // Admin disables it
        $this->actingAs($admin)->putJson("/api/services/{$service->id}", ['is_active' => false])
            ->assertOk()->assertJsonPath('data.is_active', false);

        // Customers: not in the list, details page is 404, booking is rejected
        $this->getJson('/api/services')->assertJsonCount(0, 'data');
        $this->actingAs($customer)->getJson("/api/services/{$service->id}")->assertNotFound();
        $this->actingAs($customer)->postJson('/api/appointments', [
            'service_id' => $service->id,
            'appointment_date' => $this->tomorrow(),
            'appointment_time' => '14:00',
        ])->assertStatus(422)->assertJsonValidationErrors('service_id');

        // Existing bookings are kept; admin still sees the service with ?all=1
        $this->assertDatabaseHas('appointments', ['id' => $existing->id]);
        $this->actingAs($admin)->getJson('/api/services?all=1')->assertJsonCount(1, 'data');

        // Admin enables it again → bookable
        $this->actingAs($admin)->putJson("/api/services/{$service->id}", ['is_active' => true])->assertOk();
        $this->actingAs($customer)->postJson('/api/appointments', [
            'service_id' => $service->id,
            'appointment_date' => $this->tomorrow(),
            'appointment_time' => '14:00',
        ])->assertCreated();
    }

    public function test_times_that_already_passed_today_cannot_be_booked(): void
    {
        // Pretend it's 12:30 today, so 10:00 has passed and 14:00 hasn't.
        $this->travelTo(now()->setTime(12, 30));
        $service = Service::factory()->create();
        $today = now()->format('Y-m-d');

        $slots = collect($this->getJson("/api/services/{$service->id}/availability?date={$today}")->json('slots'));
        $this->assertFalse($slots->firstWhere('time', '10:00')['available']);
        $this->assertFalse($slots->firstWhere('time', '12:00')['available']);
        $this->assertTrue($slots->firstWhere('time', '14:00')['available']);

        $customer = User::factory()->create();
        $this->actingAs($customer)->postJson('/api/appointments', [
            'service_id' => $service->id, 'appointment_date' => $today, 'appointment_time' => '10:00',
        ])->assertStatus(422)
            ->assertJsonPath('errors.appointment_time.0', 'This time has already passed. Choose a later time.');

        $this->actingAs($customer)->postJson('/api/appointments', [
            'service_id' => $service->id, 'appointment_date' => $today, 'appointment_time' => '14:00',
        ])->assertCreated();
    }

    public function test_availability_marks_booked_slot_as_taken(): void
    {
        $booked = Appointment::factory()->create(['appointment_time' => '10:00']);
        $date = $booked->appointment_date->format('Y-m-d');

        $slots = collect($this->getJson("/api/services/{$booked->service_id}/availability?date={$date}")
            ->assertOk()->json('slots'));

        $this->assertFalse($slots->firstWhere('time', '10:00')['available']);
        $this->assertTrue($slots->firstWhere('time', '11:00')['available']);
    }

    // ---------- Notification log (Laravel → Node) ----------

    public function test_admin_can_read_notification_log_customer_cannot(): void
    {
        $this->actingAs($this->admin())->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->actingAs(User::factory()->create())->getJson('/api/admin/notifications')
            ->assertForbidden();
    }
}
