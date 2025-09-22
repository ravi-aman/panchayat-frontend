import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/toast/toastContext';
const PUBLIC_DASHBOARD_ROUTES = [
  '/',
  '/dashboard/startups',
  '/dashboard/msme',
  '/dashboard/government_policies',
  '/dashboard/funds',
  '/dashboard/reports',
  '/dashboard/knowledge_base',
  '/terms_of_service',
  '/privacy_policy',
];
interface ProtectedRouteProps {
  children?: React.ReactNode;
  authRoute?: boolean;
}

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, authRoute = false }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const valid = isAuthenticated();
  const verified = !!user?.isVerified;
  const isOnboardingRoute = location.pathname.startsWith('/auth/onboarding');
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const isPublicDetail = PUBLIC_DASHBOARD_ROUTES.some(
    (route) => route !== '/' && pathname.startsWith(route + '/'),
  );
  const isPublicAllowed = PUBLIC_DASHBOARD_ROUTES.includes(pathname) && !isPublicDetail;
  const toast = useToast();
  function showLoginRequiredToast() {
    toast.open({
      message: {
        heading: 'Login Required',
        content: 'You need to be logged in to access this page.',
      },
      duration: 5000,
      position: 'top-center',
      color: 'error',
    });
  }
  console.log(location, 'location in protected route');
  if (location.pathname === '/' && valid && location.state?.from == null) {
    return <Navigate to="/dashboard/startups" replace />;
  }

  if (isOnboardingRoute && valid && verified) {
    const from = (location.state as LocationState)?.from?.pathname || '/dashboard/startups';
    return <Navigate to={from} replace />;
  }

  if (authRoute && valid && !isOnboardingRoute) {
    const from = (location.state as LocationState)?.from?.pathname || '/dashboard/startups';
    return <Navigate to={from} replace />;
  }

  if (isPublicAllowed) {
    return children ? <>{children}</> : <Outlet />;
  }

  if (!authRoute && !valid) {
    showLoginRequiredToast();
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  if (!authRoute && valid && !verified && !isOnboardingRoute) {
    showLoginRequiredToast();
    return <Navigate to="/auth/onboarding" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
