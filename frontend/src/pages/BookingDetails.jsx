// One booking's details page: /my-bookings/:id
// Opened from My bookings. Shows the receipt, the status, whether the confirmation email was sent,
// and lets the customer cancel. Laravel only returns the booking if it's yours (or you're an admin).
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import Alert from '../components/Alert';
import BackLink from '../components/BackLink';
import BookingReceipt from '../components/BookingReceipt';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../format';

export default function BookingDetails() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false); // "Cancel this booking?" dialog open
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api(`/appointments/${id}`)
      .then((res) => setBooking(res.data))
      .catch((err) =>
        setError(err.status === 404 || err.status === 403 ? "This booking doesn't exist or isn't yours." : err.message),
      );
  }, [id]);

  async function cancelBooking() {
    setCancelling(true);
    try {
      const res = await api(`/appointments/${booking.id}/status`, { method: 'PATCH', body: { status: 'cancelled' } });
      setBooking(res.data); // the updated booking (status = cancelled)
      setMessage('Booking cancelled. The time is free for other customers again.');
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
      setConfirming(false);
    }
  }

  const canCancel = booking && ['pending', 'confirmed'].includes(booking.status);

  return (
    <div className="page narrow">
      <BackLink to="/my-bookings">Back to my bookings</BackLink>

      <Alert type="success">{message}</Alert>
      <Alert>{error}</Alert>
      {!booking && !error && <p className="muted">Loading...</p>}

      {booking && (
        <>
          <div className="details-head">
            <h1>{booking.service.name}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="muted lead">
            {formatDate(booking.appointment_date)} at {booking.appointment_time}
          </p>

          <section className="panel">
            <BookingReceipt booking={booking} emailSent={Boolean(booking.notification_sent_at)} />

            <div className="actions">
              {canCancel && (
                <button type="button" className="button secondary" onClick={() => setConfirming(true)}>
                  Cancel booking
                </button>
              )}
              <Link className="button secondary" to={`/book/${booking.service.id}`}>
                Book this service again
              </Link>
            </div>
          </section>

          <ConfirmDialog
            open={confirming}
            title="Cancel this booking?"
            message={`${booking.service.name} on ${formatDate(booking.appointment_date)} at ${booking.appointment_time}. The time will be offered to other customers.`}
            cancelLabel="Keep booking"
            confirmLabel="Cancel booking"
            danger
            busy={cancelling}
            busyLabel="Cancelling..."
            onConfirm={cancelBooking}
            onCancel={() => setConfirming(false)}
          />
        </>
      )}
    </div>
  );
}
