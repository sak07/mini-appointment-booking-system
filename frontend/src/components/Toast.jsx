// Small message at the bottom of the screen, e.g. "You've been logged out."
// Disappears by itself after a few seconds; × closes it straight away.
// role="status" makes screen readers announce it.
import { useEffect } from 'react';

export default function Toast({ message, onClose, duration = 4000 }) {
  // Start a timer whenever a new message appears; clear it if the message changes or closes first.
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div className="toast" role="status">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close message">
        ×
      </button>
    </div>
  );
}
