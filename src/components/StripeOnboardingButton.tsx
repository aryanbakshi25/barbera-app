'use client';

import React, { useState } from 'react';

interface StripeOnboardingButtonProps {
  hasAccount?: boolean;
}

export default function StripeOnboardingButton({ hasAccount = false }: StripeOnboardingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOnboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe-connect/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start onboarding');
      }

      if (data.url) {
        // Redirect to Stripe onboarding URL
        window.location.href = data.url;
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleOnboard}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-5 px-6 rounded-xl transition-colors duration-200 text-lg cursor-pointer"
        style={{ lineHeight: 2.5 }}
      >
        {isLoading 
          ? 'Loading...' 
          : hasAccount 
            ? 'Update Payment Settings (Test Mode)' 
            : 'Set Up Payouts (Test Mode)'}
      </button>
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

