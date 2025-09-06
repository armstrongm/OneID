// ===== FIX 1: Update /pages/api/connections/test-config.js =====

// pages/api/connections/test-config.js - FIXED VERSION
export default async function handler(req, res) {
  console.log('=== CONNECTION TEST API ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body. Expected JSON object.',
        received: typeof req.body
      });
    }

    // CRITICAL FIX: Handle PingOne connections properly
    const { clientId, clientSecret, environmentId, type } = req.body;
    
    if (type === 'PINGONE' && clientId && clientSecret && environmentId) {
      console.log('🔄 Testing PingOne connection...');
      
      const tokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;
      
      const tokenParams = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group'
      });

      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      console.log('Making PingOne API request...');

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json'
        },
        body: tokenParams.toString()
      });

      const responseText = await response.text();
      console.log('PingOne response status:', response.status);
      console.log('PingOne response:', responseText);
      
      if (response.ok) {
        const tokenData = JSON.parse(responseText);
        console.log('✅ PingOne test successful');
        
        return res.status(200).json({
          success: true,
          message: 'PingOne connection test successful',
          details: {
            access_token: 'RECEIVED',
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
            scope: tokenData.scope,
            server_response: 'Authentication successful'
          },
          tests: [{
            name: 'PingOne Authentication',
            success: true,
            message: 'Successfully authenticated with PingOne',
            details: {
              token_type: tokenData.token_type,
              expires_in: tokenData.expires_in,
              scope: tokenData.scope
            }
          }],
          timestamp: new Date().toISOString()
        });
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }

        console.log('❌ PingOne test failed:', errorData);
        
        return res.status(400).json({
          success: false,
          message: 'PingOne connection test failed',
          error: errorData.error || 'Authentication failed',
          details: errorData,
          tests: [{
            name: 'PingOne Authentication',
            success: false,
            message: errorData.error_description || 'Authentication failed',
            details: errorData
          }],
          timestamp: new Date().toISOString()
        });
      }
    }

    // Handle traditional connections (AD, LDAP, Database)
    const { name, type: connType, serverName, domain, baseDN, username, password } = req.body;

    if (!name || !connType || !serverName) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, serverName (or use PingOne-specific fields: clientId, clientSecret, environmentId)',
        receivedFields: Object.keys(req.body)
      });
    }

    console.log(`Testing traditional connection: ${name} (${connType})`);

    // Test traditional connections...
    let testResult;
    
    switch (connType.toLowerCase()) {
      case 'ad':
      case 'active directory':
        testResult = await testActiveDirectoryConfig({ name, serverName, domain, username, password });
        break;
      case 'ldap':
        testResult = await testLdapConfig({ name, serverName, baseDN, username, password });
        break;
      case 'database':
      case 'db':
        testResult = await testDatabaseConfig({ name, serverName, username, password });
        break;
      default:
        return res.status(400).json({
          error: `Unsupported connection type: ${connType}`
        });
    }

    return res.status(200).json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details,
      tests: [{
        name: `${connType} Connection`,
        success: testResult.success,
        message: testResult.message,
        details: testResult.details
      }],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Connection test error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Keep your existing test functions...
async function testActiveDirectoryConfig(config) {
  await new Promise(resolve => setTimeout(resolve, 1200));
  return {
    success: true,
    message: 'Active Directory configuration is valid',
    details: {
      server: config.serverName,
      domain: config.domain,
      responseTime: '94ms'
    }
  };
}

async function testLdapConfig(config) {
  await new Promise(resolve => setTimeout(resolve, 900));
  return {
    success: true,
    message: 'LDAP configuration is valid',
    details: {
      server: config.serverName,
      baseDN: config.baseDN,
      responseTime: '71ms'
    }
  };
}

async function testDatabaseConfig(config) {
  await new Promise(resolve => setTimeout(resolve, 700));
  return {
    success: true,
    message: 'Database configuration is valid',
    details: {
      server: config.serverName,
      responseTime: '38ms'
    }
  };
}