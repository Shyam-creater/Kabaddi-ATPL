import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useSelector((state: any) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin' && user?.role !== 'TH' && user?.role !== 'super_admin' && user?.role !== 'scorer') {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
