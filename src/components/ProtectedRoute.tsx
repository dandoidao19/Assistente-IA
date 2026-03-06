import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../store';

export function ProtectedRoute() {
  const user = useAppStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
