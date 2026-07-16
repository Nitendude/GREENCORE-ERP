import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import type { Permission } from '../../utils/permissions';

export default function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { can } = useAuth();
  if (!can(permission)) {
    return <Navigate to="/forbidden" replace />;
  }
  return <>{children}</>;
}
