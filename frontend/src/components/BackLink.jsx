// "Back" button shown at the top of the service details and booking pages.
import { Link } from 'react-router-dom';

export default function BackLink({ to, children }) {
  return (
    <Link to={to} className="back-link">
      {/* left chevron icon (decorative, so screen readers skip it) */}
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </Link>
  );
}
