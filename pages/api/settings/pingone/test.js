// pages/api/settings/pingone/test.js - Test PingOne Connection
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    clientId,
    clientSecret,
    tokenUrl,
    environmentId
  } = req.body;

  if (!clientId || !clientSecret || !tokenUrl || !environmentId) {
    return res.status(400).json({
      error: 'Missing required fields: clientId, clientSecret, tokenUrl, environmentId'
    });
  }

  try {
    console.log('Testing PingOne connection...');

    // Step 1: Get access token using Client Credentials
    const tokenResponse = await getAccessToken({
      clientId,
      clientSecret,
      tokenUrl
    });

    if (!tokenResponse.success) {
      return res.status(400).json({
        error: 'Failed to authenticate with PingOne',
        details: tokenResponse.error
      });
    }

    console.log('Access token obtained successfully');

    // Step 2: Test API call to get environment info
    const environmentTest = await testEnvironmentAccess({
      accessToken: tokenResponse.accessToken,
      environmentId,
      tokenUrl
    });

    if (!environmentTest.success) {
      return res.status(400).json({
        error: 'Failed to access PingOne environment',
        details: environmentTest.error
      });
    }

    console.log('Environment access test successful');

    // Step 3: Test user API permissions
    const userApiTest = await testUserApiAccess({
      accessToken: tokenResponse.accessToken,
      environmentId,
      tokenUrl
    });

    return res.status(200).json({
      success: true,
      message: 'PingOne connection test successful',
      details: {
        authentication: tokenResponse,
        environment: environmentTest,
        userApi: userApiTest,
        permissions: userApiTest.permissions || []
      }
    });

  } catch (error) {
    console.error('PingOne connection test error:', error);
    return res.status(500).json({
      error: 'Connection test failed',
      details: error.message
    });
  }
}

async function getAccessToken({ clientId, clientSecret, tokenUrl }) {
  try {
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment'
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

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token request failed:', response.status, errorData);
      
      try {
        const errorJson = JSON.parse(errorData);
        return {
          success: false,
          error: errorJson.error_description || errorJson.error || `HTTP ${response.status}`
        };
      } catch (parseError) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData}`
        };
      }
    }

    const tokenData = await response.json();
    
    return {
      success: true,
      accessToken: tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope
    };

  } catch (error) {
    console.error('Token request error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testEnvironmentAccess({ accessToken, environmentId, tokenUrl }) {
  try {
    // Extract base API URL from token URL
    const baseApiUrl = tokenUrl.replace('/as/token', '');
    const environmentUrl = `${baseApiUrl.replace('/v1/environments/' + environmentId, '')}/v1/environments/${environmentId}`;

    const response = await fetch(environmentUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Environment access test failed:', response.status, errorData);
      
      return {
        success: false,
        error: `Failed to access environment: HTTP ${response.status}`
      };
    }

    const environmentData = await response.json();
    
    return {
      success: true,
      environmentId: environmentData.id,
      environmentName: environmentData.name,
      environmentType: environmentData.type
    };

  } catch (error) {
    console.error('Environment access test error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testUserApiAccess({ accessToken, environmentId, tokenUrl }) {
  try {
    // Extract base API URL from token URL
    const baseApiUrl = tokenUrl.replace('/as/token', '');
    const usersUrl = `${baseApiUrl.replace('/v1/environments/' + environmentId, '')}/v1/environments/${environmentId}/users`;

    // Test with a limit to reduce response size
    const testUrl = `${usersUrl}?limit=1`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('User API access test failed:', response.status, errorData);
      
      // Check if it's a permissions issue
      if (response.status === 403) {
        return {
          success: false,
          error: 'Insufficient permissions to access User API. Please check application scopes.',
          statusCode: 403
        };
      }
      
      return {
        success: false,
        error: `Failed to access User API: HTTP ${response.status}`,
        statusCode: response.status
      };
    }

    const userData = await response.json();
    
    // Extract some basic info about the response
    const userCount = userData._embedded?.users?.length || 0;
    const totalUsers = userData.count || 0;

    return {
      success: true,
      userApiAccessible: true,
      sampleUserCount: userCount,
      totalUsersInEnvironment: totalUsers,
      permissions: [
        'p1:read:user',
        'User API accessible'
      ]
    };

  } catch (error) {
    console.error('User API access test error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}