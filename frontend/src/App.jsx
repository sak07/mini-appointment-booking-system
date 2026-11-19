// Header + the list of pages (routes).
import { useCallback, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ConfirmDialog from './components/ConfirmDialog';
import Toast from './components/Toast';
import Protected from './components/Protected';
import AdminDashboard from './pages/AdminDashboard';
import BookAppointment from './pages/BookAppointment';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import Register from './pages/Register';
import ServiceDetails from './pages/ServiceDetails';
import Services from './pages/Services';

function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="muted">The link may be old or mistyped.</p>
      <Link to="/">Go to services</Link>
    </div>
  );
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmingLogout, setConfirmingLogout] = useState(false); // is the "Log out?" dialog open
  const [loggingOut, setLoggingOut] = useState(false); // request in progress → "Logging out..."
  const [toast, setToast] = useState(''); // message shown at the bottom of the screen

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setConfirmingLogout(false);
    navigate('/');
    setToast("You've been logged out.");
  }

  // useCallback keeps the same function between renders, so the Toast's timer isn't restarted on every render.
  const closeToast = useCallback(() => setToast(''), []);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">BookEasy</Link>
          <nav className="nav">
            <NavLink to="/" end>Services</NavLink>
            {user && <NavLink to="/my-bookings">My bookings</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
            {user ? (
              <button type="button" className="nav-button" onClick={() => setConfirmingLogout(true)}>
                Log out
              </button>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <NavLink to="/register" className="nav-cta">Create account</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <ConfirmDialog
        open={confirmingLogout}
        title="Log out?"
        message="You'll need to log in again to book or see your bookings."
        confirmLabel="Log out"
        busy={loggingOut}
        busyLabel="Logging out..."
        onConfirm={handleLogout}
        onCancel={() => setConfirmingLogout(false)}
      />

      <Toast message={toast} onClose={closeToast} />

      <main className="container">
        <Routes>
          <Route path="/" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book/:serviceId" element={<Protected><BookAppointment /></Protected>} />
          <Route path="/my-bookings" element={<Protected><MyBookings /></Protected>} />
          <Route path="/my-bookings/:id" element={<Protected><BookingDetails /></Protected>} />
          <Route path="/admin" element={<Protected adminOnly><AdminDashboard /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
