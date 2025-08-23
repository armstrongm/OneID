// pages/api/auth/token.js - Enhanced Token Exchange API with better debugging
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('=== TOKEN EXCHANGE REQUEST ===');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Headers:', req.headers['content-type']);

  const { code, redirectUri, codeVerifier } = req.body;

  // Enhanced debugging
  const debug = {
    received: Object.keys(req.body),
    codePresent: !!code,
    redirectUriPresent: !!redirectUri,
    codeVerifierPresent: !!codeVerifier,
    codeVerifierLength: codeVerifier ? codeVerifier.length : 0
  };

  console.log('Debug info:', debug);

  // Validation with specific error messages
  if (!code) {
    console.error('Missing authorization code');
    return res.status(400).json({ 
      error: 'Missing authorization code',
      debug 
    });
  }

  if (!redirectUri) {
    console.error('Missing redirect URI');
    return res.status(400).json({ 
      error: 'Missing redirect URI',
      debug 
    });
  }

  if (!codeVerifier) {
    console.error('Missing code verifier - PKCE flow requires code_verifier');
    return res.status(400).json({ 
      error: 'Code verifier is required for PKCE flow',
      debug 
    });
  }

  // Validate code verifier format
  if (codeVerifier.length < 43 || codeVerifier.length > 128) {
    console.error('Invalid code verifier length:', codeVerifier.length);
    return res.status(400).json({ 
      error: 'Invalid code verifier length. Must be 43-128 characters.',
      debug: { ...debug, actualLength: codeVerifier.length }
    });
  }

  try {
    console.log('=== SERVER-SIDE TOKEN EXCHANGE ===');
    
    // Server-side environment variables
    const PINGONE_CONFIG = {
      environmentId: process.env.PINGONE_ENVIRONMENT_ID,
      clientId: process.env.PINGONE_CLIENT_ID,
      region: process.env.PINGONE_REGION || 'NA',
    };

    console.log('Environment check:', {
      environmentId: !!PINGONE_CONFIG.environmentId,
      clientId: !!PINGONE_CONFIG.clientId,
      region: PINGONE_CONFIG.region
    });

    // Validate server configuration
    if (!PINGONE_CONFIG.environmentId || !PINGONE_CONFIG.clientId) {
      console.error('Missing PingOne server configuration');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing PingOne environment variables on server'
      });
    }

    const regionMap = {
      'NA': 'https://auth.pingone.com',
      'EU': 'https://auth.pingone.eu',
      'APAC': 'https://auth.pingone.asia'
    };

    const authority = `${regionMap[PINGONE_CONFIG.region]}/${PINGONE_CONFIG.environmentId}/as`;
    console.log('Authority URL:', authority);

    // Prepare token exchange request for PUBLIC CLIENT (PKCE only)
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: PINGONE_CONFIG.clientId,
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier  // PKCE only - no client secret for public clients
    });

    console.log('Using PUBLIC CLIENT flow with PKCE only (no client secret)');

    const tokenEndpoint = `${authority}/token`;
    console.log('Making request to PingOne token endpoint:', tokenEndpoint);
    console.log('Request parameters:', {
      grant_type: 'authorization_code',
      client_id: PINGONE_CONFIG.clientId,
      code: '[PRESENT]',
      redirect_uri: redirectUri,
      code_verifier: '[PRESENT]'
    });

    // Exchange authorization code for tokens
    console.log('Sending request to PingOne...');
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'NextJS-App/1.0'
      },
      body: tokenParams.toString()
    });

    console.log('PingOne token response status:', tokenResponse.status);
    console.log('PingOne token response headers:', Object.fromEntries(tokenResponse.headers.entries()));

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('PingOne token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText
      });
      
      try {
        const errorData = JSON.parse(errorText);
        return res.status(tokenResponse.status).json({
          error: errorData.error_description || errorData.error || 'Token exchange failed',
          details: errorData,
          correlationId: errorData.error_description?.match(/Correlation ID: ([a-f0-9-]+)/)?.[1]
        });
      } catch (parseError) {
        return res.status(tokenResponse.status).json({
          error: `Token exchange failed with status ${tokenResponse.status}`,
          details: errorText
        });
      }
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received from PingOne:', Object.keys(tokens));

    if (!tokens.access_token) {
      console.error('No access token in response:', tokens);
      return res.status(400).json({ error: 'No access token received from PingOne' });
    }

    console.log('Getting user info from PingOne...');

    // Get user information
    const userInfoResponse = await fetch(`${authority}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json',
        'User-Agent': 'NextJS-App/1.0'
      }
    });

    console.log('PingOne userinfo response status:', userInfoResponse.status);

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('PingOne userinfo request failed:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        body: errorText
      });
      return res.status(userInfoResponse.status).json({
        error: `Failed to get user information: ${userInfoResponse.status}`,
        details: errorText
      });
    }

    const userInfo = await userInfoResponse.json();
    console.log('UserInfo received for user:', userInfo.sub);

    if (!userInfo.sub) {
      console.error('Invalid user info - missing sub:', userInfo);
      return res.status(400).json({ error: 'Invalid user information received' });
    }

    console.log('🎉 Authentication successful! Returning tokens and user info...');

    // Return tokens and user info to frontend
    const response = {
      tokens: {
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in
      },
      userInfo
    };

    console.log('Sending successful response to frontend');
    res.status(200).json(response);

  } catch (error) {
    console.error('=== SERVER ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Internal server error during authentication',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support'
    });
  }
}