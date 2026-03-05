/**
 * Register Page
 *
 * User registration page with form validation and authentication integration.
 * Provides a polished UI for new users to create accounts with the application.
 *
 * @fileoverview This page implements a complete registration flow including form
 * validation, password confirmation, error handling, and integration with the
 * authentication context. Features a gradient background design and form controls.
 *
 * @dependencies react, react-router-dom, ../context/AuthContext
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Registration form data structure.
 * Contains all fields required for user registration.
 *
 * @interface RegisterFormData
 */
interface RegisterFormData {
  /** User's display name */
  name: string;
  /** User's email address for login */
  email: string;
  /** User's desired password */
  password: string;
  /** Password confirmation field */
  confirmPassword: string;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * User registration page component.
 *
 * Provides a registration form with validation, error handling, and
 * authentication integration. Features a modern gradient design with
 * form controls for name, email, password, and password confirmation.
 *
 * @component Register
 * @returns {JSX.Element} Registration page with form
 *
 * @example
 * ```tsx
 * <Route path="/register" element={<Register />} />
 * ```
 *
 * @remarks
 * - Password must be at least 6 characters
 * - Password and confirmation must match
 * - On success, redirects to home dashboard
 * - Shows loading state during registration
 * - Links to login page for existing users
 */
const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  /** Form field values */
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  /** Error message to display to user */
  const [error, setError] = useState('');

  /** Loading state during registration API call */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles input field changes.
   * Updates form state with new value for the changed field.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * Handles form submission.
   * Validates form data, attempts registration, handles errors.
   *
   * @async
   * @param {React.FormEvent} e - Form submit event
   * @throws Will display error message if validation fails or registration fails
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation: Passwords must match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validation: Password minimum length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Attempt registration via auth context
      await register(formData);
      // On success, navigate to home dashboard
      navigate('/home');
    } catch (err: any) {
      // Display error message from API or generic message
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        {/* Logo/Title */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/logo-sakae.png"
              alt="Sakae Logo"
              className="h-32 sm:h-40 md:h-48 w-auto object-contain drop-shadow-md"
            />
          </div>
          {/* <p className="text-gray-600">Create your account</p> */}
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Confirm your password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-linear-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Already have an account? Sign In
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
};

export default Register;
