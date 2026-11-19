# BookEasy API

REST API of the Laravel backend. Used by the React web app and the mobile app.
A Postman collection with every request is in [`postman_collection.json`](postman_collection.json).

- **Base URL:** `http://127.0.0.1:8000/api`
- **Format:** JSON. Send `Accept: application/json` and `Content-Type: application/json`.
- **Auth:** Laravel Sanctum tokens. `POST /login` or `POST /register` returns a `token`; send it on every protected request:
  `Authorization: Bearer <token>`
- **Roles:** `customer` (default for everyone who registers) and `admin` (seeded: `admin@example.com` / `password`).

## Endpoints

| Method | Path | Who | What it does |
|---|---|---|---|
| POST | `/register` | anyone | Create a customer account, returns a token |
| POST | `/login` | anyone | Log in, returns a token |
| GET | `/me` | logged in | The logged-in user |
| POST | `/logout` | logged in | Invalidate the current token |
| GET | `/services` | anyone | Active services (admin: `?all=1` also returns disabled ones) |
| GET | `/services/{id}` | anyone | One service (disabled services: 404 except for admins) |
| GET | `/services/{id}/availability?date=YYYY-MM-DD` | anyone | The day's time slots, each free or not |
| POST | `/services` | admin | Add a service |
| PUT | `/services/{id}` | admin | Edit a service, or enable / disable it (`is_active`) |
| DELETE | `/services/{id}` | admin | Delete a service **and its bookings** (the UI disables instead) |
| GET | `/appointments` | logged in | Customer: own bookings. Admin: all. Filters: `?status=`, `?date=` |
| POST | `/appointments` | logged in | Book a time slot (also sends the confirmation via the notification service) |
| GET | `/appointments/{id}` | owner or admin | One booking |
| PATCH | `/appointments/{id}/status` | owner or admin | Change status. Customers can only set `cancelled` |
| GET | `/admin/notifications` | admin | Confirmation email log, fetched from the Node.js notification service |

## Booking rules

- **Time slots:** `09:00` to `17:00`, on the hour.
- **Date:** today or later. Times that have already passed today can't be booked (time zone `Asia/Dubai`).
- **No double booking:** a service can't be booked twice for the same date and time (409). Different services can be
  booked at the same time. Cancelled bookings free their slot.
- **Statuses:** `pending` (new) → `confirmed` → `completed`, or `cancelled`.
- **Disabled services** are hidden from customers and can't be booked. Their existing bookings are kept.

## Status codes

| Code | Meaning | Body |
|---|---|---|
| 200 / 201 | OK / created | `{ "message": "...", "data": {...} }` |
| 401 | No token, or token no longer valid | `{ "message": "Unauthenticated." }` |
| 403 | Logged in but not allowed (e.g. customer on an admin route) | `{ "message": "Only administrators can do this." }` |
| 404 | Not found | `{ "message": "Not found." }` |
| 409 | Time slot already booked | `{ "message": "This time slot is already booked. Please choose another time.", "errors": {...} }` |
| 422 | Validation failed | `{ "message": "...", "errors": { "field": ["message"] } }` |
| 503 | Notification service not running (`/admin/notifications` only) | `{ "message": "Notification service is not reachable.", "data": [] }` |

---

## Auth

### POST /register

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+971500000001",
  "password": "secret123",
  "password_confirmation": "secret123"
}
```

Rules: `name` required · `email` required, valid, unique · `phone` optional · `password` at least 8 characters, must match `password_confirmation`.
A `role` sent in the body is ignored: new accounts are always customers.

**201**
```json
{
  "message": "Registration successful.",
  "user": { "id": 3, "name": "Jane Doe", "email": "jane@example.com", "phone": "+971500000001", "role": "customer" },
  "token": "3|Xk9fP2..."
}
```

**422** `{ "message": "The email has already been taken.", "errors": { "email": ["The email has already been taken."] } }`

### POST /login

```json
{ "email": "customer@example.com", "password": "password" }
```

**200** same shape as register (`message`, `user`, `token`).
**422** `{ "message": "The email or password is incorrect.", "errors": { "email": ["The email or password is incorrect."] } }`

### GET /me · POST /logout

Header `Authorization: Bearer <token>`.
`/me` → **200** `{ "user": { ... } }` · `/logout` → **200** `{ "message": "Logged out." }`

---

## Services

### GET /services

**200**
```json
{
  "data": [
    { "id": 2, "name": "Beard Trim", "description": "Shape and trim with a hot towel finish.",
      "duration_minutes": 30, "price": 40, "is_active": true }
  ]
}
```

### GET /services/{id}

**200** `{ "data": { "id": 2, "name": "Beard Trim", ... } }` · **404** if it doesn't exist (or is disabled and you're not an admin).

### GET /services/{id}/availability?date=2026-12-01

**200**
```json
{
  "date": "2026-12-01",
  "slots": [
    { "time": "09:00", "available": true },
    { "time": "10:00", "available": false }
  ]
}
```
`available` is false when the slot is booked or the time has already passed today.

### POST /services (admin)

```json
{ "name": "Manicure", "description": "Nail care.", "duration_minutes": 30, "price": 50 }
```
Rules: `name` required · `duration_minutes` required, 5 to 480 · `price` required, 0 or more · `description` optional · `is_active` optional (default true).
**201** `{ "message": "Service created.", "data": { ... } }`

### PUT /services/{id} (admin)

Send only the fields to change. Disable a service: `{ "is_active": false }`.
**200** `{ "message": "Service updated.", "data": { ... } }`

### DELETE /services/{id} (admin)

**200** `{ "message": "Service deleted." }`. Also deletes that service's bookings; prefer disabling.

---

## Appointments

### POST /appointments

```json
{ "service_id": 2, "appointment_date": "2026-12-01", "appointment_time": "10:00", "notes": "First visit" }
```
Rules: `service_id` must be an active service · `appointment_date` `YYYY-MM-DD`, today or later · `appointment_time` one of the slots and not already passed · `notes` optional.

**201**
```json
{
  "message": "Appointment booked successfully.",
  "data": {
    "id": 7, "user_id": 2, "service_id": 2, "appointment_date": "2026-12-01", "appointment_time": "10:00",
    "status": "pending", "notes": "First visit", "notification_sent_at": "2026-11-19T13:05:12.000000Z",
    "service": { "id": 2, "name": "Beard Trim", "duration_minutes": 30, "price": 40 },
    "user": { "id": 2, "name": "Demo Customer", "email": "customer@example.com" }
  },
  "notification_sent": true
}
```
`notification_sent` is `false` (and `notification_sent_at` null) if the notification service was down. The booking is saved either way.

**409** slot already booked · **422** e.g. `{ "errors": { "appointment_time": ["This time has already passed. Choose a later time."] } }`

### GET /appointments

Customer: their own bookings. Admin: everyone's. Optional filters `?status=pending` and `?date=2026-12-01`.
**200** `{ "data": [ { "id": 7, ..., "service": {...}, "user": {...} } ] }`, newest date first.

### GET /appointments/{id}

**200** `{ "data": { ... } }` · **403** `"This is not your appointment."` for another customer's booking.

### PATCH /appointments/{id}/status

```json
{ "status": "confirmed" }
```
`status`: `pending`, `confirmed`, `completed` or `cancelled`. Admins can set any; customers only `cancelled` on their own bookings.
**200** `{ "message": "Appointment status updated.", "data": { ... } }`
**403** `{ "message": "Customers can only cancel their bookings." }`

---

## Notifications

### GET /admin/notifications (admin)

Laravel reads the log from the Node.js service and passes it on.
**200**
```json
{
  "data": [
    { "id": 1, "type": "booking_confirmation", "channel": "email", "recipient": "customer@example.com",
      "subject": "Booking confirmed: Beard Trim",
      "message": "Hi Demo Customer, your appointment for Beard Trim on 2026-12-01 at 10:00 has been received (ref #7).",
      "status": "sent (simulated)", "created_at": "2026-11-19T13:05:12.000Z" }
  ],
  "count": 1
}
```
**503** if the notification service isn't running.

---

## Notification service (Node.js, port 4000)

Called by Laravel, not by the apps. Email delivery is simulated (printed in its terminal).

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/notifications` | header `X-Service-Key` (shared secret) | Create a booking confirmation. Laravel sends: `appointment_id`, `customer_name`, `customer_email`, `service_name`, `appointment_date`, `appointment_time` |
| GET | `/notifications` | none | Log, newest first. Optional `?appointment_id=` |
| GET | `/notifications/{id}` | none | One notification |
| GET | `/health` | none | `{ "status": "ok" }` |

Errors: **401** wrong or missing `X-Service-Key` · **422** missing fields · **404** unknown id.
The key is `SERVICE_API_KEY` in Node and `NOTIFICATION_SERVICE_KEY` in Laravel's `.env` (default `local-dev-key` for both).
