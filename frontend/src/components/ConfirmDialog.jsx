// A small "Are you sure?" pop-up, using the browser's built-in <dialog> element.
// showModal() opens it on top of the page, moves keyboard focus into it and dims the background.
// Pressing Escape fires the dialog's "cancel" event, which we treat like the "back out" button.
//
// Props:
//   open            show / hide
//   title, message  text
//   confirmLabel    the action button, e.g. "Log out" / "Cancel booking"
//   cancelLabel     the "back out" button (default "Cancel"), e.g. "Keep booking"
//   danger          red action button for things that can't be undone
//   busy, busyLabel while the action runs: e.g. "Cancelling..." and both buttons disabled
import { useEffect, useId, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  busyLabel,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId(); // unique id, so two dialogs on one page don't clash

  // Open / close the real <dialog> when the `open` prop changes.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // let React state decide when it closes
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId}>{title}</h2>
      {message && <p className="muted">{message}</p>}
      <div className="dialog-actions">
        <button type="button" className="button secondary" onClick={onCancel} disabled={busy} autoFocus>
          {cancelLabel}
        </button>
        <button type="button" className={`button${danger ? ' danger' : ''}`} onClick={onConfirm} disabled={busy}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
