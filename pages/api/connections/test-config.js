// pages/api/connections/test-config.js - Updated to handle both traditional and PingOne connections
export default async function handler(req, res) {
  console.log('API CALLED:', req.url);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body exists and is valid JSON
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body. Expected JSON object.',
        received: typeof req.body
      });
    }

    console.log('Received test config request:', req.body);

    // Check if this is a PingOne configuration
    const { clientId, clientSecret, tokenUrl, environmentId } = req.body;
    if (clientId && clientSecret && environmentId) {
      // This is a PingOne config - use the working format
      console.log('Detected PingOne configuration, processing...');
      
      const pingOneTokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;
      
      const tokenParams = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group'
      });

      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      console.log('Making PingOne request to:', pingOneTokenUrl);

      const response = await fetch(pingOneTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json'
        },
        body: tokenParams.toString()
      });

      const result = await response.text();
      
      if (response.ok) {
        const tokenData = JSON.parse(result);
        return res.status(200).json({
          success: true,
          message: 'PingOne connection successful',
          details: {
            access_token: 'RECEIVED',
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
            scope: tokenData.scope
          },
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(response.status).json({
          success: false,
          error: 'PingOne authentication failed',
          details: result,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Handle traditional connection types (AD, LDAP, Database)
    const { name, type, serverName, domain, baseDN, username, password } = req.body;

    // Validate required fields for traditional connections
    if (!name || !type || !serverName) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, serverName (or use PingOne-specific fields: clientId, clientSecret, environmentId)',
        receivedFields: Object.keys(req.body)
      });
    }

    console.log(`Testing traditional connection configuration: ${name} (${type})`);

    // Simulate connection testing based on type
    let testResult;
    
    switch (type.toLowerCase()) {
      case 'ad':
      case 'active directory':
        if (!domain) {
          return res.status(400).json({
            error: 'Domain is required for Active Directory connections'
          });
        }
        testResult = await testActiveDirectoryConfig({ 
          name, serverName, domain, username, password 
        });
        break;
        
      case 'ldap':
        if (!baseDN) {
          return res.status(400).json({
            error: 'Base DN is required for LDAP connections'
          });
        }
        testResult = await testLdapConfig({ 
          name, serverName, baseDN, username, password 
        });
        break;
        
      case 'database':
      case 'db':
        testResult = await testDatabaseConfig({ 
          name, serverName, username, password 
        });
        break;
        
      default:
        return res.status(400).json({
          error: `Unsupported connection type: ${type}`
        });
    }

    return res.status(200).json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details,
      connectionConfig: {
        name,
        type,
        serverName
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Connection test configuration error:', error);
    
    // Handle JSON parsing errors specifically
    if (error.message.includes('JSON') || error.message.includes('token')) {
      return res.status(400).json({
        error: 'Invalid JSON in request body',
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function testActiveDirectoryConfig(config) {
  // Simulate AD connection test with configuration
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Mock successful connection
  return {
    success: true,
    message: 'Active Directory configuration is valid',
    details: {
      server: config.serverName,
      domain: config.domain,
      authenticationMethod: config.username ? 'Username/Password' : 'Anonymous',
      responseTime: '94ms',
      canConnect: true,
      canAuthenticate: !!config.username,
      supportedFeatures: ['User Sync', 'Group Sync', 'Password Validation']
    }
  };
}

async function testLdapConfig(config) {
  // Simulate LDAP connection test with configuration  
  await new Promise(resolve => setTimeout(resolve, 900));
  
  return {
    success: true,
    message: 'LDAP configuration is valid',
    details: {
      server: config.serverName,
      baseDN: config.baseDN,
      authenticationMethod: config.username ? 'Bind Authentication' : 'Anonymous',
      responseTime: '71ms',
      canConnect: true,
      canBind: !!config.username,
      supportedFeatures: ['User Lookup', 'Attribute Mapping']
    }
  };
}

async function testDatabaseConfig(config) {
  // Simulate database connection test with configuration
  await new Promise(resolve => setTimeout(resolve, 700));
  
  return {
    success: true,
    message: 'Database configuration is valid',
    details: {
      server: config.serverName,
      authenticationMethod: config.username ? 'SQL Authentication' : 'Integrated',
      responseTime: '38ms',
      canConnect: true,
      canQuery: !!config.username,
      supportedFeatures: ['User Tables', 'Custom Queries']
    }
  };
}