// On/off toggle switch, e.g. a service's Active / Disabled status.
// It's a <button role="switch">: screen readers announce it as a switch that is "on" or "off" (aria-checked).
export default function Switch({ checked, onChange, label, onText = 'On', offText = 'Off', disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      <span className="switch-text">{checked ? onText : offText}</span>
    </button>
  );
}
