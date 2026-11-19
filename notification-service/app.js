// Notification service
// Receives booking info from Laravel, builds a confirmation message,
// "sends" it (simulated: printed to the terminal) and keeps a log in a JSON file.
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'appointment_id',
  'customer_name',
  'customer_email',
  'service_name',
  'appointment_date',
  'appointment_time',
];

// createApp() builds the app without starting it, so tests can use their own data file and key.
function createApp({ dataFile, apiKey } = {}) {
  const DATA_FILE = dataFile || path.join(__dirname, 'data', 'notifications.json');
  const API_KEY = apiKey || process.env.SERVICE_API_KEY || 'local-dev-key';

  // ---- Simple "database": an array of notifications saved in a JSON file ----
  function readAll() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
  }

  function saveAll(list) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
  }

  const app = express();
  app.use(cors());         // allow browsers on other ports to call this API
  app.use(express.json()); // parse JSON request bodies into req.body

  // Only callers that know the shared key (Laravel) may create notifications.
  function requireApiKey(req, res, next) {
    if (req.get('X-Service-Key') !== API_KEY) {
      return res.status(401).json({ message: 'Invalid or missing X-Service-Key header.' });
    }
    next();
  }

  // GET /health — quick "is it running?" check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // POST /notifications — called by Laravel when an appointment is booked
  app.post('/notifications', requireApiKey, (req, res) => {
    const body = req.body || {};

    // Validation: every required field must be present
    const errors = {};
    for (const field of REQUIRED_FIELDS) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        errors[field] = [`The ${field} field is required.`];
      }
    }
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ message: 'Validation failed.', errors });
    }

    const list = readAll();
    const notification = {
      id: list.length ? list[list.length - 1].id + 1 : 1,
      type: 'booking_confirmation',
      channel: 'email',
      recipient: body.customer_email,
      subject: `Booking confirmed: ${body.service_name}`,
      message:
        `Hi ${body.customer_name}, your appointment for ${body.service_name} on ` +
        `${body.appointment_date} at ${body.appointment_time} has been received (ref #${body.appointment_id}).`,
      status: 'sent (simulated)',
      booking: Object.fromEntries(REQUIRED_FIELDS.map((f) => [f, body[f]])),
      created_at: new Date().toISOString(),
    };

    list.push(notification);
    saveAll(list);

    // Simulated email delivery — print what would be sent
    console.log(`[email] to: ${notification.recipient}`);
    console.log(`        subject: ${notification.subject}`);
    console.log(`        ${notification.message}`);

    res.status(201).json({ message: 'Notification created.', data: notification });
  });

  // GET /notifications — the log, newest first. Optional ?appointment_id=
  app.get('/notifications', (req, res) => {
    let list = readAll().reverse();
    if (req.query.appointment_id) {
      list = list.filter((n) => String(n.booking.appointment_id) === String(req.query.appointment_id));
    }
    res.json({ data: list, count: list.length });
  });

  // GET /notifications/:id — one notification
  app.get('/notifications/:id', (req, res) => {
    const found = readAll().find((n) => String(n.id) === req.params.id);
    if (!found) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    res.json({ data: found });
  });

  // Any unknown URL → JSON 404
  app.use((req, res) => {
    res.status(404).json({ message: 'Not found.' });
  });

  // Any error (e.g. invalid JSON body) → JSON error instead of an HTML page
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ message: status === 400 ? 'Invalid JSON body.' : 'Server error.' });
  });

  return app;
}

module.exports = { createApp };
