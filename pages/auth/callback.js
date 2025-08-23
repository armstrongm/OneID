// pages/auth/callback.js - Fixed to prevent double execution
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';

export default function AuthCallback() {
  const router = useRouter();
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const processedRef = useRef(false); // Prevent double processing

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only process callback once when router is ready and component is mounted
    if (!router.isReady || !mounted || processedRef.current) return;

    const processCallback = async () => {
      // Mark as processed immediately to prevent double execution
      processedRef.current = true;
      
      try {
        console.log('Processing OAuth callback...');
        console.log('Query params:', router.query);

        const { code, state, error: errorParam, error_description } = router.query;

        // Check for OAuth errors first
        if (errorParam) {
          const errorMessage = error_description || errorParam;
          console.error('OAuth error:', errorMessage);
          setError(errorMessage);
          setStatus('error');
          return;
        }

        // Check for required parameters
        if (!code) {
          console.error('No authorization code received');
          setError('No authorization code received from PingOne');
          setStatus('error');
          return;
        }

        console.log('Authorization code received, processing...');
        setStatus('processing');

        // Handle the callback using the auth context
        const success = await handleCallback(code, state, errorParam, error_description);

        if (success) {
          console.log('Callback processed successfully, redirecting...');
          setStatus('success');
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          console.error('Callback processing failed');
          setError('Authentication failed. Please try again.');
          setStatus('error');
        }

      } catch (error) {
        console.error('Callback processing error:', error);
        setError(error.message || 'An unexpected error occurred');
        setStatus('error');
      }
    };

    processCallback();
  }, [router.isReady, router.query, handleCallback, mounted]);

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Try Again
            </button>
            
            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                Go to Home
              </button>
            </div>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h4>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(router.query, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Successful
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Redirecting to dashboard...
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Default processing state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Processing Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete your sign-in...
          </p>
        </div>

        {/* Progress indicator */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h4>
            <div className="text-xs text-gray-600">
              <div>Router Ready: {router.isReady ? 'Yes' : 'No'}</div>
              <div>Code: {router.query.code ? 'Present' : 'Missing'}</div>
              <div>State: {router.query.state ? 'Present' : 'Missing'}</div>
              {router.query.error && <div>Error: {router.query.error}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}