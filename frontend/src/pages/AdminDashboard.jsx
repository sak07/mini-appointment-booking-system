import { useEffect, useState } from 'react';
import { api } from '../api';
import Alert from '../components/Alert';
import Field from '../components/Field';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import Switch from '../components/Switch';
import { formatDate, formatPrice } from '../format';
import { hasErrors, validateService } from '../validate';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const emptyService = { name: '', description: '', duration_minutes: '60', price: '' };

// The three tabs on this page: [id, label]
const TABS = [
  ['appointments', 'Appointments'],
  ['services', 'Services'],
  ['emails', 'Confirmation emails'],
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('appointments'); // which tab is open
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ---------- Appointments ----------
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState(''); // '' = all statuses
  const [reloadAppointments, setReloadAppointments] = useState(0);

  useEffect(() => {
    api(`/appointments${filter ? `?status=${filter}` : ''}`)
      .then((res) => setAppointments(res.data))
      .catch((err) => setError(err.message));
  }, [filter, reloadAppointments]);

  async function changeStatus(appointment, status) {
    setError('');
    try {
      await api(`/appointments/${appointment.id}/status`, { method: 'PATCH', body: { status } });
      setMessage(`Booking #${appointment.id} is now ${status}.`);
      setReloadAppointments((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- Services ----------
  const [services, setServices] = useState([]);
  const [reloadServices, setReloadServices] = useState(0);

  // One form for both adding and editing a service.
  // formMode: null = form hidden, 'add' = new service, or the service object being edited.
  const [formMode, setFormMode] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyService); // what's typed in the form
  const [serviceErrors, setServiceErrors] = useState({});
  const [savingService, setSavingService] = useState(false);
  const editing = formMode !== null && formMode !== 'add' ? formMode : null; // the service being edited, if any

  // ?all=1 → admins also get disabled services (customers never see them).
  useEffect(() => {
    api('/services?all=1')
      .then((res) => setServices(res.data))
      .catch((err) => setError(err.message));
  }, [reloadServices]);

  // Enable / disable a service with the switch. Disabled = hidden from customers and can't be booked;
  // existing bookings stay as they are. Uses the same update endpoint as Edit.
  const [togglingId, setTogglingId] = useState(null); // service whose switch is saving

  // Change one service's is_active in the list on screen.
  const setActive = (id, isActive) =>
    setServices((list) => list.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)));

  async function toggleService(service, isActive) {
    setError('');
    setMessage('');
    setActive(service.id, isActive); // flip the switch straight away...
    setTogglingId(service.id);
    try {
      await api(`/services/${service.id}`, { method: 'PUT', body: { is_active: isActive } }); // ...then save it
      setMessage(
        isActive
          ? `${service.name} is active again. Customers can book it.`
          : `${service.name} is disabled. Customers can't see or book it.`,
      );
    } catch (err) {
      setActive(service.id, !isActive); // saving failed → put the switch back
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  function openAddForm() {
    setMessage('');
    setServiceErrors({});
    setServiceForm(emptyService);
    setFormMode('add');
  }

  function openEditForm(service) {
    setMessage('');
    setServiceErrors({});
    // Inputs work with text, so turn the numbers into strings.
    setServiceForm({
      name: service.name,
      description: service.description ?? '',
      duration_minutes: String(service.duration_minutes),
      price: String(service.price),
    });
    setFormMode(service);
  }

  function closeServiceForm() {
    setFormMode(null);
    setServiceForm(emptyService);
    setServiceErrors({});
  }

  const updateForm = (field) => (e) => setServiceForm({ ...serviceForm, [field]: e.target.value });

  async function saveService(e) {
    e.preventDefault();
    const found = validateService(serviceForm);
    setServiceErrors(found);
    if (hasErrors(found)) return;

    setSavingService(true);
    try {
      if (editing) {
        await api(`/services/${editing.id}`, { method: 'PUT', body: serviceForm }); // update existing
        setMessage(`Saved changes to ${serviceForm.name}.`);
      } else {
        await api('/services', { method: 'POST', body: serviceForm }); // create new
        setMessage(`Added ${serviceForm.name}. Customers can book it now.`);
      }
      closeServiceForm();
      setReloadServices((n) => n + 1);
    } catch (err) {
      if (err.status === 422) setServiceErrors(err.errors);
      else setError(err.message);
    } finally {
      setSavingService(false);
    }
  }

  // ---------- Notification log (from the Node.js service, through Laravel) ----------
  const [notifications, setNotifications] = useState([]);
  const [notificationsDown, setNotificationsDown] = useState(false);
  const [reloadNotifications, setReloadNotifications] = useState(0);

  useEffect(() => {
    api('/admin/notifications')
      .then((res) => {
        setNotifications(res.data);
        setNotificationsDown(false);
      })
      .catch(() => setNotificationsDown(true));
  }, [reloadNotifications]);

  // Number shown next to each tab label (Appointments only when not filtered, so the number means "all").
  const counts = {
    appointments: filter ? null : appointments.length,
    services: services.length,
    emails: notificationsDown ? null : notifications.length,
  };

  function openTab(id) {
    setTab(id);
    setMessage(''); // messages belong to the tab they came from
    setError('');
  }

  return (
    <div className="page">
      <h1>Admin</h1>

      {/* Tabs: role="tablist"/"tab"/"tabpanel" + aria-selected tell screen readers which one is open */}
      <div className="tabs" role="tablist" aria-label="Admin sections">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            className={`tab${tab === id ? ' is-active' : ''}`}
            onClick={() => openTab(id)}
          >
            {label}
            {counts[id] !== null && <span className="tab-count">{counts[id]}</span>}
          </button>
        ))}
      </div>

      <Alert type="success">{message}</Alert>
      <Alert>{error}</Alert>

      {/* ---------- Tab 1: Appointments ---------- */}
      {tab === 'appointments' && (
        <section className="tab-panel" role="tabpanel" id="panel-appointments" aria-labelledby="tab-appointments">
          <div className="section-head">
            <p className="muted">Every customer's bookings. Change a status with the dropdown in the last column.</p>
            <label className="inline-label">
              Show
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">All</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {appointments.length === 0 ? (
            <p className="muted">No appointments{filter ? ` with status "${filter}"` : ''}.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>When</th>
                    <th>Status</th>
                    <th>Change status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>#{a.id}</td>
                      <td>
                        {a.user?.name}
                        <br />
                        <span className="muted small">{a.user?.email}</span>
                      </td>
                      <td>{a.service?.name}</td>
                      <td>
                        {formatDate(a.appointment_date)}, {a.appointment_time}
                      </td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>
                        <select
                          value={a.status}
                          onChange={(e) => changeStatus(a, e.target.value)}
                          aria-label={`Change status of booking #${a.id}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s[0].toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ---------- Tab 2: Services ---------- */}
      {tab === 'services' && (
        <section className="tab-panel" role="tabpanel" id="panel-services" aria-labelledby="tab-services">
          <div className="section-head">
            <p className="muted">All services. Disabled ones are hidden from customers and can't be booked.</p>
            <button type="button" className="button small" onClick={openAddForm}>
              Add service
            </button>
          </div>

          {/* Add / edit form in a pop-up: opened by "Add service" or a row's "Edit" */}
          <Modal
            open={formMode !== null}
            title={editing ? `Edit ${editing.name}` : 'New service'}
            onClose={closeServiceForm}
            busy={savingService}
          >
            <form className="form" onSubmit={saveService} noValidate>
              <Field
                label="Name"
                name="name"
                value={serviceForm.name}
                onChange={updateForm('name')}
                error={serviceErrors.name}
                autoFocus
              />
              <Field
                label="Description (optional)"
                name="description"
                value={serviceForm.description}
                onChange={updateForm('description')}
                error={serviceErrors.description}
              />
              <div className="field-row">
                <Field
                  label="Duration (minutes)"
                  name="duration_minutes"
                  type="number"
                  min="5"
                  value={serviceForm.duration_minutes}
                  onChange={updateForm('duration_minutes')}
                  error={serviceErrors.duration_minutes}
                />
                <Field
                  label="Price (AED)"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceForm.price}
                  onChange={updateForm('price')}
                  error={serviceErrors.price}
                />
              </div>
              <div className="dialog-actions">
                <button type="button" className="button secondary" onClick={closeServiceForm} disabled={savingService}>
                  Cancel
                </button>
                <button className="button" disabled={savingService}>
                  {savingService ? 'Saving...' : editing ? 'Save changes' : 'Save service'}
                </button>
              </div>
            </form>
          </Modal>

          {services.length === 0 ? (
            <p className="muted">No services yet. Add the first one.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th className="num">Duration</th>
                    <th className="num">Price</th>
                    <th>Status</th>
                    <th>
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className={s.is_active ? undefined : 'is-disabled'}>
                      <td>
                        <strong className="cell-title">{s.name}</strong>
                        {s.description && <span className="muted small cell-sub">{s.description}</span>}
                      </td>
                      <td className="num">{s.duration_minutes} min</td>
                      <td className="num">{formatPrice(s.price)}</td>
                      <td>
                        <Switch
                          checked={s.is_active}
                          onChange={(isActive) => toggleService(s, isActive)}
                          label={`${s.name} available to customers`}
                          onText="Active"
                          offText="Disabled"
                          disabled={togglingId === s.id}
                        />
                      </td>
                      <td className="row-actions">
                        <button
                          type="button"
                          className="button secondary small"
                          onClick={() => openEditForm(s)}
                          aria-label={`Edit ${s.name}`}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ---------- Tab 3: Confirmation emails (from the Node.js service, through Laravel) ---------- */}
      {tab === 'emails' && (
        <section className="tab-panel" role="tabpanel" id="panel-emails" aria-labelledby="tab-emails">
          <div className="section-head">
            <p className="muted">
              Sent by the notification service each time a booking is made (email delivery is simulated).
            </p>
            <button
              type="button"
              className="button secondary small"
              onClick={() => setReloadNotifications((n) => n + 1)}
            >
              Refresh
            </button>
          </div>

          {notificationsDown ? (
            <Alert>
              The notification service isn't running, so the log can't be shown. Start it and select Refresh.
            </Alert>
          ) : notifications.length === 0 ? (
            <p className="muted">No confirmations sent yet.</p>
          ) : (
            <ul className="simple-list">
              {notifications.map((n) => (
                <li key={n.id} className="notification">
                  <div>
                    <strong>{n.subject}</strong>
                    <p className="muted small">
                      To {n.recipient}: {n.message}
                    </p>
                  </div>
                  <span className="muted small">{new Date(n.created_at).toLocaleString('en-GB')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
