/**
 * Page Transition Component
 *
 * Wraps children in a fade transition effect when route changes.
 * Provides smooth visual feedback during navigation between pages.
 *
 * @fileoverview This component creates a fade-in/fade-out effect for page transitions,
 * using React Router's location to detect route changes and schedule transitions.
 *
 * @dependencies react, react-router-dom
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// ============================================================================
// PROP TYPES
// ============================================================================

/**
 * Props for the PageTransition component.
 *
 * @interface PageTransitionProps
 */
interface PageTransitionProps {
  /** Child content to wrap with transition effect */
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Page transition wrapper component.
 *
 * Creates a smooth fade effect when navigating between routes.
 * Displays old content during transition, then swaps to new content.
 *
 * @component PageTransition
 * @param {PageTransitionProps} props - Component props
 * @returns {JSX.Element} Wrapped content with transition effect
 *
 * @example
 * ```tsx
 * <PageTransition>
 *   <Outlet />
 * </PageTransition>
 * ```
 *
 * @remarks
 * - 300ms transition duration
 * - Uses CSS opacity for smooth fading
 * - Half-delay content swap for seamless appearance
 * - Only triggers on pathname changes
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  /**
   * Handles route changes with fade effect.
   * Fades out current content, swaps to new content, fades in.
   */
  useEffect(() => {
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 300); // Half of the total transition time

    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  return (
    <div className="relative w-full h-full">
      {/* Content with very gentle, slow fade */}
      <div
        className={`transition-opacity duration-600 ease-in-out ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {displayChildren}
      </div>
    </div>
  );
};

export default PageTransition;
