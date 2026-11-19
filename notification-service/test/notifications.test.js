// Run: npm test  (Node's built-in test runner — no extra packages)
// Each test starts the app on a random free port with its own temporary data file.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../app');

function start() {
  const dataFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'notif-')), 'notifications.json');
  const server = createApp({ dataFile, apiKey: 'test-key' }).listen(0);
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

const booking = {
  appointment_id: 7,
  customer_name: 'Jane',
  customer_email: 'jane@example.com',
  service_name: 'Haircut',
  appointment_date: '2026-12-01',
  appointment_time: '10:00',
};

const post = (base, body, key = 'test-key') =>
  fetch(`${base}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(key ? { 'X-Service-Key': key } : {}) },
    body: JSON.stringify(body),
  });

test('creates a notification and returns it in the log', async () => {
  const { server, base } = start();
  try {
    const res = await post(base, booking);
    assert.strictEqual(res.status, 201);
    const created = (await res.json()).data;
    assert.strictEqual(created.recipient, 'jane@example.com');
    assert.match(created.message, /Haircut on 2026-12-01 at 10:00/);

    const log = await (await fetch(`${base}/notifications`)).json();
    assert.strictEqual(log.count, 1);
    assert.strictEqual(log.data[0].id, created.id);
  } finally {
    server.close();
  }
});

test('rejects a missing or wrong api key with 401', async () => {
  const { server, base } = start();
  try {
    assert.strictEqual((await post(base, booking, null)).status, 401);
    assert.strictEqual((await post(base, booking, 'wrong')).status, 401);
  } finally {
    server.close();
  }
});

test('rejects missing fields with 422 and lists them', async () => {
  const { server, base } = start();
  try {
    const res = await post(base, { customer_name: 'Jane' });
    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.ok(body.errors.customer_email);
    assert.ok(body.errors.service_name);
    assert.ok(!body.errors.customer_name);
  } finally {
    server.close();
  }
});

test('unknown notification id returns 404', async () => {
  const { server, base } = start();
  try {
    assert.strictEqual((await fetch(`${base}/notifications/999`)).status, 404);
  } finally {
    server.close();
  }
});
