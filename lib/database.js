// lib/database.js - PostgreSQL Database Connection and Configuration
const { Pool } = require('pg');
const crypto = require('crypto');

class DatabaseClient {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'your_database_name',
      user: process.env.DB_USER || 'your_db_user',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection on startup
    this.testConnection();
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('Check your database configuration and ensure PostgreSQL is running');
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries in development
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.log('Slow query detected:', { text: text.substring(0, 100), duration, rows: res.rowCount });
      }
      
      return res;
    } catch (error) {
      console.error('Query error:', { text: text.substring(0, 100), error: error.message });
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // =============================================================================
  // USER MANAGEMENT METHODS
  // =============================================================================

  async createUser(userData) {
    const {
      username, email, firstName, lastName, displayName, title, department,
      phoneNumber, mobileNumber, officeLocation, employeeId, employeeType,
      password, managerId, sourceConnectionId, externalId, distinguishedName
    } = userData;

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      passwordHash = await bcrypt.hash(password, 12);
    }

    const query = `
      INSERT INTO users (
        username, email, first_name, last_name, display_name, title, department,
        phone_number, mobile_number, office_location, employee_id, employee_type,
        password_hash, manager_id, source_connection_id, external_id, distinguished_name,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING id, username, email, first_name, last_name, created_at
    `;

    const values = [
      username, email, firstName, lastName, displayName, title, department,
      phoneNumber, mobileNumber, officeLocation, employeeId, employeeType || 'employee',
      passwordHash, managerId, sourceConnectionId, externalId, distinguishedName
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getUserById(userId) {
    const query = `
      SELECT u.*, m.first_name as manager_first_name, m.last_name as manager_last_name,
             c.name as source_connection_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      LEFT JOIN connections c ON u.source_connection_id = c.id
      WHERE u.id = $1 AND u.is_enabled = true
    `;
    const result = await this.query(query, [userId]);
    return result.rows[0];
  }

  async getUserByUsername(username) {
    const query = `
      SELECT * FROM users WHERE username = $1 AND is_enabled = true
    `;
    const result = await this.query(query, [username]);
    return result.rows[0];
  }

  async updateUser(userId, userData) {
    const {
      email, firstName, lastName, displayName, title, department,
      phoneNumber, mobileNumber, officeLocation, employeeId
    } = userData;

    const query = `
      UPDATE users SET 
        email = $1, first_name = $2, last_name = $3, display_name = $4,
        title = $5, department = $6, phone_number = $7, mobile_number = $8,
        office_location = $9, employee_id = $10, updated_at = NOW()
      WHERE id = $11
      RETURNING id, username, email, first_name, last_name, updated_at
    `;

    const values = [
      email, firstName, lastName, displayName, title, department,
      phoneNumber, mobileNumber, officeLocation, employeeId, userId
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  // =============================================================================
  // CONNECTION MANAGEMENT METHODS
  // =============================================================================

  async createConnection(connectionData) {
    const {
      name, type, description, serverName, connectionConfig, status = 'created'
    } = connectionData;

    const query = `
      INSERT INTO connections (
        name, type, description, server_name, connection_config, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      name, type, description, serverName, 
      connectionConfig ? JSON.stringify(connectionConfig) : null, 
      status
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getConnectionById(connectionId) {
    const query = `SELECT * FROM connections WHERE id = $1`;
    const result = await this.query(query, [connectionId]);
    return result.rows[0];
  }

  async getAllConnections() {
    const query = `
      SELECT * FROM connections 
      ORDER BY created_at DESC
    `;
    const result = await this.query(query);
    return result.rows;
  }

  async updateConnectionStatus(connectionId, status, testResults = null) {
    const query = `
      UPDATE connections 
      SET status = $1, last_tested = NOW(), updated_at = NOW(),
          import_stats = COALESCE(import_stats, '{}'::jsonb) || $2::jsonb
      WHERE id = $3
      RETURNING *
    `;

    const statsUpdate = testResults ? JSON.stringify({ lastTestResult: testResults }) : '{}';
    const result = await this.query(query, [status, statsUpdate, connectionId]);
    return result.rows[0];
  }

  // =============================================================================
  // GROUP MANAGEMENT METHODS
  // =============================================================================

  async createGroup(groupData) {
    const {
      name, displayName, description, type, scope, sourceConnectionId, externalId
    } = groupData;

    const query = `
      INSERT INTO groups (
        name, display_name, description, type, scope, source_connection_id, external_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [name, displayName, description, type || 'Security', scope || 'Global', sourceConnectionId, externalId];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getGroupById(groupId) {
    const query = `SELECT * FROM groups WHERE id = $1`;
    const result = await this.query(query, [groupId]);
    return result.rows[0];
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async encrypt(text) {
    if (!text) return null;
    
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.DB_ENCRYPTION_KEY || 'your-secret-key-change-this-in-production';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('connection-data', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  async decrypt(encryptedText) {
    if (!encryptedText) return null;
    
    try {
      const algorithm = 'aes-256-gcm';
      const secretKey = process.env.DB_ENCRYPTION_KEY || 'your-secret-key-change-this-in-production';
      const key = crypto.scryptSync(secretKey, 'salt', 32);
      
      const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from('connection-data', 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Close database connection
  async close() {
    await this.pool.end();
    console.log('Database connection pool closed');
  }
}

// Create and export singleton instance
const db = new DatabaseClient();

// Export both the class and instance
module.exports = {
  DatabaseClient,
  db
};

// For backward compatibility
module.exports.default = db;