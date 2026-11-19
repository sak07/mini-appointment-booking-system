import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import Alert from '../components/Alert';
import BackLink from '../components/BackLink';
import BookingReceipt from '../components/BookingReceipt';
import { formatDate, formatPrice, today } from '../format';

export default function BookAppointment() {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState({}); // { appointment_date, appointment_time }
  const [formError, setFormError] = useState('');
  const [booked, setBooked] = useState(null); // the created appointment → shows the confirmation
  const [busy, setBusy] = useState(false);
  const [reloadSlots, setReloadSlots] = useState(0); // change this number to fetch slots again

  // Load the service once.
  useEffect(() => {
    api(`/services/${serviceId}`)
      .then((res) => setService(res.data))
      .catch((err) =>
        setFormError(err.status === 404 ? "This service doesn't exist or is no longer offered." : err.message),
      );
  }, [serviceId]);

  // Load free/taken times whenever the date changes (or after a failed booking).
  useEffect(() => {
    if (!date) return;
    api(`/services/${serviceId}/availability?date=${date}`)
      .then((res) => setSlots(res.slots))
      .catch((err) => setFormError(err.message));
  }, [serviceId, date, reloadSlots]);

  function chooseDate(value) {
    setDate(value);
    setTime('');
    setErrors({});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!time) {
      setErrors({ appointment_time: 'Choose a time.' });
      return;
    }

    setBusy(true);
    try {
      const res = await api('/appointments', {
        method: 'POST',
        body: { service_id: Number(serviceId), appointment_date: date, appointment_time: time },
      });
      setBooked({ ...res.data, notificationSent: res.notification_sent });
    } catch (err) {
      if (err.status === 409) {
        // Someone else took the slot between loading the page and clicking Book.
        setErrors({ appointment_time: 'This time was just booked by someone else. Choose another time.' });
        setTime('');
        setReloadSlots((n) => n + 1);
      } else if (err.status === 422) {
        setErrors(err.errors);
        // e.g. the admin disabled this service while the page was open (no field to show it under)
        if (err.errors.service_id) setFormError(err.errors.service_id);
      } else {
        setFormError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function bookAnother() {
    setBooked(null);
    setTime('');
    setReloadSlots((n) => n + 1);
  }

  if (!service) {
    return (
      <div className="page narrow">
        <Alert>{formError}</Alert>
        {!formError && <p className="muted">Loading...</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <BackLink to={`/services/${service.id}`}>Back to {service.name}</BackLink>

      <div className="booking-layout">
        {/* Left: what is being booked */}
        <aside className="booking-summary">
          <h1>{service.name}</h1>
          <p className="muted">{service.description}</p>
          <dl className="facts">
            <div>
              <dt>Duration</dt>
              <dd>{service.duration_minutes} min</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{formatPrice(service.price)}</dd>
            </div>
          </dl>
        </aside>

        {/* Right: the form, or the confirmation after booking */}
        {booked ? (
          <section className="panel confirmation" aria-live="polite">
            <div className="confirmation-head">
              <span className="confirmation-icon" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <h2>You're booked</h2>
            </div>

            <BookingReceipt booking={booked} emailSent={booked.notificationSent} />
            <div className="actions">
              <Link className="button" to={`/my-bookings/${booked.id}`}>
                View booking
              </Link>
              <button type="button" className="button secondary" onClick={bookAnother}>
                Book another time
              </button>
            </div>
          </section>
        ) : (
          <form className="panel form" onSubmit={handleSubmit} noValidate>
            <Alert>{formError}</Alert>

            <div className="field">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                min={today()}
                value={date}
                onChange={(e) => chooseDate(e.target.value)}
                aria-invalid={errors.appointment_date ? 'true' : undefined}
              />
              {errors.appointment_date && <p className="field-error">{errors.appointment_date}</p>}
            </div>

            <fieldset className="field">
              <legend>Time</legend>
              <p className="hint">Crossed-out times are already booked or have passed.</p>
              <div className="slots">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    className={`slot${time === slot.time ? ' is-selected' : ''}`}
                    disabled={!slot.available}
                    aria-pressed={time === slot.time}
                    onClick={() => {
                      setTime(slot.time);
                      setErrors({});
                    }}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
              {errors.appointment_time && <p className="field-error">{errors.appointment_time}</p>}
            </fieldset>

            <button className="button" disabled={busy}>
              {busy ? 'Booking...' : time ? `Book ${time} on ${formatDate(date)}` : 'Book appointment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
