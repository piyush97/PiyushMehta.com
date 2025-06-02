import { useEffect, useState } from 'react';

interface NewsletterSubscriptionProps {
  className?: string;
  variant?: 'default' | 'sidebar' | 'modal';
  title?: string;
  description?: string;
}

export default function NewsletterSubscription({
  className = '',
  variant = 'default',
  title = 'Stay Updated',
  description = 'Get notified about new blog posts, tech talks, and interesting insights.',
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (emailError && validateEmail(value)) {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setEmail('');
        setEmailError('');
        setShowConfetti(true);

        // Reset confetti after animation
        setTimeout(() => setShowConfetti(false), 3000);

        // Reset success message after 10 seconds
        setTimeout(() => setSubmitStatus('idle'), 10000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(
          result.message || 'Failed to subscribe. Please try again later.'
        );
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to subscribe. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confetti animation
  useEffect(() => {
    if (showConfetti) {
      const confettiContainer = document.querySelector('.newsletter-confetti');
      if (confettiContainer) {
        confettiContainer.classList.add('animate-confetti');
        setTimeout(() => {
          confettiContainer.classList.remove('animate-confetti');
        }, 3000);
      }
    }
  }, [showConfetti]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'sidebar':
        return 'p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20';
      case 'modal':
        return 'p-8 bg-surface-primary rounded-2xl shadow-2xl border border-card-border max-w-lg';
      default:
        return 'pt-8 mt-12 border-t border-card-border';
    }
  };

  return (
    <div
      className={`newsletter-subscription relative ${getVariantStyles()} ${className}`}
    >
      {/* Confetti Container */}
      <div className="newsletter-confetti absolute inset-0 pointer-events-none overflow-hidden">
        {showConfetti && (
          <div className="confetti-pieces">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="confetti-piece absolute w-2 h-2 bg-accent rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className={`${variant === 'default' ? 'max-w-md mx-auto md:mx-0' : ''}`}
      >
        {/* Header */}
        <div className="mb-6">
          <h4
            className={`font-semibold text-text-primary mb-3 ${
              variant === 'modal' ? 'text-2xl' : 'text-lg'
            }`}
          >
            {title}
          </h4>
          <p
            className={`text-text-secondary ${
              variant === 'modal' ? 'text-base' : 'text-sm'
            }`}
          >
            {description}
          </p>
        </div>

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg animate-fadeIn">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium">Successfully subscribed! 🎉</p>
                <p className="text-sm mt-1">
                  You'll receive an email confirmation shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Form */}
        <form onSubmit={handleSubmit} className="newsletter-form">
          <div
            className={`flex gap-3 ${variant === 'modal' ? 'flex-col' : 'flex-col sm:flex-row'}`}
          >
            <div className="flex-1">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email address"
                  className={`w-full px-4 py-3 bg-surface-secondary border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 ${
                    emailError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-card-border'
                  }`}
                  disabled={isSubmitting}
                />
                {email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validateEmail(email) ? (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email || !validateEmail(email)}
              className={`px-6 py-3 bg-accent text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-primary whitespace-nowrap ${
                isSubmitting || !email || !validateEmail(email)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-accent/90 transform hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Subscribing...
                </span>
              ) : (
                'Subscribe'
              )}
            </button>
          </div>

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="mt-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <p className="mt-4 text-xs text-text-secondary">
            By subscribing, you agree to receive email updates. You can
            unsubscribe at any time. We respect your privacy and never share
            your information.
          </p>
        </form>

        {/* Features */}
        {variant === 'modal' && (
          <div className="mt-8 pt-6 border-t border-card-border">
            <h5 className="text-sm font-medium text-text-primary mb-3">
              What you'll get:
            </h5>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-accent flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                New blog posts and tutorials
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-accent flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Tech talk announcements
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-accent flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Exclusive development insights
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
