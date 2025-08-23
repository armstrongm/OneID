// lib/auth.js - Robust solution with multiple persistence methods
import { createContext, useContext, useState, useEffect } from 'react';

const isClient = typeof window !== 'undefined';

const PINGONE_CONFIG = {
  get environmentId() {
    return process.env.NEXT_PUBLIC_PINGONE_ENVIRONMENT_ID;
  },
  get clientId() {
    return process.env.NEXT_PUBLIC_PINGONE_CLIENT_ID;
  },
  get region() {
    return process.env.NEXT_PUBLIC_PINGONE_REGION || 'NA';
  },
  get authority() {
    const regionMap = {
      'NA': 'https://auth.pingone.com',
      'EU': 'https://auth.pingone.eu',
      'APAC': 'https://auth.pingone.asia'
    };
    return `${regionMap[this.region]}/${this.environmentId}/as`;
  },
  get scope() {
    return 'openid profile email';
  },
  get redirectUri() {
    if (!isClient) {
      return process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com/auth/callback'
        : 'http://localhost:3000/auth/callback';
    }
    return `${window.location.origin}/auth/callback`;
  },
  get postLogoutRedirectUri() {
    if (!isClient) {
      return process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com/auth/signin'
        : 'http://localhost:3000/auth/signin';
    }
    return `${window.location.origin}/auth/signin`;
  }
};

// PKCE utility functions
function generateRandomString(length) {
  if (!isClient) return '';
  
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

async function generateCodeChallenge(codeVerifier) {
  if (!isClient) return '';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Enhanced storage with URL-based fallback for OAuth state
const persistentStorage = {
  // Store in URL hash for critical OAuth data that must survive redirects
  setOAuthState: (state, codeVerifier) => {
    if (!isClient) return false;
    
    console.log('🔐 Storing OAuth state in URL');
    
    try {
      // Create a compound state that includes the code verifier
      const compoundState = `${state}.${btoa(codeVerifier).replace(/[+/=]/g, '')}`;
      
      // Store in multiple places
      localStorage.setItem('oauth_state', state);
      localStorage.setItem('oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_code_verifier', codeVerifier);
      
      // Also encode in the state parameter itself as backup
      console.log('✅ OAuth state stored with compound state');
      return compoundState; // Return the compound state to use in OAuth
    } catch (error) {
      console.error('❌ Failed to store OAuth state:', error);
      return state; // Fallback to original state
    }
  },
  
  getOAuthState: (receivedState) => {
    if (!isClient) return null;
    
    console.log('🔍 Retrieving OAuth state, received state:', receivedState);
    
    try {
      let codeVerifier = null;
      let originalState = null;
      
      // Method 1: Extract from compound state
      if (receivedState && receivedState.includes('.')) {
        const parts = receivedState.split('.');
        originalState = parts[0];
        const encodedVerifier = parts[1];
        
        try {
          // Decode the verifier from the state
          const decoded = atob(encodedVerifier + '=='.slice(0, (4 - encodedVerifier.length % 4) % 4));
          if (decoded.length >= 43) {
            codeVerifier = decoded;
            console.log('✅ Retrieved code verifier from compound state');
          }
        } catch (e) {
          console.log('❌ Failed to decode verifier from state');
        }
      }
      
      // Method 2: Get from localStorage
      if (!codeVerifier) {
        codeVerifier = localStorage.getItem('oauth_code_verifier');
        originalState = localStorage.getItem('oauth_state');
        if (codeVerifier) console.log('✅ Retrieved code verifier from localStorage');
      }
      
      // Method 3: Get from sessionStorage
      if (!codeVerifier) {
        codeVerifier = sessionStorage.getItem('oauth_code_verifier');
        originalState = sessionStorage.getItem('oauth_state');
        if (codeVerifier) console.log('✅ Retrieved code verifier from sessionStorage');
      }
      
      console.log('🔑 OAuth state retrieval result:', {
        originalState,
        codeVerifierFound: !!codeVerifier,
        codeVerifierLength: codeVerifier ? codeVerifier.length : 0
      });
      
      return {
        state: originalState || receivedState,
        codeVerifier
      };
    } catch (error) {
      console.error('❌ Failed to retrieve OAuth state:', error);
      return null;
    }
  },
  
  clearOAuthState: () => {
    if (!isClient) return;
    
    console.log('🧹 Clearing OAuth state');
    try {
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_code_verifier');
    } catch (error) {
      console.error('❌ Failed to clear OAuth state:', error);
    }
  },
  
  // Regular storage methods for tokens
  setItem: (key, value) => {
    if (!isClient) return false;
    
    try {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`❌ Storage failed for ${key}:`, error);
      return false;
    }
  },
  
  getItem: (key) => {
    if (!isClient) return null;
    
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch (error) {
      console.error(`❌ Storage retrieval failed for ${key}:`, error);
      return null;
    }
  },
  
  removeItem: (key) => {
    if (!isClient) return;
    
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`❌ Storage removal failed for ${key}:`, error);
    }
  }
};

// Auth Context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  useEffect(() => {
    if (isClient) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = persistentStorage.getItem('pingone_access_token');
      const userInfo = persistentStorage.getItem('pingone_user_info');
      
      if (token && userInfo) {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('✅ User already authenticated');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    console.log('🧹 Clearing all auth data');
    persistentStorage.removeItem('pingone_access_token');
    persistentStorage.removeItem('pingone_user_info');
    persistentStorage.removeItem('pingone_id_token');
    persistentStorage.clearOAuthState();
  };

  const signIn = async () => {
    if (!isClient) {
      console.error('❌ signIn can only be called on the client side');
      return;
    }

    try {
      console.log('🚀 Starting sign-in process');
      setError(null);
      
      if (!PINGONE_CONFIG.environmentId || !PINGONE_CONFIG.clientId) {
        throw new Error('PingOne configuration is missing. Please check your environment variables.');
      }

      clearAuthData();

      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const baseState = generateRandomString(32);
      const nonce = generateRandomString(32);
      
      console.log('🔑 Generated PKCE values');
      
      // Store OAuth state with enhanced persistence
      const compoundState = persistentStorage.setOAuthState(baseState, codeVerifier);
      
      const authParams = new URLSearchParams({
        client_id: PINGONE_CONFIG.clientId,
        redirect_uri: PINGONE_CONFIG.redirectUri,
        response_type: 'code',
        scope: PINGONE_CONFIG.scope,
        state: compoundState, // Use compound state
        nonce: nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      const authUrl = `${PINGONE_CONFIG.authority}/authorize?${authParams.toString()}`;
      console.log('🔗 Redirecting to PingOne');
      
      // Store timestamp for debugging
      persistentStorage.setItem('auth_start_time', Date.now().toString());
      
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('❌ Error during sign in:', error);
      setError(error.message);
    }
  };

  const handleCallback = async (code, receivedState, error_param, error_description) => {
    if (!isClient) {
      console.error('❌ handleCallback can only be called on the client side');
      return false;
    }

    // Use a more robust check to prevent double processing
    if (isProcessingCallback) {
      console.log('⏳ Callback already in progress, returning early');
      return false;
    }

    try {
      setIsProcessingCallback(true);
      setError(null);
      
      console.log('🔄 Processing OAuth callback');
      
      if (error_param) {
        throw new Error(`OAuth error: ${error_description || error_param}`);
      }

      if (!code) {
        throw new Error('No authorization code received from PingOne');
      }

      console.log('📋 Received OAuth callback with code');
      
      // Retrieve OAuth state and code verifier
      const oauthData = persistentStorage.getOAuthState(receivedState);
      
      if (!oauthData || !oauthData.codeVerifier) {
        console.error('❌ CRITICAL: Could not retrieve code verifier');
        
        // Additional debugging
        const startTime = persistentStorage.getItem('auth_start_time');
        const timeDiff = startTime ? Date.now() - parseInt(startTime) : 'unknown';
        
        console.log('🕐 Debug info:', {
          timeSinceStart: timeDiff,
          receivedState,
          storageAvailable: !!window.localStorage
        });
        
        throw new Error('Authentication session lost during redirect. This may be due to browser security settings. Please try again.');
      }

      console.log('✅ Successfully retrieved code verifier');

      const requestBody = {
        code: code,
        redirectUri: PINGONE_CONFIG.redirectUri,
        codeVerifier: oauthData.codeVerifier
      };

      console.log('📤 Exchanging code for tokens');
      
      const tokenResponse = await fetch('/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Token exchange failed:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(`Token exchange failed: ${errorData.error || 'Unknown error'}`);
        } catch (parseError) {
          throw new Error(`Token exchange failed with status ${tokenResponse.status}`);
        }
      }

      const responseData = await tokenResponse.json();
      console.log('✅ Token exchange successful');

      const { tokens, userInfo } = responseData;

      if (!tokens?.access_token) {
        throw new Error('No access token received from PingOne');
      }

      if (!userInfo?.sub) {
        throw new Error('Invalid user information received from PingOne');
      }

      // Store authentication data
      persistentStorage.setItem('pingone_access_token', tokens.access_token);
      persistentStorage.setItem('pingone_user_info', JSON.stringify(userInfo));
      
      if (tokens.id_token) {
        persistentStorage.setItem('pingone_id_token', tokens.id_token);
      }
      
      // Clean up OAuth state
      persistentStorage.clearOAuthState();
      persistentStorage.removeItem('auth_start_time');
      
      setUser(userInfo);
      setIsAuthenticated(true);
      
      console.log('🎉 Authentication completed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      setError(error.message);
      clearAuthData();
      return false;
    } finally {
      // Always reset the processing flag
      setIsProcessingCallback(false);
    }
  };

  const signOut = async () => {
    if (!isClient) return;

    try {
      console.log('👋 Signing out');
      const idToken = persistentStorage.getItem('pingone_id_token');
      
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      
      if (idToken) {
        const logoutUrl = `${PINGONE_CONFIG.authority}/signoff?post_logout_redirect_uri=${encodeURIComponent(PINGONE_CONFIG.postLogoutRedirectUri)}`;
        window.location.href = logoutUrl;
      } else {
        window.location.href = '/auth/signin';
      }
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      setError(error.message);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    error,
    isProcessingCallback,
    signIn,
    signOut,
    handleCallback,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}