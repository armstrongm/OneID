a// pages/api/settings/pingone/postman-exact.js - Match Postman exactly
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, clientSecret, environmentId } = req.body;

  if (!clientId || !clientSecret || !environmentId) {
    return res.status(400).json({
      error: 'Missing required fields',
      received: { clientId: !!clientId, clientSecret: !!clientSecret, environmentId: !!environmentId }
    });
  }

  // Replicate your exact Postman request
  const tokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;
  
  // Exact same body params as your Postman
  const bodyParams = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group'
  });

  // Create Basic Auth header exactly like Postman does
  const authString = `${clientId}:${clientSecret}`;
  const authHeader = Buffer.from(authString, 'utf8').toString('base64');

  console.log('=== POSTMAN EXACT MATCH DEBUG ===');
  console.log('Environment ID:', environmentId);
  console.log('Client ID:', clientId);
  console.log('Client ID length:', clientId.length);
  console.log('Client Secret length:', clientSecret.length);
  console.log('Auth string before encoding:', authString);
  console.log('Base64 encoded auth:', authHeader);
  console.log('Token URL:', tokenUrl);
  console.log('Request body params:');
  console.log('- grant_type:', 'client_credentials');
  console.log('- scope:', 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group');
  console.log('Full request body:', bodyParams.toString());

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'PostmanRuntime/7.32.3'  // Match Postman exactly
      },
      body: bodyParams.toString()
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { rawResponse: responseText };
    }

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'SUCCESS! Token retrieved using exact Postman format',
        token: {
          access_token: responseData.access_token ? 'RECEIVED' : 'MISSING',
          token_type: responseData.token_type,
          expires_in: responseData.expires_in,
          scope: responseData.scope
        },
        debug: {
          requestMethod: 'POST',
          requestUrl: tokenUrl,
          requestHeaders: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authHeader}`,
            'Accept': 'application/json'
          },
          requestBody: bodyParams.toString(),
          responseStatus: response.status
        }
      });
    } else {
      // Handle different error types
      if (responseData.error === 'invalid_client') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CLIENT_CREDENTIALS',
          message: 'The Client ID or Client Secret is incorrect',
          details: {
            error: responseData.error,
            error_description: responseData.error_description,
            correlationId: responseData.error_description?.match(/Correlation ID: ([a-f0-9-]+)/)?.[1]
          },
          debug: {
            clientIdUsed: clientId,
            clientIdLength: clientId.length,
            clientSecretLength: clientSecret.length,
            authHeaderGenerated: `Basic ${authHeader}`,
            possibleIssues: [
              'Client ID has typo or extra characters',
              'Client Secret is incorrect',
              'Environment ID is wrong',
              'PingOne application not configured for Client Credentials grant'
            ]
          },
          suggestions: [
            'Copy Client ID and Secret directly from PingOne Admin Console',
            'Check for hidden characters or spaces',
            'Verify Environment ID matches your PingOne environment',
            'Ensure PingOne application has Client Credentials grant type enabled'
          ]
        });
      } else if (responseData.error === 'invalid_scope') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_SCOPE',
          message: 'Your PingOne application needs additional scopes',
          details: responseData,
          fix: 'Go to PingOne Admin Console → Applications → Your App → Configuration → Resources and add the required scopes'
        });
      } else {
        return res.status(response.status).json({
          success: false,
          error: 'PINGONE_ERROR',
          message: 'PingOne returned an error',
          details: responseData,
          debug: {
            responseStatus: response.status,
            responseHeaders: Object.fromEntries(response.headers.entries())
          }
        });
      }
    }

  } catch (error) {
    console.error('Network error:', error);
    return res.status(500).json({
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Failed to connect to PingOne',
      details: error.message
    });
  }
}