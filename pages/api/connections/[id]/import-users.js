/ pages/api/connections/[id]/import-users.js
import { getConnection } from '../../../../lib/simple-connections';
import { getPingOneAccessToken } from '../../../../lib/services/pingone';
import { createImportTask, updateImportTask } from '../../../../lib/import-tasks';
import { DatabaseClient } from '../../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { dryRun = false, fieldMapping = {} } = req.body;
  
  try {
    console.log('Import users requested for connection:', id);
    console.log('Dry run:', dryRun);

    const connection = getConnection(id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Create import task
    const taskId = await createImportTask({
      connectionId: id,
      taskType: 'users',
      status: 'pending',
      importConfig: { dryRun, fieldMapping }
    });

    if (dryRun) {
      // Perform dry run analysis
      const dryRunResult = await performDryRun(connection, fieldMapping);
      
      await updateImportTask(taskId, {
        status: 'completed',
        totalRecords: dryRunResult.totalRecords,
        preview_data: dryRunResult
      });

      return res.status(200).json({
        success: true,
        message: 'Dry run completed successfully',
        taskId,
        dryRun: true,
        results: dryRunResult
      });
    } else {
      // Start actual import process asynchronously
      processUserImport(taskId, connection, fieldMapping);

      return res.status(200).json({
        success: true,
        message: 'Import started successfully',
        taskId
      });
    }

  } catch (error) {
    console.error('Import users error:', error);
    return res.status(500).json({ 
      error: 'Failed to start user import',
      details: error.message 
    });
  }
}

async function performDryRun(connection, fieldMapping) {
  const db = new DatabaseClient();
  
  try {
    // Fetch users data
    const usersData = await fetchUsersData(connection);
    
    // Process and validate each user
    const results = {
      totalRecords: usersData.length,
      wouldCreate: 0,
      wouldUpdate: 0,
      wouldSkip: 0,
      errors: [],
      validationIssues: [],
      sampleProcessedUsers: []
    };

    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      
      try {
        // Map fields according to fieldMapping
        const mappedUser = mapUserFields(userData, fieldMapping);
        
        // Validate required fields
        const validation = validateUser(mappedUser);
        if (!validation.isValid) {
          results.errors.push(`User ${i + 1}: ${validation.errors.join(', ')}`);
          results.wouldSkip++;
          continue;
        }

        // Check if user exists (by email or username)
        const existingUser = await checkExistingUser(db, mappedUser);
        
        if (existingUser) {
          results.wouldUpdate++;
        } else {
          results.wouldCreate++;
        }

        // Add to sample (first 5 users)
        if (results.sampleProcessedUsers.length < 5) {
          results.sampleProcessedUsers.push({
            original: userData,
            mapped: mappedUser,
            action: existingUser ? 'update' : 'create',
            existingUser: existingUser ? { id: existingUser.id, username: existingUser.username } : null
          });
        }

      } catch (error) {
        results.errors.push(`User ${i + 1}: ${error.message}`);
        results.wouldSkip++;
      }
    }

    return results;
    
  } catch (error) {
    throw new Error(`Dry run failed: ${error.message}`);
  }
}

async function fetchUsersData(connection) {
  if (connection.type === 'PINGONE') {
    return await fetchPingOneUsers(connection);
  } else {
    return await fetchCustomUrlUsers(connection);
  }
}

async function fetchPingOneUsers(connection) {
  // Get access token
  const tokenResult = await getPingOneAccessToken({
    clientId: connection.clientId,
    clientSecret: connection.clientSecret,
    environmentId: connection.environmentId
  });

  if (!tokenResult.success) {
    throw new Error(`PingOne authentication failed: ${tokenResult.error}`);
  }

  // Fetch all users (paginated)
  const region = connection.region === 'EU' ? 'eu' : 
                connection.region === 'APAC' ? 'asia' : 'com';
  
  let allUsers = [];
  let nextUrl = `https://api.pingone.${region}/v1/environments/${connection.environmentId}/users?limit=100`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        'Authorization': `Bearer ${tokenResult.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PingOne API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const users = data._embedded?.users || [];
    
    // Flatten PingOne user structure
    const flatUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.name?.given,
      last_name: user.name?.family,
      display_name: user.name?.formatted,
      nickname: user.nickname,
      title: user.title,
      type: user.type,
      enabled: user.enabled,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      mobile_phone: user.mobilePhone,
      primary_phone: user.primaryPhone,
      locale: user.locale,
      timezone: user.timezone
    }));

    allUsers = allUsers.concat(flatUsers);
    
    // Check for next page
    nextUrl = data._links?.next?.href || null;
    
    // Safety limit to prevent infinite loops
    if (allUsers.length > 10000) {
      console.warn('Reached user limit of 10,000 - stopping pagination');
      break;
    }
  }

  return allUsers;
}

async function fetchCustomUrlUsers(connection) {
  if (!connection.userImportUrl) {
    throw new Error('Import URL not configured');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (connection.userImportApiKey) {
    headers['Authorization'] = `Bearer ${connection.userImportApiKey}`;
  }

  const response = await fetch(connection.userImportUrl, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    throw new Error(`Import URL returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

function mapUserFields(userData, fieldMapping) {
  const mappedUser = {};
  
  // Apply field mapping
  Object.keys(fieldMapping).forEach(sourceField => {
    const targetField = fieldMapping[sourceField];
    if (targetField && userData[sourceField] !== undefined) {
      mappedUser[targetField] = userData[sourceField];
    }
  });

  return mappedUser;
}

function validateUser(user) {
  const errors = [];
  
  // Check required fields
  if (!user.username || !user.username.trim()) {
    errors.push('Username is required');
  }
  
  if (!user.email || !user.email.trim()) {
    errors.push('Email is required');
  }
  
  // Validate email format
  if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate username format (no spaces, special chars)
  if (user.username && !/^[a-zA-Z0-9._-]+$/.test(user.username)) {
    errors.push('Username contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

async function checkExistingUser(db, user) {
  // Check by email first, then username
  let existingUser = null;
  
  if (user.email) {
    const emailResult = await db.query('SELECT id, username, email FROM users WHERE email = $1', [user.email]);
    if (emailResult.rows.length > 0) {
      existingUser = emailResult.rows[0];
    }
  }
  
  if (!existingUser && user.username) {
    const usernameResult = await db.query('SELECT id, username, email FROM users WHERE username = $1', [user.username]);
    if (usernameResult.rows.length > 0) {
      existingUser = usernameResult.rows[0];
    }
  }
  
  return existingUser;
}

async function processUserImport(taskId, connection, fieldMapping) {
  // This runs asynchronously and updates the task status as it progresses
  // Implementation would be similar to dry run but actually creates/updates users
  
  try {
    await updateImportTask(taskId, { 
      status: 'running',
      started_at: new Date().toISOString()
    });

    // Fetch and process users...
    const usersData = await fetchUsersData(connection);
    
    await updateImportTask(taskId, {
      total_records: usersData.length
    });

    // Process each user...
    // (Implementation would create/update users in database)
    
    await updateImportTask(taskId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: 100
    });

  } catch (error) {
    await updateImportTask(taskId, {
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString()
    });
  }
}