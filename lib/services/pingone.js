// lib/services/pingone.js
import { getPingOneUrls } from '../constants/connectionTypes';

/**
 * PingOne Service - Helper functions for PingOne API operations
 */

// Get OAuth access token using client credentials
export async function getPingOneAccessToken(config) {
  try {
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: config.scopes || 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:population p1:read:group'
    });

    const authHeader = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

    const response = await fetch(config.tokenUrl, {
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
      console.error('PingOne token request failed:', response.status, errorData);
      
      try {
        const errorJson = JSON.parse(errorData);
        return {
          success: false,
          error: errorJson.error_description || errorJson.error || `HTTP ${response.status}`,
          details: errorJson
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
    console.error('PingOne token request error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test environment access
export async function testPingOneEnvironment(config, accessToken) {
  try {
    const response = await fetch(`${config.apiBaseUrl}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Environment access failed: HTTP ${response.status}`
      };
    }

    const envData = await response.json();
    return {
      success: true,
      environment: envData,
      message: 'Environment access verified'
    };
  } catch (error) {
    return {
      success: false,
      error: `Environment test failed: ${error.message}`
    };
  }
}

// Test user API access
export async function testPingOneUserAPI(config, accessToken) {
  try {
    // Test user list access with limit=1
    const response = await fetch(`${config.apiBaseUrl}/users?limit=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `User API access failed: HTTP ${response.status}`,
        permissions: []
      };
    }

    const userData = await response.json();
    
    // Check for common permissions based on what we can access
    const permissions = ['p1:read:user'];
    
    // Test if we can access groups
    try {
      const groupResponse = await fetch(`${config.apiBaseUrl}/groups?limit=1`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      if (groupResponse.ok) {
        permissions.push('p1:read:group');
      }
    } catch (e) {
      // Groups not accessible
    }

    return {
      success: true,
      message: 'User API access verified',
      userCount: userData.count || 0,
      permissions
    };
  } catch (error) {
    return {
      success: false,
      error: `User API test failed: ${error.message}`,
      permissions: []
    };
  }
}

// Fetch all users from PingOne with pagination
export async function fetchPingOneUsers(config, accessToken, options = {}) {
  const { populationId, limit = 100 } = options;
  let allUsers = [];
  let nextUrl = `${config.apiBaseUrl}/users?limit=${limit}`;
  
  // Add population filter if specified
  if (populationId || config.populationId) {
    const targetPopulation = populationId || config.populationId;
    nextUrl += `&filter=population.id eq "${targetPopulation}"`;
  }

  try {
    while (nextUrl) {
      console.log(`Fetching users from: ${nextUrl}`);
      
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: HTTP ${response.status}`);
      }

      const data = await response.json();
      const users = data._embedded?.users || [];
      allUsers.push(...users);
      
      console.log(`Fetched ${users.length} users, total: ${allUsers.length}`);
      
      // Handle pagination
      nextUrl = data._links?.next?.href || null;
      
      // Safety break to prevent infinite loops
      if (allUsers.length > 10000) {
        console.warn('Reached maximum user limit (10,000), stopping pagination');
        break;
      }
    }

    return allUsers;
  } catch (error) {
    console.error('Error fetching PingOne users:', error);
    throw error;
  }
}

// Fetch all groups from PingOne with pagination
export async function fetchPingOneGroups(config, accessToken, options = {}) {
  const { limit = 100 } = options;
  let allGroups = [];
  let nextUrl = `${config.apiBaseUrl}/groups?limit=${limit}`;

  try {
    while (nextUrl) {
      console.log(`Fetching groups from: ${nextUrl}`);
      
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch groups: HTTP ${response.status}`);
      }

      const data = await response.json();
      const groups = data._embedded?.groups || [];
      allGroups.push(...groups);
      
      console.log(`Fetched ${groups.length} groups, total: ${allGroups.length}`);
      
      // Handle pagination
      nextUrl = data._links?.next?.href || null;
      
      // Safety break
      if (allGroups.length > 1000) {
        console.warn('Reached maximum group limit (1,000), stopping pagination');
        break;
      }
    }

    return allGroups;
  } catch (error) {
    console.error('Error fetching PingOne groups:', error);
    throw error;
  }
}

// Fetch group members
export async function fetchPingOneGroupMembers(config, accessToken, groupId) {
  try {
    const response = await fetch(`${config.apiBaseUrl}/groups/${groupId}/memberOfGroups`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch group members: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data._embedded?.users || [];
  } catch (error) {
    console.error(`Error fetching group members for ${groupId}:`, error);
    return [];
  }
}

// Map PingOne user to local user format
export function mapPingOneUser(pingOneUser) {
  return {
    externalId: pingOneUser.id,
    username: pingOneUser.username || pingOneUser.email,
    email: pingOneUser.email,
    firstName: pingOneUser.name?.given || '',
    lastName: pingOneUser.name?.family || '',
    displayName: pingOneUser.name?.formatted || 
      `${pingOneUser.name?.given || ''} ${pingOneUser.name?.family || ''}`.trim() ||
      pingOneUser.username || pingOneUser.email,
    phoneNumber: pingOneUser.phoneNumbers?.[0]?.value || pingOneUser.phoneNumber,
    mobileNumber: pingOneUser.phoneNumbers?.find(p => p.type === 'mobile')?.value,
    title: pingOneUser.title,
    department: pingOneUser.department,
    employeeId: pingOneUser.employeeNumber || pingOneUser.externalId,
    employeeType: pingOneUser.userType || 'employee',
    isEnabled: pingOneUser.enabled !== false,
    lastLogin: pingOneUser.lastSignOn ? new Date(pingOneUser.lastSignOn) : null,
    // Store original PingOne data for reference
    originalData: pingOneUser
  };
}

// Map PingOne group to local group format
export function mapPingOneGroup(pingOneGroup) {
  return {
    externalId: pingOneGroup.id,
    name: pingOneGroup.name,
    displayName: pingOneGroup.displayName || pingOneGroup.name,
    description: pingOneGroup.description || '',
    type: pingOneGroup.type || 'Security',
    scope: 'Global', // PingOne doesn't have scope concept like AD
    isEnabled: true,
    // Store original PingOne data for reference
    originalData: pingOneGroup
  };
}

// Comprehensive connection test
export async function testPingOneConnection(config) {
  const results = {
    success: false,
    tests: [],
    overall: null
  };

  try {
    // Test 1: Authentication
    console.log('Testing PingOne authentication...');
    const tokenResult = await getPingOneAccessToken(config);
    results.tests.push({
      name: 'Authentication',
      success: tokenResult.success,
      message: tokenResult.success ? 'Access token obtained' : tokenResult.error,
      details: tokenResult.success ? { expiresIn: tokenResult.expiresIn } : tokenResult
    });

    if (!tokenResult.success) {
      results.overall = 'Authentication failed';
      return results;
    }

    // Test 2: Environment Access
    console.log('Testing environment access...');
    const envResult = await testPingOneEnvironment(config, tokenResult.accessToken);
    results.tests.push({
      name: 'Environment Access',
      success: envResult.success,
      message: envResult.message || envResult.error,
      details: envResult.environment || null
    });

    // Test 3: User API Access
    console.log('Testing user API access...');
    const userResult = await testPingOneUserAPI(config, tokenResult.accessToken);
    results.tests.push({
      name: 'User API Access',
      success: userResult.success,
      message: userResult.message || userResult.error,
      details: {
        userCount: userResult.userCount || 0,
        permissions: userResult.permissions || []
      }
    });

    // Determine overall success
    const allTestsPass = results.tests.every(test => test.success);
    results.success = allTestsPass;
    results.overall = allTestsPass ? 
      'All tests passed - connection is working' : 
      'Some tests failed - check configuration';

    return results;
  } catch (error) {
    console.error('Connection test error:', error);
    results.overall = `Test failed: ${error.message}`;
    return results;
  }
}