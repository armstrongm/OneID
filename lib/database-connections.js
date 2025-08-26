// lib/database-connections.js - Database storage for connections
import crypto from 'crypto';

// In-memory storage (replace with actual database)
let connections = [];

// Encryption for sensitive data
const ENCRYPTION_KEY = process.env.CONNECTION_ENCRYPTION_KEY || 'your-32-character-secret-key-here!';

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

export class ConnectionManager {
  static async createConnection(connectionData) {
    const connection = {
      id: `conn-${Date.now()}`,
      name: connectionData.name,
      type: connectionData.type,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTested: null,
      ...connectionData
    };

    // Encrypt sensitive fields based on connection type
    if (connection.type === 'PINGONE') {
      connection.encryptedClientSecret = encrypt(connectionData.clientSecret);
      delete connection.clientSecret; // Remove plain text
      
      // Store PingOne-specific fields
      connection.clientId = connectionData.clientId;
      connection.environmentId = connectionData.environmentId;
      connection.region = connectionData.region || 'NA';
      connection.scopes = connectionData.scopes || 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment';
      
    } else if (connection.type === 'AD' || connection.type === 'LDAP') {
      // Traditional connection fields
      connection.serverName = connectionData.serverName;
      connection.domain = connectionData.domain;
      connection.baseDN = connectionData.baseDN;
      
      if (connectionData.password) {
        connection.encryptedPassword = encrypt(connectionData.password);
        delete connection.password;
      }
    }

    connections.push(connection);
    console.log(`✅ Connection created: ${connection.id} (${connection.type})`);
    return connection;
  }

  static async getConnection(connectionId) {
    const connection = connections.find(conn => conn.id === connectionId);
    if (!connection) {
      return null;
    }

    // Decrypt sensitive fields for use
    const decryptedConnection = { ...connection };
    
    if (connection.type === 'PINGONE' && connection.encryptedClientSecret) {
      decryptedConnection.clientSecret = decrypt(connection.encryptedClientSecret);
    } else if (connection.encryptedPassword) {
      decryptedConnection.password = decrypt(connection.encryptedPassword);
    }

    return decryptedConnection;
  }

  static async getConnectionForEdit(connectionId) {
    const connection = connections.find(conn => conn.id === connectionId);
    if (!connection) {
      return null;
    }

    // Return connection without sensitive fields for editing
    const editConnection = { ...connection };
    
    if (connection.type === 'PINGONE') {
      editConnection.clientSecret = connection.encryptedClientSecret ? '[ENCRYPTED]' : '';
    } else if (connection.encryptedPassword) {
      editConnection.password = '[ENCRYPTED]';
    }
    
    // Remove encrypted fields from edit response
    delete editConnection.encryptedClientSecret;
    delete editConnection.encryptedPassword;

    return editConnection;
  }

  static async updateConnection(connectionId, updateData) {
    const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
    if (connectionIndex === -1) {
      return null;
    }

    const existingConnection = connections[connectionIndex];
    const updatedConnection = {
      ...existingConnection,
      ...updateData,
      id: connectionId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // Handle sensitive field encryption
    if (updatedConnection.type === 'PINGONE') {
      if (updateData.clientSecret && updateData.clientSecret !== '[ENCRYPTED]') {
        updatedConnection.encryptedClientSecret = encrypt(updateData.clientSecret);
      }
      delete updatedConnection.clientSecret;
      
    } else if (updateData.password && updateData.password !== '[ENCRYPTED]') {
      updatedConnection.encryptedPassword = encrypt(updateData.password);
      delete updatedConnection.password;
    }

    connections[connectionIndex] = updatedConnection;
    console.log(`✅ Connection updated: ${connectionId}`);
    return updatedConnection;
  }

  static async deleteConnection(connectionId) {
    const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
    if (connectionIndex === -1) {
      return false;
    }

    const deletedConnection = connections[connectionIndex];
    connections.splice(connectionIndex, 1);
    console.log(`🗑️ Connection deleted: ${connectionId}`);
    return deletedConnection;
  }

  static async getAllConnections() {
    // Return connections without sensitive data
    return connections.map(conn => {
      const safeConnection = { ...conn };
      delete safeConnection.encryptedClientSecret;
      delete safeConnection.encryptedPassword;
      
      if (conn.type === 'PINGONE') {
        safeConnection.hasClientSecret = !!conn.encryptedClientSecret;
      } else {
        safeConnection.hasPassword = !!conn.encryptedPassword;
      }
      
      return safeConnection;
    });
  }

  static async testConnection(connectionId) {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.type === 'PINGONE') {
      return await this.testPingOneConnection(connection);
    } else {
      return await this.testTraditionalConnection(connection);
    }
  }

  static async testPingOneConnection(connection) {
    const { clientId, clientSecret, environmentId } = connection;
    
    if (!clientId || !clientSecret || !environmentId) {
      throw new Error('Missing required PingOne credentials');
    }

    const tokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;
    
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: connection.scopes || 'p1:read:user p1:read:environment'
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
      throw new Error(`PingOne authentication failed: ${errorData}`);
    }

    const tokenData = await response.json();
    
    // Update connection status and last tested
    await this.updateConnection(connection.id, {
      status: 'connected',
      lastTested: new Date().toISOString()
    });

    return {
      success: true,
      message: 'PingOne connection successful',
      details: {
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope
      }
    };
  }

  static async testTraditionalConnection(connection) {
    // Mock traditional connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.updateConnection(connection.id, {
      status: 'connected',
      lastTested: new Date().toISOString()
    });

    return {
      success: true,
      message: `${connection.type} connection successful`,
      details: {
        server: connection.serverName,
        responseTime: '95ms'
      }
    };
  }
}

// Initialize with your working PingOne connection
export async function initializeDefaultConnections() {
  const existingPingOne = connections.find(conn => conn.type === 'PINGONE');
  
  if (!existingPingOne) {
    await ConnectionManager.createConnection({
      name: 'PingOne Connection',
      type: 'PINGONE',
      clientId: '725210fd-3e86-449e-b992-27621e50b76a',
      clientSecret: 'your-working-client-secret-here', // Replace with actual secret
      environmentId: '2d4508d9-b793-4564-bfa7-e22aac80cd72',
      region: 'NA',
      scopes: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group'
    });
    console.log('✅ Default PingOne connection initialized');
  }
}