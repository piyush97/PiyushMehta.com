import React, { useState } from 'react';
import { withErrorBoundary } from './ErrorBoundary';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    is_admin: boolean;
  }) => void;
  initialMode?: 'login' | 'signup';
}

interface AuthFormData {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Signup-specific validation
    if (mode === 'signup') {
      if (!formData.name?.trim()) {
        newErrors.name = 'Name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: mode === 'signup' ? formData.name : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `${mode} failed`);
      }

      if (mode === 'signup') {
        setMessage({
          type: 'success',
          text: 'Account created successfully! Please check your email to verify your account.',
        });
        // Switch to login mode after successful signup
        setTimeout(() => {
          setMode('login');
          setMessage(null);
        }, 3000);
      } else {
        // Login successful
        setMessage({
          type: 'success',
          text: 'Login successful! Redirecting...',
        });

        // Set session cookie
        if (data.sessionToken) {
          document.cookie = `session-token=${data.sessionToken}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=strict`;
        }

        onSuccess?.(data.user);
        setTimeout(() => {
          onClose();
          window.location.reload(); // Refresh to update auth state
        }, 1000);
      }

      // Clear form
      setFormData({
        email: '',
        password: '',
        name: '',
        confirmPassword: '',
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`${mode} error:`, error);
      }
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `${mode} failed`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setMessage(null);
    setFormData({
      email: formData.email, // Keep email when switching
      password: '',
      name: '',
      confirmPassword: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-gradient-card border border-card-border rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-light-800 text-text-primary placeholder-text-secondary 
                    focus:ring-2 focus:ring-accent focus:border-transparent transition-colors
                    ${errors.name ? 'border-red-500' : 'border-card-border'}`}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-light-800 text-text-primary placeholder-text-secondary 
                  focus:ring-2 focus:ring-accent focus:border-transparent transition-colors
                  ${errors.email ? 'border-red-500' : 'border-card-border'}`}
                placeholder="Enter your email"
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-light-800 text-text-primary placeholder-text-secondary 
                  focus:ring-2 focus:ring-accent focus:border-transparent transition-colors
                  ${errors.password ? 'border-red-500' : 'border-card-border'}`}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password field (signup only) */}
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword || ''}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-light-800 text-text-primary placeholder-text-secondary 
                    focus:ring-2 focus:ring-accent focus:border-transparent transition-colors
                    ${errors.confirmPassword ? 'border-red-500' : 'border-card-border'}`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Mode switch */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={switchMode}
                disabled={isLoading}
                className="text-accent hover:underline font-medium disabled:opacity-50"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* GDPR Notice for signup */}
          {mode === 'signup' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                By creating an account, you agree to our{' '}
                <a
                  href="/privacy-policy"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href="/terms-of-service"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const WrappedAuthModal = withErrorBoundary(AuthModal);
export { WrappedAuthModal as AuthModal };
