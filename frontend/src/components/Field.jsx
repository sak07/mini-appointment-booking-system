// A form field: label, input, optional hint, and the error message under it.
// When there is an error the input gets a red border (CSS: [aria-invalid="true"])
// and screen readers announce the message (aria-describedby points to it).
export default function Field({ label, name, error, hint, ...inputProps }) {
  const errorId = `${name}-error`;
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {hint && <p className="hint">{hint}</p>}
      <input
        id={name}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
