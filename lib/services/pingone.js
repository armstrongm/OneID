export async function getPingOneAccessToken(config) {
  const { clientId, clientSecret, environmentId } = config;
  
  console.log('PingOne Auth Debug:');
  console.log('- Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'MISSING');
  console.log('- Client Secret:', clientSecret ? `${clientSecret.length} chars` : 'MISSING');
  console.log('- Environment ID:', environmentId);
  
  if (!clientId || !clientSecret || !environmentId) {
    return {
      success: false,
      error: 'Missing required credentials: clientId, clientSecret, or environmentId'
    };
  }
  
  try {
    const tokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;
    console.log('Token URL:', tokenUrl);
    
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group'
    });

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    });

    console.log('Token response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Token error response:', errorText);
      return {
        success: false,
        error: `Token request failed: ${response.status} ${errorText}`
      };
    }

    const tokenData = await response.json();
    console.log('Token received successfully');
    
    return {
      success: true,
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in
    };

  } catch (error) {
    console.error('Token request error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}