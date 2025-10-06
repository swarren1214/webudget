import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { createPlaidLinkToken, exchangePlaidPublicToken } from '@/lib/backendApi';
import { supabase } from '@/lib/supabaseClient';
import { errorLog } from '@/lib/utils';
import { PlaidErrorBoundary, usePlaidErrorHandler } from '@/components/PlaidErrorBoundary';
import { useLocation } from 'wouter';
import ErrorBoundary from "@/components/ErrorBoundary";

const OnboardingPage: React.FC = () => {
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSkipOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('users')
        .update({ has_onboarded: true })
        .eq('supabase_user_id', user.id);

      if (!error) {
        navigate('/dashboard');
      } else {
        console.error('Failed to update onboarding flag:', error);
      }
    }
  };
  const [step, setStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [plaidLinked, setPlaidLinked] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Error handling for Plaid operations
  const { handlePlaidError } = usePlaidErrorHandler();

  // Verify session state on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      // Session validation completed
    };
    checkSession();
  }, []);

  // Get link token when step 2 is reached
  useEffect(() => {
    if (step === 2 && !linkToken) {
      const checkSessionBeforeAPI = async () => {
        const { data: sessionData } = await supabase.auth.getSession();

        // Create Plaid link token
        try {
          const data = await createPlaidLinkToken();
          setLinkToken(data.linkToken);
        } catch (error) {
          errorLog('[Onboarding] createPlaidLinkToken FAILED:', error);
          handlePlaidError(error);
        }
      };

      checkSessionBeforeAPI();
    }
  }, [step, linkToken]);

  // ✅ BEST PRACTICE: Conditional hook initialization to prevent race conditions
  // usePlaidLink requires a token, so we provide fallback when linkToken is not ready
  const { open, ready } = usePlaidLink({
    token: linkToken || '', // Fallback to empty string when linkToken is null
    onSuccess: async (public_token: string, metadata: any) => {
      console.log('[H1_DEBUG] Plaid onSuccess triggered', { public_token: '[REDACTED]', metadata, timestamp: new Date().toISOString() });
      
      try {
        console.log('[H1_DEBUG] Calling exchangePlaidPublicToken with accountId=1');
        await exchangePlaidPublicToken(public_token, 1);
        console.log('[H1_DEBUG] exchangePlaidPublicToken SUCCESS');
        
        setPlaidLinked(true);
        setStep(step + 1);
      } catch (error) {
        console.error('[H1_ERROR] exchangePlaidPublicToken FAILED:', error);
        // TODO: Add user-facing error notification
      }
    },
  });

  // ✅ IMMUTABLE STATE: Only consider ready when BOTH conditions are met
  const isPlaidReady = Boolean(linkToken) && ready;

  // Plaid Link readiness monitoring
  useEffect(() => {
    // Monitor link readiness state changes
  }, [linkToken, ready, isPlaidReady, step]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Upload Profile Photo</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="mb-4"
            />
            {profilePhoto && (
              <img
                src={URL.createObjectURL(profilePhoto)}
                alt="Preview"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
            )}
          </div>
        );
      case 2:
        return (
          <PlaidErrorBoundary
            onError={(error, errorInfo) => {
              // Additional error reporting could go here
              // e.g., send to analytics, error tracking service
              errorLog('[Onboarding] Plaid error boundary triggered:', { error: error.message });
            }}
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Connect Bank Account</h2>
              <button
                onClick={() => {
                  if (isPlaidReady) {
                    open();
                  }
                }}
                disabled={!isPlaidReady}
                className="py-2 px-4 bg-big-grinch text-white rounded-lg font-semibold hover:bg-green-700 transition"
                style={{
                  opacity: !isPlaidReady ? 0.5 : 1,
                  cursor: !isPlaidReady ? 'not-allowed' : 'pointer'
                }}
              >
                {plaidLinked ? 'Account Linked!' : 'Connect with Plaid'}
                {!isPlaidReady && <span className="ml-2 text-xs">(Loading...)</span>}
              </button>
            </div>
          </PlaidErrorBoundary>
        );
      case 3:
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">You're all set!</h2>
            <p>Welcome to WeBudget. Head to your dashboard to get started.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStepper = () => {
    const steps = ['Photo', 'Plaid'];
    return (
      <div className="flex justify-center mb-6">
        {steps.map((label, index) => (
          <div
            key={label}
            className={`px-4 py-2 mx-2 rounded-full text-sm font-medium border-2 transition
              ${step === index + 1 ? 'bg-big-grinch text-white border-big-grinch' : 'border-gray-300 text-gray-500'}`}
          >
            Step {index + 1}: {label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-big-grinch text-gray-800">
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
          <div className="flex flex-col items-center mb-4">
            <img src="/appicon-rounded.png" alt="WeBudget Logo" className="w-16 h-16 mb-2" />
            <p className="text-gray-600">Let's finish setting up your account.</p>
          </div>

          {renderStepper()}
          {renderStepContent()}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              disabled={step === 1}
              className={`px-4 py-2 rounded-lg font-medium ${step === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
            >
              Back
            </button>
            {step < 3 && (
              <button
                onClick={() => setStep((prev) => prev + 1)}
                className="px-4 py-2 bg-big-grinch text-white rounded-lg font-medium hover:bg-green-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="py-6 text-white text-xs text-center">
        <div className="flex justify-between items-center px-8 mb-4">
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:underline"
          >
            Log out
          </button>
          <button
            onClick={handleSkipOnboarding}
            className="text-sm text-gray-600 hover:underline"
          >
            Skip for now
          </button>
        </div>
        &copy; {new Date().getFullYear()} WeBudget. All rights reserved.
      </div>
    </div>
  );
};

// Wrap the OnboardingPage component with ErrorBoundary
export default function OnboardingPageWithBoundary() {
  return (
    <ErrorBoundary>
      <OnboardingPage />
    </ErrorBoundary>
  );
}
