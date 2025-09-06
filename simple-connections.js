// lib/simple-connections.js - With detailed debugging--added 05SEP2025
let connections = [
  {
    id: 'pingone-default',
    name: 'PingOne Connection', 
    type: 'PINGONE',
    clientId: '725210fd-3e86-449e-b992-27621e50b76a',
    clientSecret: 'your-actual-client-secret-here', // Replace with real secret
    environmentId: '2d4508d9-b793-4564-bfa7-e22aac80cd72',
    region: 'NA',
    status: 'created',
    createdAt: new Date().toISOString()
  }
];

export function getAllConnections() {
  return connections.map(conn => ({
    ...conn,
    hasClientSecret: !!conn.clientSecret,
    clientSecret: conn.clientSecret ? '[SAVED]' : undefined
  }));
}

export function getConnection(id) {
  console.log(`Getting connection: ${id}`);
  const conn = connections.find(conn => conn.id === id);
  if (conn) {
    console.log(`Found connection: ${conn.name} (${conn.type})`);
    // For editing - show [SAVED] for existing secrets
    return {
      ...conn,
      clientSecret: conn.clientSecret ? '[SAVED]' : ''
    };
  }
  console.log(`Connection not found: ${id}`);
  return null;
}

export function updateConnection(id, data) {
  console.log(`Updating connection: ${id}`);
  console.log('Update data:', data);
  
  const index = connections.findIndex(conn => conn.id === id);
  if (index === -1) {
    console.log(`Connection not found for update: ${id}`);
    return null;
  }
  
  const existingConnection = connections[index];
  console.log('Existing connection:', existingConnection);
  
  // Handle client secret properly
  const updateData = { ...data };
  if (updateData.clientSecret === '[SAVED]' || updateData.clientSecret === '') {
    console.log('Keeping existing client secret');
    delete updateData.clientSecret;
  } else if (updateData.clientSecret) {
    console.log('Updating client secret');
  }
  
  connections[index] = { 
    ...existingConnection, 
    ...updateData, 
    updatedAt: new Date().toISOString() 
  };
  
  console.log('Updated connection:', connections[index]);
  return connections[index];
}

export function createConnection(data) {
  console.log('Creating connection:', data);
  const connection = {
    id: `conn-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
    status: 'created'
  };
  connections.push(connection);
  console.log('Created connection:', connection.id);
  return connection;
}