// A message box for errors that don't belong to one field (e.g. server not reachable)
// and for success messages. role="alert" makes screen readers read it out.
export default function Alert({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
