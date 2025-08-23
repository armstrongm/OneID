// =============================================================================
// FIXED SIGN-IN PAGE
// =============================================================================

// pages/auth/signin.js - Updated with better error handling
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/router';

function OneIDLogo({ className = "w-16 h-16" }) {
  return (
    <div className={`${className} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="48" height="48" fill="#2563eb" rx="4" />
        <rect x="52" y="0" width="48" height="48" fill="#f97316" rx="4" />
        <rect x="0" y="52" width="48" height="48" fill="#059669" rx="4" />
      </svg>
    </div>
  );
}

export default function SignInPage() {
  const { signIn, isAuthenticated, loading, error } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    // Check configuration on component mount
    const environmentId = process.env.NEXT_PUBLIC_PINGONE_ENVIRONMENT_ID;
    const clientId = process.env.NEXT_PUBLIC_PINGONE_CLIENT_ID;
    console.log(environmentId);
    console.log(clientId);
    if (!environmentId || !clientId) {
      setConfigError('PingOne configuration is missing. Please check environment variables.');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSignIn = async () => {
    if (configError) return;
    
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <OneIDLogo className="w-16 h-16 mx-auto mb-4" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <OneIDLogo className="w-20 h-20" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to OneID Manager
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Manage your Active Directory environment
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Configuration Error */}
          {configError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-700">
                <strong>Configuration Error:</strong> {configError}
              </div>
              <div className="mt-2 text-xs text-red-600">
                Please check your .env.local file contains:
                <br />• NEXT_PUBLIC_PINGONE_ENVIRONMENT_ID
                <br />• NEXT_PUBLIC_PINGONE_CLIENT_ID
              </div>
            </div>
          )}

          {/* Authentication Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-700">
                <strong>Sign-in Error:</strong> {error}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                Sign in with your organization account using PingOne
              </p>
              
              <button
                onClick={handleSignIn}
                disabled={isSigningIn || configError}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecting to PingOne...
                  </div>
                ) : (
                  'Sign in with PingOne'
                )}
              </button>
            </div>

            {/* Debug Information (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Environment ID: {process.env.NEXT_PUBLIC_PINGONE_ENVIRONMENT_ID ? '✓ Set' : '✗ Missing'}</div>
                  <div>Client ID: {process.env.NEXT_PUBLIC_PINGONE_CLIENT_ID ? '✓ Set' : '✗ Missing'}</div>
                  <div>Region: {process.env.NEXT_PUBLIC_PINGONE_REGION || 'NA (default)'}</div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Secure authentication powered by</span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="text-lg font-semibold text-blue-600">PingOne</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}