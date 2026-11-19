# BookEasy: testing walkthrough

Follow the steps in order, from 1 to the end. Each step has **one thing to do** and **what you should see**.
Tick the box when it works. If something is different, note the **step number** and what you saw.

From now on, **Log out** always asks you to confirm in a small dialog: choose **Log out** to continue.

Accounts used (all passwords are `password`):
- Customer: `customer@example.com`
- Admin: `admin@example.com`
- WordPress admin: user `admin`, password in `wordpress/.wp-admin-credentials.txt`

---

## Part A: Get ready

- [ ] **1.** In a terminal, check all servers are running:
  ```bash
  for p in 3310 8080 8000 4000 5173 8081; do printf "port %s: " $p; lsof -nP -iTCP:$p -sTCP:LISTEN -t >/dev/null && echo up || echo DOWN; done
  ```
  You should see: six lines, all `up`.
  (If one says DOWN, start it. See "Starting the servers" at the end of this file.)

- [ ] **2.** Reset to clean demo data:
  ```bash
  cd ~/mini-appointment-booking-system/backend && php artisan migrate:fresh --seed
  rm -f ~/mini-appointment-booking-system/notification-service/data/notifications.json
  ```
  You should see: a list of migrations ending in `Seeding database`.

- [ ] **3.** Put the terminal tab running the **Node service** (`npm start` in notification-service) where you can see it.
  Each booking prints a fake email there, starting with `[email]`.

---

## Part B: Look around without logging in (Chrome, normal window)

- [ ] **4.** Open http://localhost:5173
  You should see: header with BookEasy, Services, Log in, Create account. Heading "Book an appointment". Four services in a list, each with duration, price and a Book button.

- [ ] **5.** Click the name **Beard Trim**.
  You should see: Beard Trim page with Duration 30 minutes, Price AED 40, a "Choose a time" button, and a **Back to services** button at the top. Click it: you go back to the services list. Then click Beard Trim again.

- [ ] **6.** Open http://localhost:5173/services/999
  You should see: "This service doesn't exist or is no longer offered."

- [ ] **7.** Open http://localhost:5173/wrong-page
  You should see: "Page not found" with a link back to services.

- [ ] **8.** Open http://localhost:5173/my-bookings
  You should see: you're taken to the Log in page.

---

## Part C: Create an account

- [ ] **9.** Click **Create account** in the header. Click the **Create account** button without typing anything.
  You should see: "Enter your name.", "Enter your email address." and "Use at least 8 characters." under the fields, with red borders.

- [ ] **10.** Type `abc` in Email and click Create account.
  You should see: "Enter a valid email address, like name@example.com."

- [ ] **11.** Fill in: Name `Test User`, Email `test1@example.com`, Password `password1`, Confirm password `password2`. Click Create account.
  You should see: "Passwords don't match." under Confirm password.
  Then click the **eye icon** in each password box: you can read what you typed and the eye gets a line through it. Click it again: the dots come back. (Each box toggles on its own.)

- [ ] **12.** Change Email to `customer@example.com` and Confirm password to `password1`. Click Create account.
  You should see: "The email has already been taken." under Email (this one comes from the server).

- [ ] **13.** Change Email back to `test1@example.com`. Click Create account.
  You should see: you're logged in and on Services. Header shows Services, My bookings, Log out (no Admin link).

- [ ] **14.** Refresh the page (Cmd + R).
  You should see: still logged in.

- [ ] **15.** Click **Log out**.
  You should see: a dialog "Log out?" with **Cancel** and **Log out**. Click **Cancel**: the dialog closes and you are still logged in.
  Click **Log out** in the header again, press the **Esc** key: same as Cancel.
  Click **Log out** again and choose **Log out** in the dialog: the button briefly says "Logging out...", then you are on Services, the header shows Log in and Create account, and a dark message slides up at the bottom: "You've been logged out." It disappears after about 4 seconds (or click × to close it).

---

## Part D: Log in

- [ ] **16.** Click **Log in**. Click the Log in button without typing anything.
  You should see: "Enter your email address." and "Enter your password." under the fields.

- [ ] **17.** Email `customer@example.com`, password `wrongpass` (click the **eye icon** to check what you typed). Click Log in.
  You should see: one box at the top: "Email or password is incorrect. Check both and try again."

- [ ] **18.** Email `nobody@example.com`, password `password`. Click Log in.
  You should see: the same message as step 17.

- [ ] **19.** Go to Services and click **Book** next to **Haircut & Styling**.
  You should see: the Log in page.

- [ ] **20.** Log in as `customer@example.com` / `password`.
  You should see: you land on the **Haircut & Styling booking page** (not the home page).

---

## Part E: Book an appointment (logged in as the customer)

- [ ] **21.** Look at the booking page.
  You should see: on the left Haircut & Styling, 45 min, AED 80. On the right a Date box (today) and 9 time buttons from 09:00 to 17:00. **Times earlier than now today are crossed out** (they have already passed).

- [ ] **22.** Click **Book appointment** without choosing a time.
  You should see: "Choose a time." under the times.

- [ ] **23.** Change the date to **tomorrow**. Click **10:00**.
  You should see: 10:00 turns navy, and the button says "Book 10:00 on" plus tomorrow's day and date.

- [ ] **24.** Click that button.
  You should see: a green tick and "You're booked", then a list: Service Haircut & Styling, Date (tomorrow), Time 10:00, Duration 45 min, Price AED 80, Reference #1. Below it a **green box** with a mail icon: "Confirmation email sent to customer@example.com."

- [ ] **25.** Look at the Node terminal.
  You should see: `[email] to: customer@example.com`, subject "Booking confirmed: Haircut & Styling", and the date, time and ref #1.

- [ ] **26.** Click **Book another time** (keep tomorrow's date).
  You should see: **10:00 is crossed out** and can't be clicked.

- [ ] **27.** Go to Services, click **Book** next to **Beard Trim**, pick tomorrow at **10:00** and book it.
  You should see: "You're booked" (different services can be booked at the same time).

- [ ] **28.** Go to Haircut & Styling's booking page. In the date box type a past date (for example 01/01/2020), click 12:00 and book.
  You should see: under Date, "The appointment date field must be a date after or equal to today."
  (Times earlier than now **today** are crossed out and can't be picked; if one is booked anyway, e.g. from the API, the answer is "This time has already passed. Choose a later time.")

---

## Part F: Two people try to book the same time

- [ ] **29.** Open a **Chrome Incognito window** (Cmd + Shift + N). Go to http://localhost:5173/login and log in as `test1@example.com` / `password1`.

- [ ] **30.** In **both windows** (normal = customer, Incognito = Test User): open Haircut & Styling's booking page, pick **tomorrow**, click **11:00**. Don't click Book yet.

- [ ] **31.** Click the Book button in the **normal** window.
  You should see: "You're booked".

- [ ] **32.** Now click the Book button in the **Incognito** window.
  You should see: under the times, "This time was just booked by someone else. Choose another time." and 11:00 is now crossed out.

---

## Part G: My bookings

- [ ] **33.** In the normal window (customer), click **My bookings**.
  You should see: three bookings (Haircut 10:00, Beard Trim 10:00, Haircut 11:00), each with "Pending", a **View** button and a Cancel button.
  Click **View** on Haircut 10:00 (or click its name): the booking page opens at `/my-bookings/1` with "Haircut & Styling" + a Pending badge, the receipt (Service, Date, Time, Duration, Price, Reference #1), a **green** "Confirmation email sent to customer@example.com." box, and **Cancel booking** / **Book this service again** buttons. Refresh the page: it still shows. Click **Back to my bookings**.

- [ ] **34.** In the Incognito window (Test User), click **My bookings**.
  You should see: "You don't have any bookings yet." and a Browse services button. (Test User can't see the customer's bookings.)

- [ ] **35.** Back in the normal window, click **Cancel** on Beard Trim.
  You should see: the page dims and a dialog "Cancel this booking?" shows Beard Trim with its date and time, and two buttons: **Keep booking** and a red **Cancel booking**. Click **Keep booking**: the dialog closes and nothing changes. (Pressing **Esc** does the same.)

- [ ] **36.** Click **Cancel** on Beard Trim again and choose **Cancel booking**.
  You should see: the button briefly says "Cancelling...", then green "Cancelled Beard Trim on … at 10:00.", the badge says Cancelled, and its Cancel button is gone.

- [ ] **37.** Book **Beard Trim, tomorrow, 10:00** again.
  You should see: "You're booked" (cancelling freed the time).

- [ ] **38.** Close the Incognito window.

---

## Part H: Admin

- [ ] **39.** In the normal window, click **Log out**, then log in as `admin@example.com` / `password`.
  You should see: the header also has **Admin**.

- [ ] **40.** Click **Admin**.
  You should see: three tabs: **Appointments**, **Services**, **Confirmation emails**, each with a number. Appointments is open: a table with every booking (ref, customer name and email, service, when, status, a status dropdown). Click each tab: only that section shows, and the underline moves to the tab you clicked. Go back to **Appointments**.

- [ ] **41.** In the Appointments table, change booking **#1** to **Confirmed**.
  You should see: green "Booking #1 is now confirmed." and a navy "Confirmed" badge.

- [ ] **42.** Change booking **#1** to **Completed**.
  You should see: a green "Completed" badge.

- [ ] **43.** Use the **Show** dropdown above the table: pick Cancelled, then Completed, then All.
  You should see: only matching bookings each time (Cancelled shows the cancelled Beard Trim; Completed shows #1; All shows everything).

- [ ] **44.** Open the **Services** tab.
  You should see: a table of services (name with description, Duration, Price, an **Edit** button on each row) and an **Add service** button on the right.
  Click **Add service**: a "New service" pop-up opens over the dimmed page. Clear the Duration box and click **Save service** with everything empty.
  You should see: "Enter a service name.", "Enter a duration of at least 5 minutes." and "Enter a price of 0 or more."

- [ ] **45.** Fill in Name `Manicure`, Description `Nail care`, Duration `30`, Price `50`. Click **Save service**.
  You should see: the pop-up closes, green "Added Manicure. Customers can book it now.", Manicure appears in the table, and the Services tab number goes up by 1.
  Click **Add service** again, then **Cancel** (or ×, or Esc): the pop-up closes without adding anything.
  Now click **Edit** on Manicure: a pop-up "Edit Manicure" opens with its current values. Change Price to `55` and click **Save changes**: green "Saved changes to Manicure." and the table shows AED 55.
  Click the **switch** next to Manicure in the Status column: it turns grey, says **Disabled**, the row greys out, and green "Manicure is disabled. Customers can't see or book it." appears.
  In an **Incognito window** open http://localhost:5173: Manicure is **not** in the list. Back in Admin, click the switch again: it turns navy, says **Active**, and "Manicure is active again. Customers can book it." appears. Refresh the Incognito window: Manicure is back.

- [ ] **46.** Open the **Confirmation emails** tab.
  You should see: one entry for each booking you made (4), newest first.

- [ ] **47.** Log out and log in as the customer. Open **My bookings**.
  You should see: Haircut 10:00 shows **Completed** with no Cancel button.

- [ ] **48.** Open **Services**.
  You should see: Manicure is in the list.

- [ ] **49.** Type http://localhost:5173/admin in the address bar.
  You should see: you're sent back to Services (customers can't open Admin).

---

## Part I: When the notification service is down

- [ ] **50.** In the Node terminal press **Ctrl + C** to stop it.

- [ ] **51.** As the customer, book **Facial Treatment, tomorrow, 14:00**.
  You should see: "You're booked" with the details list, and an **amber box** with a warning icon: "Confirmation email not sent. Your booking is saved. Note your reference #…"

- [ ] **52.** Open **My bookings**.
  You should see: the Facial Treatment booking is there. Click **View** on it: its page shows the **amber** "Confirmation email not sent." box (remembered, even after leaving the page).

- [ ] **53.** In a terminal, run:
  ```bash
  tail -n 3 ~/mini-appointment-booking-system/backend/storage/logs/laravel.log
  ```
  You should see: a line with `local.WARNING: Notification service unreachable for booking #…`.
  (After Node is back, a successful booking adds `local.INFO: Confirmation email sent for booking #… to …`. Automated tests no longer write to this file.)

- [ ] **54.** Log in as admin, open **Admin**, open the **Confirmation emails** tab and click **Refresh**.
  You should see: "The notification service isn't running, so the log can't be shown. Start it and select Refresh."

- [ ] **55.** Start Node again in its tab:
  ```bash
  cd ~/mini-appointment-booking-system/notification-service && npm start
  ```
  Then click **Refresh** in Admin.
  You should see: the emails list is back (the Facial Treatment booking has no email, which is expected).

- [ ] **56.** Open http://localhost:4000/notifications
  You should see: the same emails as raw data, each with `"status": "sent (simulated)"`.

---

## Part J: WordPress website

The website reads its services and prices **live from the booking app** (the Laravel API), so it always matches what
customers can book. Changes can take up to **1 minute** to appear (the website keeps the list for 60 seconds).

- [ ] **57.** Open http://localhost:8080
  You should see: a navy section "Grooming and wellness, booked in a minute" with a "Book an appointment" button, then "Services and prices" with the **same services, durations and prices as the booking app** (including Manicure from step 45, at AED 55), "How booking works" with steps 1, 2, 3, and "Ready when you are."

- [ ] **58.** Click **Book an appointment**.
  You should see: the booking app (http://localhost:5173). Go back.

- [ ] **59.** Click **Book now** in the header. Go back, then click the **Book** button next to **Beard Trim**.
  You should see: Book now opens the booking app's home; Book next to Beard Trim opens **Beard Trim's booking page** directly (http://localhost:5173/book/…).

- [ ] **60.** Go back and click the name **Beard Trim**.
  You should see: Beard Trim's page in the booking app (http://localhost:5173/services/…). Go back.

- [ ] **61.** Click **My bookings** in the header.
  You should see: http://localhost:5173/my-bookings. Go back.

- [ ] **62.** Click **Services** in the header.
  You should see: the page scrolls down to "Services and prices".

- [ ] **63.** Open http://localhost:8080/nope/
  You should see: "Page not found" in the same design.

- [ ] **64.** **Prices follow the booking app.** In the booking app, log in as admin → **Admin → Services**, click **Edit** on Beard Trim, change the price (for example to `45`) and **Save changes**. Wait a minute, then refresh http://localhost:8080
  You should see: Beard Trim shows the new price on the website.

- [ ] **65.** **Disabled services disappear.** In Admin → Services, switch **Manicure** off. Wait a minute, refresh http://localhost:8080
  You should see: Manicure is no longer on the website. Switch it back on: after a minute it's back.

- [ ] **66.** **When the booking app is down.** Stop Laravel (Ctrl + C in its tab), wait a minute, refresh http://localhost:8080
  You should see: under "Services and prices" an amber note "Services can't be loaded right now. See them in the booking app." The rest of the page still works. Start Laravel again:
  ```bash
  cd ~/mini-appointment-booking-system/backend && php artisan serve --port=8000
  ```

- [ ] **67.** Open http://localhost:8080/wp-admin and log in (user `admin`, password from `wordpress/.wp-admin-credentials.txt`). Go to **Appearance → Themes**.
  You should see: the **BookEasy** theme is active ("Landing page with services and prices read live from the booking app…"). There is no separate Services menu: services are managed only in the booking app.

---

## Part K: Mobile app (iPhone simulator)

If the app looks old, press `r` in the Expo terminal tab. The round blue gear button is Expo's developer menu, not part of the app.

- [ ] **68.** If you're logged in, tap **Log out** (top left).
  You should see: an alert "Log out?" with **Cancel** and **Log out**. Tap **Cancel**: nothing changes. Tap **Log out** again, then **Log out** in the alert: the Log in screen appears with a green box "You've been logged out." at the top.

- [ ] **69.** Tap **Log in** without typing anything.
  You should see: "Enter your email address." and "Enter your password." under the fields, with red borders.

- [ ] **70.** Start typing in the Email field.
  You should see: its error and red border disappear.

- [ ] **71.** Log in with `customer@example.com` and a wrong password.
  You should see: a box at the top: "Email or password is incorrect. Check both and try again."

- [ ] **72.** Tap **Create an account**, then tap **Create account** without typing anything.
  You should see: "Enter your name.", "Enter your email address." and "Use at least 8 characters."

- [ ] **73.** Fill in Full name `Phone User`, Email `customer@example.com`, Password `password1`, Confirm password `password1`. Tap Create account.
  You should see: "The email has already been taken." under Email. Tap the **eye icon** in a password box: the password becomes readable and the eye gets a line through it. Go back to Log in.

- [ ] **74.** Log in as `customer@example.com` / `password`.
  You should see: "Book an appointment" with the services (name, price, description, duration). Top: Log out (left), My bookings (right).

- [ ] **75.** Pull the list down.
  You should see: it refreshes.

- [ ] **76.** Tap **Haircut & Styling**.
  You should see: description, Duration, Price and a **Choose a time** button.

- [ ] **77.** Tap **Choose a time**.
  You should see: a row of 7 days starting with Today, and the times. Tap tomorrow: 10:00 and 11:00 are crossed out (booked earlier on the web).

- [ ] **78.** Tap **Book appointment** without choosing a time.
  You should see: "Choose a time."

- [ ] **79.** Tap tomorrow, tap **15:00**, tap the Book button.
  You should see: a green tick and "You're booked", the receipt (Service, Date, Time, Duration, Price, Reference) and a **green** box "Confirmation email sent to customer@example.com." Buttons: **View booking** and **Book another time**.

- [ ] **80.** Tap **Book another time**, tap tomorrow.
  You should see: 15:00 is now crossed out.

- [ ] **81.** Tap back to Services, then **My bookings** (top right).
  You should see: all the customer's bookings, including the ones made on the web, with status badges and a **›** on each row.
  Tap a booking: its **Booking** screen opens with the status badge, the receipt and a green or amber email box (amber for the Facial Treatment booked while Node was stopped). Go back.

- [ ] **82.** Tap **Cancel** on the 15:00 booking, then **Keep booking**.
  You should see: nothing changes.

- [ ] **83.** Tap **Cancel** again, then **Cancel booking**.
  You should see: green "Cancelled Haircut & Styling on …" and the badge says Cancelled.

- [ ] **84.** On the web (Chrome), log in as the customer and open **My bookings**.
  You should see: the 15:00 booking made on the phone, marked Cancelled.

- [ ] **85.** On the web, log in as admin and set the customer's **Facial Treatment** booking to **Confirmed**. On the phone, pull down My bookings.
  You should see: Facial Treatment shows Confirmed.

- [ ] **86.** Close the app completely (swipe it away in the simulator's app switcher: Cmd + Shift + H twice) and open it again from Expo Go.
  You should see: still logged in.

- [ ] **87.** Stop Laravel (Ctrl + C in its tab). On the phone, pull down the Services list.
  You should see: "Can't connect to the booking server. Check that it's running and try again."

- [ ] **88.** Start Laravel again:
  ```bash
  cd ~/mini-appointment-booking-system/backend && php artisan serve --port=8000
  ```
  Pull down the list again.
  You should see: the services are back.

---

## Part L: API checks in the terminal

These check the server's rules directly. Open a new terminal tab and paste this first:

- [ ] **89.** Log in from the terminal:
  ```bash
  API=http://127.0.0.1:8000/api
  J=(-H "Accept: application/json" -H "Content-Type: application/json")
  CUST=$(curl -s "${J[@]}" -X POST $API/login -d '{"email":"customer@example.com","password":"password"}' | php -r 'echo json_decode(stream_get_contents(STDIN))->token;')
  ADMIN=$(curl -s "${J[@]}" -X POST $API/login -d '{"email":"admin@example.com","password":"password"}' | php -r 'echo json_decode(stream_get_contents(STDIN))->token;')
  echo "customer: ${CUST:0:6}...  admin: ${ADMIN:0:6}..."
  ```
  You should see: two short token beginnings, like `customer: 5|abcd...  admin: 6|efgh...`

- [ ] **90.** Without logging in:
  ```bash
  curl -s "${J[@]}" $API/appointments
  ```
  You should see: `{"message":"Unauthenticated."}`

- [ ] **91.** Invalid booking:
  ```bash
  curl -s "${J[@]}" -H "Authorization: Bearer $CUST" -X POST $API/appointments -d '{"service_id":999,"appointment_date":"2020-01-01","appointment_time":"10:30"}'
  ```
  You should see: errors for service_id, appointment_date and appointment_time.

- [ ] **92.** Book the same time twice (run this line **two times**):
  ```bash
  curl -s -w "  HTTP %{http_code}\n" "${J[@]}" -H "Authorization: Bearer $CUST" -X POST $API/appointments -d '{"service_id":2,"appointment_date":"2030-01-15","appointment_time":"09:00"}'
  ```
  You should see: first time `HTTP 201`; second time `HTTP 409` with "This time slot is already booked. Please choose another time."

- [ ] **93.** Customer tries to confirm a booking:
  ```bash
  curl -s "${J[@]}" -H "Authorization: Bearer $CUST" -X PATCH $API/appointments/2/status -d '{"status":"confirmed"}'
  ```
  You should see: "Customers can only cancel their bookings."

- [ ] **94.** Admin sends a status that doesn't exist:
  ```bash
  curl -s "${J[@]}" -H "Authorization: Bearer $ADMIN" -X PATCH $API/appointments/2/status -d '{"status":"done"}'
  ```
  You should see: "The selected status is invalid."

- [ ] **95.** Customer tries to add a service:
  ```bash
  curl -s "${J[@]}" -H "Authorization: Bearer $CUST" -X POST $API/services -d '{"name":"X","duration_minutes":30,"price":10}'
  ```
  You should see: "Only administrators can do this."

- [ ] **96.** Someone tries to register as an admin:
  ```bash
  curl -s "${J[@]}" -X POST $API/register -d '{"name":"Hacker","email":"h@example.com","password":"password1","password_confirmation":"password1","role":"admin"}'
  ```
  You should see: the account is created but with `"role":"customer"`.

- [ ] **97.** A service that doesn't exist:
  ```bash
  curl -s "${J[@]}" $API/services/999
  ```
  You should see: `{"message":"Not found."}`

- [ ] **98.** Someone other than Laravel tries to create a notification:
  ```bash
  curl -s -X POST http://localhost:4000/notifications -H "Content-Type: application/json" -d '{}'
  ```
  You should see: "Invalid or missing X-Service-Key header."

---

## Part M: Automated tests

- [ ] **99.** Laravel tests:
  ```bash
  cd ~/mini-appointment-booking-system/backend && php artisan test
  ```
  You should see: 15 passed. (They use a separate temporary database, so your data isn't touched.)

- [ ] **100.** Node tests:
  ```bash
  cd ~/mini-appointment-booking-system/notification-service && npm test
  ```
  You should see: 4 passed.

---

## Part N: Small screens and keyboard (Chrome)

- [ ] **101.** Make the Chrome window narrow (about phone width) and look at Services, a booking page, My bookings and Admin.
  You should see: the menu moves under the logo, the list and booking form stack, the admin table scrolls sideways, nothing is cut off.

- [ ] **102.** Log out. On the Log in page, use only the **Tab** key and **Enter** to log in.
  You should see: each field and button gets a navy outline when it's selected, and you can log in without the mouse.

- [ ] **103.** On a booking page, press Tab until a time is outlined, then press Enter.
  You should see: that time is selected.

- [ ] **104.** While going through all the pages above, watch for "—", "–" or "·".
  You should see: none anywhere.

**Done.** All 104 steps cover every requirement in the brief.

---

## Starting the servers (only if step 1 showed DOWN)

Open a **new terminal tab for each** and leave it running. Type the commands exactly (no `~` in front of the command).

```bash
# MySQL + WordPress (Docker Desktop must be open)
cd ~/mini-appointment-booking-system && docker compose up -d mysql wordpress
```
```bash
# Laravel API (port 8000)
cd ~/mini-appointment-booking-system/backend && php artisan serve --port=8000
```
```bash
# Node notification service (port 4000)
cd ~/mini-appointment-booking-system/notification-service && npm start
```
```bash
# React web app (port 5173)
cd ~/mini-appointment-booking-system/frontend && npm run dev
```
```bash
# Mobile app in the iPhone simulator (port 8081)
cd ~/mini-appointment-booking-system/mobile && npx expo start --ios
```

**"Address already in use"** means that server is already running in another tab. Use that one, or find it with
`lsof -nP -iTCP:8000 -sTCP:LISTEN` (change the port) and stop it with `kill <number shown>`.

## Reporting a problem

Send the **step number**, what you did, and what you saw instead. A screenshot helps.
Example: `Step 32: the Incognito window booked successfully instead of showing the "just booked" message.`
