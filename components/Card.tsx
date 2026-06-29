/**
 * Navigation Card Component
 *
 * Interactive card component for navigating to different sections of the application.
 * Displays title, description, and icon with hover effects and color-coded top border.
 *
 * @fileoverview This component provides a reusable card UI for navigation, using
 * React Router's Link component for client-side navigation with visual feedback.
 *
 * @dependencies react, react-router-dom
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React from 'react';
import { Link } from 'react-router-dom';

// ============================================================================
// PROP TYPES
// ============================================================================

/**
 * Props for the Card component.
 *
 * @interface CardProps
 */
interface CardProps {
  /** Title displayed on the card */
  title: string;
  /** Brief description of the destination */
  description: string;
  /** Icon element to display */
  icon: React.ReactNode;
  /** Route path to navigate to */
  to: string;
  /** Tailwind color classes for the top border */
  color: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Interactive navigation card component.
 *
 * Displays a clickable card with an icon, title, and description.
 * Includes hover effects with elevation change and color-coded top border.
 *
 * @component Card
 * @param {CardProps} props - Component props
 * @returns {JSX.Element} Interactive navigation card
 *
 * @example
 * ```tsx
 * <Card
 *   title="Guided Learning"
 *   description="Structured lessons on grammar, vocabulary, and more."
 *   icon={<BookOpenIcon />}
 *   to="/guided-learning"
 *   color="border-t-green-500"
 * />
 * ```
 *
 * @remarks
 * - Uses Link for client-side navigation
 * - Shadow increases on hover with upward translation
 * - Top border color indicates content category
 */
const Card: React.FC<CardProps> = ({ title, description, icon, to, color }) => {
  return (
    <Link to={to} className={`block p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 ${color}`}>
      <div className="flex items-center space-x-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default Card;
