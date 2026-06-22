import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Lazy loading Pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));

const DashboardsPage = lazy(() => import('../pages/DashboardsPage'));
const DashboardBuilderPage = lazy(() => import('../pages/DashboardBuilderPage'));
const DatasetsPage = lazy(() => import('../pages/DatasetsPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const UserManagementPage = lazy(() => import('../pages/UserManagementPage'));
const OrgSettingsPage = lazy(() => import('../pages/OrgSettingsPage'));

// Layouts
import AppLayout from '../features/dashboard-layout/components/AppLayout';
import AuthLayout from '../features/auth/components/AuthLayout';

// Loading Fallback
const ScreenSpinner = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// Route Guards
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const PublicOnlyRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboards" replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: 'register',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <RegisterPage />
              </Suspense>
            ),
          },
          {
            path: 'forgot-password',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <ForgotPasswordPage />
              </Suspense>
            ),
          },
          {
            path: 'reset-password',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <ResetPasswordPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  
  // Protected Workspace Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboards" replace />,
          },
          {
            path: 'dashboards',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <DashboardsPage />
              </Suspense>
            ),
          },
          {
            path: 'builder/:id',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <DashboardBuilderPage />
              </Suspense>
            ),
          },
          {
            path: 'datasets',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <DatasetsPage />
              </Suspense>
            ),
          },
          {
            path: 'reports',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <ReportsPage />
              </Suspense>
            ),
          },
          {
            path: 'users',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <UserManagementPage />
              </Suspense>
            ),
          },
          {
            path: 'settings',
            element: (
              <Suspense fallback={<ScreenSpinner />}>
                <OrgSettingsPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // Fallback Catch-All
  {
    path: '*',
    element: <Navigate to="/dashboards" replace />,
  },
]);
