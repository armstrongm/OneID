// pages/api/settings/pingone/simple-test.js - Super Simple Test
export default async function handler(req, res) {
  console.log('🔄 POST /api/settings/pingone/simple-test');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, clientSecret, environmentId } = req.body;

  if (!clientId || !clientSecret || !environmentId) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['clientId', 'clientSecret', 'environmentId']
    });
  }

  // Hardcode the EXACT URL that works in your Postman
  const tokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;

  console.log('🔗 Making request to:', tokenUrl);
  console.log('📋 Request details:', {
    clientId: `${clientId.substring(0, 8)}...`,
    environmentId,
    url: tokenUrl
  });

  try {
    // Create the request exactly like your Postman
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group'
    });

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('📡 Making fetch request...');
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json',
        'User-Agent': 'NextJS-Test/1.0'
      },
      body: tokenParams.toString()
    });

    console.log('📨 Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    const responseText = await response.text();
    console.log('📄 Response body:', responseText);

    // Check for AWS error specifically
    if (responseText.includes('Authorization header requires') || 
        responseText.includes('SignedHeaders') || 
        responseText.includes('X-Amz-Date')) {
      
      return res.status(500).json({
        error: 'AWS_ENDPOINT_DETECTED',
        message: 'Your request is being redirected to AWS instead of PingOne',
        debug: {
          requestedUrl: tokenUrl,
          responseStatus: response.status,
          responseBody: responseText,
          possibleCauses: [
            'DNS hijacking or corporate proxy redirecting requests',
            'VPN or network configuration issue',
            'Hosts file or DNS resolver pointing auth.pingone.com to AWS',
            'Corporate firewall or proxy interference'
          ],
          solutions: [
            'Try from a different network (mobile hotspot)',
            'Check your DNS settings',
            'Disable VPN temporarily',
            'Check corporate proxy/firewall settings',
            'Try ping auth.pingone.com in command line'
          ]
        }
      });
    }

    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { rawResponse: responseText };
    }

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'PingOne connection successful!',
        token: responseData.access_token ? 'RECEIVED' : 'NOT_RECEIVED',
        tokenType: responseData.token_type,
        scope: responseData.scope,
        expiresIn: responseData.expires_in,
        debug: {
          requestedUrl: tokenUrl,
          responseStatus: response.status
        }
      });
    } else {
      return res.status(response.status).json({
        success: false,
        error: 'PingOne authentication failed',
        details: responseData,
        debug: {
          requestedUrl: tokenUrl,
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries())
        }
      });
    }

  } catch (error) {
    console.error('❌ Fetch error:', error);
    
    return res.status(500).json({
      error: 'NETWORK_ERROR',
      message: 'Failed to connect to PingOne',
      details: error.message,
      debug: {
        requestedUrl: tokenUrl,
        errorType: error.constructor.name,
        errorMessage: error.message
      }
    });
  }
}