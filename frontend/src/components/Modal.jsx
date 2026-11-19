// A pop-up window for forms (e.g. "New service" / "Edit Beard Trim").
// Same idea as ConfirmDialog: the browser's built-in <dialog> element, opened with showModal(),
// which puts it on top, dims the page behind and moves keyboard focus inside.
// Escape or the × button closes it (unless `busy`, e.g. while saving).
import { useEffect, useId, useRef } from 'react';

export default function Modal({ open, title, onClose, busy = false, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // React state decides when it closes
        if (!busy) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close">
          ×
        </button>
      </div>
      {/* Only render the content while open, so the form starts fresh each time */}
      {open && children}
    </dialog>
  );
}
