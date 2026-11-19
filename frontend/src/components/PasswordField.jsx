// Password input with an eye icon button inside it.
// It's the same as <Field>, but remembers whether the password is visible
// and switches the input between type="password" and type="text".
import { useState } from 'react';

// Open eye = "show password"; eye with a line through it = "hide password".
function EyeIcon({ crossed }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M3 3l18 18" />}
    </svg>
  );
}

export default function PasswordField({ label, name, error, hint, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const errorId = `${name}-error`;

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {hint && <p className="hint">{hint}</p>}
      <div className="password-wrap">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        <button
          type="button" // so it doesn't submit the form
          className="password-toggle"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          title={visible ? 'Hide' : 'Show'}
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
