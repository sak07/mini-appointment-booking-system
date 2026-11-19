// Page guard: only logged-in users (or only admins) can open the wrapped page.
// Not logged in → go to Login, remembering where the user wanted to go,
// so Login can send them back there afterwards.
// (UI convenience only: the Laravel API checks permissions on every request.)
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Protected({ children, adminOnly = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  return children;
}
