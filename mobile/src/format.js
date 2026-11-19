// Display helpers (same as the web app).

// "2026-11-20" → "Fri 20 Nov". Built from parts so the date never shifts by time zone.
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// 80 → "AED 80", 80.5 → "AED 80.50"
export function formatPrice(price) {
  return `AED ${Number.isInteger(price) ? price : Number(price).toFixed(2)}`;
}

// A Date → "YYYY-MM-DD" in the phone's own time zone.
export function toIsoDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
