// A booking shown as a small receipt + whether the confirmation email was sent.
// Used right after booking (BookAppointment) and on the booking details page (BookingDetails).
import { formatDate, formatPrice } from '../format';

export default function BookingReceipt({ booking, emailSent }) {
  const { service } = booking;

  return (
    <>
      <dl className="receipt">
        <div>
          <dt>Service</dt>
          <dd>{service.name}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{formatDate(booking.appointment_date)}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{booking.appointment_time}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{service.duration_minutes} min</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{formatPrice(service.price)}, pay at the studio</dd>
        </div>
        <div>
          <dt>Reference</dt>
          <dd>#{booking.id}</dd>
        </div>
      </dl>

      {/* Green when the notification service sent the email, amber when it couldn't */}
      {emailSent ? (
        <div className="email-status is-sent">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
          <p>
            Confirmation email sent to <strong>{booking.user?.email}</strong>.
          </p>
        </div>
      ) : (
        <div className="email-status is-not-sent">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3l10 18H2L12 3z" />
            <path d="M12 10v4" />
            <path d="M12 17.5v.5" />
          </svg>
          <p>
            <strong>Confirmation email not sent.</strong> Your booking is saved. Note your reference #{booking.id}.
          </p>
        </div>
      )}
    </>
  );
}
