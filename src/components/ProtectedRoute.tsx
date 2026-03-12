import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAppStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
