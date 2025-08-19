import React, { useEffect, useState } from 'react';
import { withErrorBoundary } from './ErrorBoundary';

// Safety check for React availability
if (typeof React === 'undefined' || !React.useState) {
  if (import.meta.env.DEV) {
    console.error('React is not available for GDPR component');
  }
}

interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  dataRetention: boolean;
}

interface GDPRConsentProps {
  /** Show consent banner on first visit */
  showBanner?: boolean;
  /** Callback when consent is given */
  onConsentChange?: (preferences: ConsentPreferences) => void;
  /** Custom privacy policy URL */
  privacyPolicyUrl?: string;
  /** Custom styling class */
  className?: string;
}

const GDPRConsent: React.FC<GDPRConsentProps> = ({
  showBanner = true,
  onConsentChange,
  privacyPolicyUrl = '/privacy-policy',
  className = '',
}) => {
  // Prevent hydration mismatch by ensuring component is mounted
  const [mounted, setMounted] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: false,
    marketing: false,
    functional: true, // Essential cookies are required
    dataRetention: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Ensure component is mounted before using browser APIs
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if consent has been given before (only after mounting)
  useEffect(() => {
    if (!mounted) return;

    try {
      const savedConsent = localStorage.getItem('gdpr-consent');
      const consentDate = localStorage.getItem('gdpr-consent-date');
      const privacyVersion = localStorage.getItem('privacy-policy-version');

      if (savedConsent && consentDate && privacyVersion) {
        const consentAge = Date.now() - parseInt(consentDate);
        const oneYear = 365 * 24 * 60 * 60 * 1000;

        // Show banner if consent is older than 1 year or privacy policy version changed
        if (consentAge > oneYear || privacyVersion !== '2024.1') {
          setShowConsentBanner(showBanner);
        } else {
          const saved = JSON.parse(savedConsent) as ConsentPreferences;
          setPreferences(saved);
          onConsentChange?.(saved);
        }
      } else {
        setShowConsentBanner(showBanner);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error reading GDPR consent from localStorage:', error);
      }
      setShowConsentBanner(showBanner);
    }
  }, [mounted, showBanner, onConsentChange]);

  const saveConsent = async (prefs: ConsentPreferences) => {
    setIsLoading(true);

    try {
      // Save to localStorage
      localStorage.setItem('gdpr-consent', JSON.stringify(prefs));
      localStorage.setItem('gdpr-consent-date', Date.now().toString());
      localStorage.setItem('privacy-policy-version', '2024.1');

      // Save to backend
      await fetch('/api/gdpr-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: prefs,
          privacyPolicyVersion: '2024.1',
        }),
      });

      setPreferences(prefs);
      setShowConsentBanner(false);
      setShowPreferences(false);
      onConsentChange?.(prefs);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error saving consent:', error);
      }
      // Still save locally if backend fails
      localStorage.setItem('gdpr-consent', JSON.stringify(prefs));
      localStorage.setItem('gdpr-consent-date', Date.now().toString());
      setPreferences(prefs);
      setShowConsentBanner(false);
      onConsentChange?.(prefs);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptAll = () => {
    const allConsent = {
      analytics: true,
      marketing: true,
      functional: true,
      dataRetention: true,
    };
    saveConsent(allConsent);
  };

  const acceptEssential = () => {
    const essentialOnly = {
      analytics: false,
      marketing: false,
      functional: true,
      dataRetention: false,
    };
    saveConsent(essentialOnly);
  };

  const handlePreferenceChange = (key: keyof ConsentPreferences, value: boolean) => {
    if (key === 'functional') return; // Functional cookies are required

    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const savePreferences = () => {
    saveConsent(preferences);
  };

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) return null;

  if (!showConsentBanner && !showPreferences) return null;

  return (
    <>
      {/* Consent Banner */}
      {showConsentBanner && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-card border-t border-card-border shadow-lg ${className}`}
        >
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-2">🍪 We use cookies</h3>
                <p className="text-sm text-text-secondary">
                  We use cookies and similar technologies to enhance your browsing experience,
                  analyze site traffic, and provide personalized content. By continuing to use this
                  site, you consent to our use of cookies in accordance with our{' '}
                  <a
                    href={privacyPolicyUrl}
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  disabled={isLoading}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
                >
                  Customize
                </button>
                <button
                  type="button"
                  onClick={acceptEssential}
                  disabled={isLoading}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  disabled={isLoading}
                  className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Accept All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-gradient-card border border-card-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Cookie Preferences</h2>
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
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

              <div className="space-y-6">
                {/* Functional Cookies */}
                <div className="p-4 bg-light-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-text-primary">Essential Cookies</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        These cookies are necessary for the website to function and cannot be
                        disabled.
                      </p>
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Required
                    </div>
                  </div>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li>• Session management and authentication</li>
                    <li>• Security and CSRF protection</li>
                    <li>• Basic site functionality</li>
                  </ul>
                </div>

                {/* Analytics Cookies */}
                <div className="p-4 bg-light-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-text-primary">Analytics Cookies</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Help us understand how visitors interact with our website.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li>• Page view tracking</li>
                    <li>• User behavior analysis</li>
                    <li>• Performance monitoring</li>
                  </ul>
                </div>

                {/* Marketing Cookies */}
                <div className="p-4 bg-light-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-text-primary">Marketing Cookies</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Used to track visitors and display relevant advertisements.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li>• Targeted advertising</li>
                    <li>• Social media integration</li>
                    <li>• Newsletter personalization</li>
                  </ul>
                </div>

                {/* Data Retention */}
                <div className="p-4 bg-light-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-text-primary">Data Retention</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Agree to store your data for up to {process.env.DATA_RETENTION_DAYS || 365}{' '}
                        days for service improvement.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.dataRetention}
                        onChange={(e) => handlePreferenceChange('dataRetention', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li>• Profile and preference storage</li>
                    <li>• Comment history</li>
                    <li>• Usage patterns for improvements</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  disabled={isLoading}
                  className="btn-secondary flex-1 py-2 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={savePreferences}
                  disabled={isLoading}
                  className="btn-primary flex-1 py-2 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>

              <p className="text-xs text-text-secondary mt-4 text-center">
                You can change these preferences at any time in our{' '}
                <a
                  href={privacyPolicyUrl}
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const WrappedGDPRConsent = withErrorBoundary(GDPRConsent);
export { WrappedGDPRConsent as GDPRConsent };
export default WrappedGDPRConsent;
