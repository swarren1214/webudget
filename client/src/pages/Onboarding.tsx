import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';
import ErrorBoundary from "@/components/ErrorBoundary";
import { useStandardPlaidIntegration } from "@/hooks/useStandardPlaidIntegration";
import { useToast } from "@/hooks/use-toast";

const OnboardingPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

  // Use standardized Plaid integration hook
  const { connectAccount, ready, isLoading: isPlaidLoading } = useStandardPlaidIntegration({
    onSuccess: (accountId) => {
      console.log('[Onboarding] Account connected successfully:', accountId);
      setPlaidLinked(true);
      setStep(step + 1);
      toast({
        title: "Success",
        description: "Account successfully connected.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('[Onboarding] Plaid connection failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect account. Please try again.",
        variant: "destructive",
      });
    },
  });

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
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Bank Account</h2>
            <button
              onClick={connectAccount}
              disabled={!ready || isPlaidLoading}
              className="py-2 px-4 bg-big-grinch text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {plaidLinked ? 'Account Linked!' : 'Connect with Plaid'}
              {isPlaidLoading && <span className="ml-2 text-xs">(Loading...)</span>}
            </button>
          </div>
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
