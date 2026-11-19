import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Alert from '../components/Alert';
import Field from '../components/Field';
import PasswordField from '../components/PasswordField';
import { hasErrors, validateLogin } from '../validate';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({}); // { field: message }
  const [formError, setFormError] = useState(''); // message for the whole form
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    // 1. Check in the browser first
    const found = validateLogin(form);
    setErrors(found);
    if (hasErrors(found)) return;

    // 2. Ask Laravel
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/'); // back to the page they wanted, or home
    } catch (err) {
      // Wrong email/password is about both fields, so show it once at the top.
      setFormError(err.status === 422 ? 'Email or password is incorrect. Check both and try again.' : err.message);
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Log in</h1>
      <p className="muted">Log in to book and manage your appointments.</p>

      <form className="panel form" onSubmit={handleSubmit} noValidate>
        <Alert>{formError}</Alert>

        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
        <PasswordField label="Password" name="password" autoComplete="current-password" value={form.password} onChange={update('password')} error={errors.password} />

        <button className="button" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
      </form>

      <p className="below-form">
        New here? <Link to="/register">Create an account</Link>
      </p>
      <p className="demo-note">
        Demo accounts: customer@example.com or admin@example.com, password <strong>password</strong>
      </p>
    </div>
  );
}
