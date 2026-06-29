/**
 * User Context
 *
 * React Context for managing user profile state across the application.
 * Provides access to the current user and logout functionality.
 *
 * @fileoverview This context manages the authenticated user's profile information,
 * making it available throughout the component tree without prop drilling.
 *
 * @dependencies react, ../types
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { createContext, useContext } from 'react';
import type { UserProfile } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Shape of the user context value.
 * Contains the current user profile and logout function.
 *
 * @interface UserContextType
 */
interface UserContextType {
  /** Current user profile, or null if no user is logged in */
  user: UserProfile | null;
  /** Function to log out the current user */
  logout: () => void;
  /** Function to update the current user profile */
  updateUser: (user: UserProfile) => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * React Context for user state management.
 *
 * @constant {React.Context<UserContextType | null>}
 */
const UserContext = createContext<UserContextType | null>(null);

/**
 * Provider component for the User Context.
 * Exports the Provider for use in App.tsx.
 *
 * @example
 * ```tsx
 * <UserProvider value={{ user: userProfile, logout: handleLogout }}>
 *   <App />
 * </UserProvider>
 * ```
 */
export const UserProvider = UserContext.Provider;

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook for accessing the user context.
 * Provides the current user profile and logout function.
 *
 * @function useUser
 * @returns {UserContextType} The user context value
 * @throws {Error} If used outside of a UserProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, logout } = useUser();
 *
 *   if (!user) {
 *     return <div>Please log in</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.name}!</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
