// pages/api/connections/[id]/import-preview.js - WITH PINGONE INTEGRATION
import { getConnection } from '../../../../lib/simple-connections';
import { getPingOneAccessToken } from '../../../../lib/services/pingone';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  try {
    console.log('=== IMPORT PREVIEW DEBUG ===');
    console.log('Connection ID:', id);
    
    // Get connection details
    const connection = getConnection(id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    console.log('Connection found:', connection.name);
    console.log('Connection type:', connection.type);

    // For PingOne connections, use the real API
    if (connection.type === 'PINGONE') {
      console.log('Using PingOne API...');
      return await handlePingOnePreview(connection, res);
    } else {
      console.log('Using mock data fallback...');
      return await handleMockPreview(res);
    }

  } catch (error) {
    console.error('Import preview error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch import preview',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function handlePingOnePreview(connection, res) {
  try {
    console.log('Getting PingOne access token...');
    
    // Get PingOne access token
    const tokenResult = await getPingOneAccessToken({
      clientId: connection.clientId,
      clientSecret: connection.clientSecret,
      environmentId: connection.environmentId
    });

    if (!tokenResult.success) {
      console.error('PingOne auth failed:', tokenResult.error);
      
      // Fall back to mock data if auth fails
      console.log('Falling back to mock data due to auth failure');
      return await handleMockPreview(res);
    }

    console.log('PingOne auth successful, fetching users...');

    // Determine API region
    const region = connection.region === 'EU' ? 'eu' : 
                  connection.region === 'APAC' ? 'asia' : 'com';
    
    const apiUrl = `https://api.pingone.${region}/v1/environments/${connection.environmentId}/users?limit=20`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenResult.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PingOne API error:', response.status, errorText);
      
      // Fall back to mock data
      return await handleMockPreview(res);
    }

    const data = await response.json();
    console.log('PingOne API response received, user count:', data._embedded?.users?.length || 0);
    
    const users = data._embedded?.users || [];
    
    // Take first 10 users for preview
    const previewUsers = users.slice(0, 10);
    
    // Flatten PingOne user structure
    const flatUsers = previewUsers.map(user => ({
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
      mobile_phone: user.mobilePhone,
      primary_phone: user.primaryPhone,
      locale: user.locale,
      timezone: user.timezone
    }));

    // Filter out fields with no data
    const sampleUser = flatUsers[0] || {};
    const detectedFields = Object.keys(sampleUser).filter(field => 
      sampleUser[field] !== undefined && sampleUser[field] !== null && sampleUser[field] !== ''
    );

    const analysis = {
      totalRecords: data.count || users.length,
      previewRecords: flatUsers.length,
      detectedFields,
      sampleRecord: sampleUser,
      source: 'PingOne API'
    };

    console.log('PingOne preview analysis:', analysis);

    return res.status(200).json({
      success: true,
      analysis,
      preview: flatUsers
    });

  } catch (error) {
    console.error('PingOne preview error:', error);
    // Fall back to mock data on any error
    return await handleMockPreview(res);
  }
}

async function handleMockPreview(res) {
  console.log('Using mock data...');
  
  const mockUsers = [
    {
      id: 1,
      username: 'john.doe',
      email: 'john.doe@company.com',
      first_name: 'John',
      last_name: 'Doe',
      title: 'Developer'
    },
    {
      id: 2,
      username: 'jane.smith',
      email: 'jane.smith@company.com',
      first_name: 'Jane',
      last_name: 'Smith',
      title: 'Designer'
    }
  ];

  const analysis = {
    totalRecords: 2,
    previewRecords: 2,
    detectedFields: ['id', 'username', 'email', 'first_name', 'last_name', 'title'],
    sampleRecord: mockUsers[0],
    source: 'Mock Data (fallback)'
  };

  return res.status(200).json({
    success: true,
    analysis,
    preview: mockUsers
  });
}