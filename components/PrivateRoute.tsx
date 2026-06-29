/**
 * Private Route Component
 *
 * Wrapper component that protects routes requiring authentication.
 * Shows loading state during auth check and redirects to login if unauthenticated.
 *
 * @fileoverview This component implements route protection using the AuthContext,
 * displaying a loading spinner during authentication verification and redirecting
 * unauthorized users to the login page with state preservation.
 *
 * @dependencies react, react-router-dom, ../context/AuthContext
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

// ============================================================================
// PROP TYPES
// ============================================================================

/**
 * Props for the PrivateRoute component.
 *
 * @interface PrivateRouteProps
 */
interface PrivateRouteProps {
  /** Child content to render if authenticated */
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Protected route wrapper component.
 *
 * Checks authentication status before rendering children.
 * Shows loading spinner during auth check, redirects to login if not authenticated.
 *
 * @component PrivateRoute
 * @param {PrivateRouteProps} props - Component props
 * @returns {JSX.Element} Protected content, loading state, or redirect
 *
 * @example
 * ```tsx
 * <PrivateRoute>
 *   <Dashboard />
 * </PrivateRoute>
 * ```
 *
 * @remarks
 * - Preserves attempted location in navigation state
 * - Uses replace: true to prevent back button issues
 * - Loading state prevents flash of unauthorized content
 * - Integrates with AuthContext for auth state management
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  /**
   * Loading state display.
   * Shows spinner while authentication is being verified.
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  /**
   * Redirect to login if not authenticated.
   * Saves attempted location for post-login redirect.
   */
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
