// =============================================================================
// Node.js Database Client Configuration
// =============================================================================

// lib/database.js - Database connection and utilities
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

class DatabaseClient {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'oneid_manager',
      user: process.env.DB_USER || 'oneid_app',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
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
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Query error', { text, error: error.message });
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

    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const query = `
      INSERT INTO users (
        username, email, first_name, last_name, display_name, title, department,
        phone_number, mobile_number, office_location, employee_id, employee_type,
        password_hash, manager_id, source_connection_id, external_id, distinguished_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
      SELECT * FROM user_details WHERE username = $1 AND is_enabled =