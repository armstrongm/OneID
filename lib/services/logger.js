// lib/services/logger.js
const { DatabaseClient } = require('../database');

class Logger {
  constructor() {
    this.db = new DatabaseClient();
  }

  // Generate unique request ID for tracing
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Main logging method
  async log(level, category, message, options = {}) {
    try {
      const {
        details = null,
        userId = null,
        connectionId = null,
        sessionId = null,
        requestId = null,
        source = null,
        ipAddress = null,
        userAgent = null,
        error = null
      } = options;

      // Enhance details with error information if provided
      let enhancedDetails = details;
      if (error) {
        enhancedDetails = {
          ...details,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error.cause && { cause: error.cause })
          }
        };
      }

      await this.db.query(`
        INSERT INTO system_logs (
          level, category, message, details, user_id, connection_id,
          session_id, request_id, source, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        level.toUpperCase(),
        category,
        message,
        enhancedDetails ? JSON.stringify(enhancedDetails) : null,
        userId,
        connectionId,
        sessionId,
        requestId,
        source,
        ipAddress,
        userAgent
      ]);

      // Also log to console for development
      if (process.env.NODE_ENV === 'development') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${level.toUpperCase()} [${category}] ${message}`;
        
        switch (level.toUpperCase()) {
          case 'ERROR':
          case 'FATAL':
            console.error(logMessage, enhancedDetails);
            break;
          case 'WARN':
            console.warn(logMessage, enhancedDetails);
            break;
          case 'DEBUG':
            console.debug(logMessage, enhancedDetails);
            break;
          default:
            console.log(logMessage, enhancedDetails);
        }
      }

    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to write to system log:', error);
      console.error('Original log message:', { level, category, message, options });
    }
  }

  // Convenience methods
  debug(category, message, options = {}) {
    return this.log('DEBUG', category, message, options);
  }

  info(category, message, options = {}) {
    return this.log('INFO', category, message, options);
  }

  warn(category, message, options = {}) {
    return this.log('WARN', category, message, options);
  }

  error(category, message, options = {}) {
    return this.log('ERROR', category, message, options);
  }

  fatal(category, message, options = {}) {
    return this.log('FATAL', category, message, options);
  }

  // Connection-specific logging helpers
  async logConnectionTest(connectionId, result, options = {}) {
    const level = result.success ? 'INFO' : 'ERROR';
    const message = result.success 
      ? 'Connection test successful'
      : `Connection test failed: ${result.error || 'Unknown error'}`;

    return this.log(level, 'CONNECTION_TEST', message, {
      ...options,
      connectionId,
      details: result
    });
  }

  async logConnectionImport(connectionId, stats, options = {}) {
    const level = stats.errors && stats.errors.length > 0 ? 'WARN' : 'INFO';
    const message = `Import completed: ${stats.usersCreated} users, ${stats.groupsCreated} groups created`;

    return this.log(level, 'CONNECTION_IMPORT', message, {
      ...options,
      connectionId,
      details: stats
    });
  }

  // Query logs with filtering
  async getLogs(options = {}) {
    const {
      level = null,
      category = null,
      connectionId = null,
      userId = null,
      startDate = null,
      endDate = null,
      limit = 100,
      offset = 0,
      requestId = null
    } = options;

    let query = `
      SELECT 
        l.*,
        c.name as connection_name,
        u.username as user_username
      FROM system_logs l
      LEFT JOIN connections c ON l.connection_id = c.id
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (level) {
      query += ` AND l.level = $${paramIndex++}`;
      params.push(level.toUpperCase());
    }

    if (category) {
      query += ` AND l.category = $${paramIndex++}`;
      params.push(category);
    }

    if (connectionId) {
      query += ` AND l.connection_id = $${paramIndex++}`;
      params.push(connectionId);
    }

    if (userId) {
      query += ` AND l.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (requestId) {
      query += ` AND l.request_id = $${paramIndex++}`;
      params.push(requestId);
    }

    if (startDate) {
      query += ` AND l.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND l.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  // Get log statistics
  async getLogStats(timeRange = '24 hours') {
    const query = `
      SELECT 
        level,
        category,
        COUNT(*) as count
      FROM system_logs 
      WHERE created_at >= NOW() - INTERVAL '${timeRange}'
      GROUP BY level, category
      ORDER BY level, count DESC
    `;

    const result = await this.db.query(query);
    return result.rows;
  }
}

// Create singleton instance
const logger = new Logger();

// Export both class and instance
module.exports = {
  Logger,
  logger
};

// For backward compatibility
module.exports.default = logger;