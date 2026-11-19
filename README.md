# BookEasy: Mini Appointment Booking System

Customers browse services, book a time slot and manage their bookings on the web or on their phone.
An administrator manages services and appointments. Every booking triggers a confirmation email
(simulated) from a separate Node.js service, and a WordPress site markets the business.

| Part | Folder | Built with |
|---|---|---|
| Backend API | [`backend/`](backend) | Laravel 13 (PHP 8.3+), MySQL 8, Sanctum tokens |
| Notification service | [`notification-service/`](notification-service) | Node.js, Express 5 |
| Web app | [`frontend/`](frontend) | React 19, Vite, React Router |
| Mobile app | [`mobile/`](mobile) | React Native, Expo SDK 58, React Navigation |
| Website | [`wordpress/booking-theme/`](wordpress/booking-theme) | WordPress custom theme |
| Docs | [`docs/`](docs) | API docs, Postman collection, SQL export, test walkthrough |

## How it fits together

```
 React web app (5173) ─┐
                       ├──► Laravel API (8000) ──► MySQL (3310)
 Expo mobile app ──────┘          │
                                  └── on every booking ──► Node notification service (4000)
                                                               └── logs the "email" (simulated)
 WordPress site (8080) ── reads services + prices from the Laravel API
                       └─ "Book" buttons open the React web app
```

- **Laravel** is the single source of truth: users, services, bookings and all rules.
- **No double booking:** a service can't be booked twice at the same date and time. Different services can run in parallel.
  The check runs inside a database transaction with a row lock, so two people clicking at the same moment can't both get the slot.
- **Laravel → Node:** after saving a booking, Laravel sends it to the notification service (with a shared key).
  If the service is down, the booking still succeeds and the app says the email wasn't sent.

## Features

**Customers** (web and mobile): register, log in, browse services and details, see free time slots for any day, book,
see a confirmation with the email status, view and cancel their bookings.
**Admin** (web): all appointments with a status filter, change status (pending / confirmed / completed / cancelled),
add and edit services, enable or disable a service, view the confirmation email log.
**Website:** landing page, services and prices pulled live from the booking API, buttons into the booking app.

---

## Setup

### 1. Requirements

| Tool | Version | Check |
|---|---|---|
| PHP + Composer | PHP 8.3 or newer, Composer 2 | `php -v`, `composer -V` |
| Node.js + npm | Node 22 or 24 LTS | `node -v` |
| Docker Desktop | any recent | `docker -v` (Docker Desktop must be running) |
| For the mobile app | Xcode iOS Simulator (Mac), or the **Expo Go** app on a phone | |

### 2. Get the code

```bash
git clone https://github.com/sak07/mini-appointment-booking-system.git
cd mini-appointment-booking-system
```

### 3. Start the databases (Docker)

```bash
docker compose up -d mysql
```

Starts MySQL 8.4 on port **3310** with database `booking_app` (user `booking_user`, password `booking_pass`).
Port 3310 is used so it doesn't clash with a MySQL already on 3306.

### 4. Backend API (Laravel), terminal 1

```bash
cd backend
composer install
cp .env.example .env            # already points at the Docker MySQL and the notification service
php artisan key:generate
php artisan migrate --seed      # creates the tables and the demo data
php artisan serve --port=8000   # API at http://127.0.0.1:8000/api
```

Instead of `migrate --seed` you can import [`docs/database.sql`](docs/database.sql) (same tables and demo data):
`docker exec -i booking-mysql mysql -ubooking_user -pbooking_pass booking_app < docs/database.sql`

### 5. Notification service (Node.js), terminal 2

```bash
cd notification-service
npm install
npm start                       # http://localhost:4000, prints each "email" in this terminal
```

### 6. Web app (React), terminal 3

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL=http://127.0.0.1:8000/api
npm run dev                     # http://localhost:5173
```

### 7. Mobile app (Expo), terminal 4

```bash
cd mobile
npm install
cp .env.example .env            # EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api
npx expo start --ios            # opens the iPhone simulator (or press "a" for an Android emulator)
```

- **iPhone simulator:** works as is.
- **Android emulator:** set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api` in `mobile/.env`.
- **Real phone (Expo Go):** set `EXPO_PUBLIC_API_URL=http://<your computer's IP>:8000/api`, start Laravel with
  `php artisan serve --host=0.0.0.0 --port=8000`, then scan the QR code from `npx expo start`.

### 8. WordPress website

```bash
docker compose up -d wordpress
docker compose run --rm wpcli wp core install --url=http://localhost:8080 --title="BookEasy" \
  --admin_user=admin --admin_password=<choose-a-password> --admin_email=admin@example.com --skip-email
docker compose run --rm wpcli wp theme activate booking-theme
docker compose run --rm wpcli wp rewrite structure '/%postname%/' --hard
docker compose run --rm wpcli wp option update blogdescription "Online appointment booking"
```

Website at **http://localhost:8080** (admin: http://localhost:8080/wp-admin). The Laravel API must be running for the
services list; the site reaches it at `http://host.docker.internal:8000/api` (set in `docker-compose.yml`).

### 9. Log in

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `password` |
| Customer | `customer@example.com` | `password` |

Or register a new customer account in the app.

---

## Addresses and ports

| What | URL |
|---|---|
| Web app | http://localhost:5173 |
| API | http://127.0.0.1:8000/api |
| Notification service | http://localhost:4000 (log: `/notifications`) |
| WordPress | http://localhost:8080 |
| MySQL (booking app) | `127.0.0.1:3310`, database `booking_app` |

## Tests

```bash
cd backend && php artisan test               # 19 API tests (separate in-memory database, your data is untouched)
cd notification-service && npm test         # 4 tests
```

The Laravel tests cover login, booking, duplicate prevention (409), parallel services, cancelled slots, past times,
validation errors, status rules, customer vs admin access, enabling / disabling services, and Laravel → Node
(including the Node service being down).

A full manual walkthrough of every feature is in [`docs/TESTING.md`](docs/TESTING.md).

## API

All endpoints, rules and example requests: [`docs/API.md`](docs/API.md).
Postman: import [`docs/postman_collection.json`](docs/postman_collection.json), then run **Log in as customer** and
**Log in as admin** first; they store the tokens for the other requests.

## Database

- **Migrations:** [`backend/database/migrations`](backend/database/migrations) (users with `role`, `services`, `appointments`).
- **Demo data:** [`backend/database/seeders/DatabaseSeeder.php`](backend/database/seeders/DatabaseSeeder.php).
- **SQL file:** [`docs/database.sql`](docs/database.sql), the same schema and demo data as a single MySQL import.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Address already in use` | That server is already running in another terminal. Find it: `lsof -nP -iTCP:8000 -sTCP:LISTEN`, stop it: `kill <PID>` |
| Web app shows "Can't connect to the booking server" | Start Laravel (step 4) |
| Booking says the confirmation email wasn't sent | Start the notification service (step 5). The booking itself is saved |
| WordPress: "Services can't be loaded right now" | Start Laravel; the website reads services from it (updates within a minute) |
| Mobile app shows an old version | Press `r` in the Expo terminal, or restart with `npx expo start --clear` |
| Laravel can't connect to MySQL | `docker compose up -d mysql`, and check `DB_PORT=3310` in `backend/.env` |
