import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Alert from '../components/Alert';
import Field from '../components/Field';
import PasswordField from '../components/PasswordField';
import { hasErrors, validateRegister } from '../validate';

const emptyForm = { name: '', email: '', phone: '', password: '', password_confirmation: '' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const found = validateRegister(form);
    setErrors(found);
    if (hasErrors(found)) return;

    setBusy(true);
    try {
      await register({ ...form, email: form.email.trim() }); // logs in automatically
      navigate('/');
    } catch (err) {
      // 422 → Laravel's field errors (e.g. "The email has already been taken.") under each field
      if (err.status === 422) setErrors(err.errors);
      else setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Create an account</h1>
      <p className="muted">You'll use it to book and see your appointments.</p>

      <form className="panel form" onSubmit={handleSubmit} noValidate>
        <Alert>{formError}</Alert>

        <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={update('name')} error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
        <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} error={errors.phone} />
        <PasswordField label="Password" name="password" autoComplete="new-password" hint="At least 8 characters." value={form.password} onChange={update('password')} error={errors.password} />
        <PasswordField label="Confirm password" name="password_confirmation" autoComplete="new-password" value={form.password_confirmation} onChange={update('password_confirmation')} error={errors.password_confirmation} />

        <button className="button" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
      </form>

      <p className="below-form">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
