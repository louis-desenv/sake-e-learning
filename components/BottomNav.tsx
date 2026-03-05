/**
 * Bottom Navigation Bar Component
 *
 * Fixed bottom navigation component providing quick access to main application sections.
 * Displays navigation items with icons and labels, highlighting the active route.
 *
 * @fileoverview This component renders a fixed bottom navigation bar that appears
 * on all authenticated pages, using React Router's NavLink for automatic active state detection.
 *
 * @dependencies react, react-router-dom, ../constants
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

// ============================================================================
// NAVIGATION ITEM TYPE
// ============================================================================

/**
 * Navigation item configuration.
 *
 * @interface NavItem
 */
interface NavItem {
  /** Route path for navigation */
  path: string;
  /** Display label for the navigation item */
  label: string;
  /** React element containing the icon */
  icon: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Fixed bottom navigation bar component.
 *
 * Provides navigation between main application sections with visual feedback
 * for the active route. Navigation items are configured in constants.
 *
 * @component BottomNav
 * @returns {JSX.Element} Fixed bottom navigation bar
 *
 * @example
 * ```tsx
 * <BottomNav />
 * ```
 *
 * @remarks
 * - Fixed positioning at bottom of viewport
 * - Glassmorphism effect with backdrop blur
 * - Active route highlighted in blue
 * - Hover states for interactive feedback
 */
const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-full">
        {NAV_ITEMS.map(({ path, label, icon }: NavItem) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`
            }
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
