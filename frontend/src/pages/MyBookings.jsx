import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../format';

export default function MyBookings() {
  const [bookings, setBookings] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reload, setReload] = useState(0); // change to load the list again

  // Laravel returns only this customer's bookings.
  useEffect(() => {
    api('/appointments')
      .then((res) => setBookings(res.data))
      .catch((err) => {
        setError(err.message);
        setBookings([]);
      });
  }, [reload]);

  const [toCancel, setToCancel] = useState(null); // booking waiting for confirmation → dialog is open
  const [cancelling, setCancelling] = useState(false); // request in progress → "Cancelling..."

  // Runs when "Cancel booking" is clicked in the dialog.
  async function confirmCancel() {
    const booking = toCancel;
    setError('');
    setMessage('');
    setCancelling(true);
    try {
      await api(`/appointments/${booking.id}/status`, { method: 'PATCH', body: { status: 'cancelled' } });
      setMessage(
        `Cancelled ${booking.service.name} on ${formatDate(booking.appointment_date)} at ${booking.appointment_time}.`,
      );
      setReload((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
      setToCancel(null);
    }
  }

  return (
    <div className="page narrow">
      <h1>My bookings</h1>

      <Alert type="success">{message}</Alert>
      <Alert>{error}</Alert>
      {bookings === null && <p className="muted">Loading...</p>}

      {bookings?.length === 0 && !error && (
        <div className="empty">
          <p>You don't have any bookings yet.</p>
          <Link className="button" to="/">
            Browse services
          </Link>
        </div>
      )}

      {bookings?.length > 0 && (
        <ul className="booking-list">
          {bookings.map((b) => (
            <li key={b.id} className="booking-row">
              <div>
                <Link className="booking-title" to={`/my-bookings/${b.id}`}>
                  {b.service?.name}
                </Link>
                <p className="muted">
                  {formatDate(b.appointment_date)} at {b.appointment_time}, ref #{b.id}
                </p>
              </div>
              <div className="booking-actions">
                <StatusBadge status={b.status} />
                <Link
                  className="button secondary small"
                  to={`/my-bookings/${b.id}`}
                  aria-label={`View booking #${b.id}`}
                >
                  View
                </Link>
                {['pending', 'confirmed'].includes(b.status) && (
                  <button type="button" className="button secondary small" onClick={() => setToCancel(b)}>
                    Cancel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toCancel !== null}
        title="Cancel this booking?"
        message={
          toCancel &&
          `${toCancel.service.name} on ${formatDate(toCancel.appointment_date)} at ${toCancel.appointment_time}. The time will be offered to other customers.`
        }
        cancelLabel="Keep booking"
        confirmLabel="Cancel booking"
        danger
        busy={cancelling}
        busyLabel="Cancelling..."
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </div>
  );
}
