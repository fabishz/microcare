import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface RoleRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    redirectTo?: string;
}

/**
 * RoleRoute Component
 * Protects routes based on user roles
 */
export function RoleRoute({ children, allowedRoles, redirectTo = '/dashboard' }: RoleRouteProps) {
    const { user, isAuthenticated } = useAuth();

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
}
