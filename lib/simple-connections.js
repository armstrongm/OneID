// lib/simple-connections.js - With detailed debugging
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
    // KEEP the real client secret for testing - don't mask it
    clientSecret: conn.clientSecret
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
  console.log(`🔄 Updating connection: ${id}`);
  console.log('Update data:', JSON.stringify({
    ...data,
    clientSecret: data.clientSecret ? '[REDACTED]' : 'not provided'
  }, null, 2));
  
  const index = connections.findIndex(conn => conn.id === id);
  if (index === -1) {
    console.log(`❌ Connection not found: ${id}`);
    return null;
  }
  
  const existingConnection = connections[index];
  const updateData = { ...data };
  
  // Handle client secret preservation
  if (updateData.clientSecret === '[SAVED]' || updateData.clientSecret === '') {
    console.log('🔒 Preserving existing client secret');
    delete updateData.clientSecret;
  }
  
  // Update the connection
  connections[index] = { 
    ...existingConnection, 
    ...updateData, 
    id: id,
    updatedAt: new Date().toISOString() 
  };
  
  console.log('✅ Connection updated:', JSON.stringify({
    ...connections[index],
    clientSecret: connections[index].clientSecret ? '[SAVED]' : 'none'
  }, null, 2));
  
  return connections[index];
}

let nextId = 2; // Track next available ID

export function createConnection(data) {
  console.log('Creating connection:', data);
  const connection = {
    id: nextId++,
    ...data,
    createdAt: new Date().toISOString(),
    status: 'created'
  };
  connections.push(connection);
  console.log('Created connection:', connection.id);
  return connection;
}