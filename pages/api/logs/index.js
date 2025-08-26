// pages/api/logs/index.js
//import { logger } from '../../../lib/services/logger';
const { logger } = require('../../../lib/services/logger');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      level,
      category,
      connectionId,
      userId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      requestId,
      search
    } = req.query;

    // Build filter options
    const filterOptions = {
      level: level || null,
      category: category || null,
      connectionId: connectionId ? parseInt(connectionId) : null,
      userId: userId ? parseInt(userId) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      limit: Math.min(parseInt(limit), 500), // Max 500 logs per request
      offset: parseInt(offset),
      requestId: requestId || null
    };

    // Get logs
    const logs = await logger.getLogs(filterOptions);
    
    // If search term provided, filter by message content
    let filteredLogs = logs;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredLogs = logs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        log.category.toLowerCase().includes(searchTerm) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm))
      );
    }

    // Get total count for pagination
    const totalQuery = `
      SELECT COUNT(*) as total 
      FROM system_logs 
      WHERE 1=1
      ${level ? `AND level = '${level.toUpperCase()}'` : ''}
      ${category ? `AND category = '${category}'` : ''}
      ${connectionId ? `AND connection_id = ${connectionId}` : ''}
      ${userId ? `AND user_id = ${userId}` : ''}
      ${startDate ? `AND created_at >= '${startDate}'` : ''}
      ${endDate ? `AND created_at <= '${endDate}'` : ''}
      ${requestId ? `AND request_id = '${requestId}'` : ''}
    `;

    const totalResult = await logger.db.query(totalQuery);
    const total = parseInt(totalResult.rows[0].total);

    return res.status(200).json({
      logs: filteredLogs,
      pagination: {
        total,
        limit: filterOptions.limit,
        offset: filterOptions.offset,
        hasNext: (filterOptions.offset + filterOptions.limit) < total,
        hasPrev: filterOptions.offset > 0
      },
      filters: filterOptions
    });

  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return res.status(500).json({
      error: 'Failed to fetch logs',
      details: error.message
    });
  }
}

// pages/api/logs/stats.js
import { logger } from '../../../lib/services/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeRange = '24 hours' } = req.query;
    
    const stats = await logger.getLogStats(timeRange);
    
    // Get recent error count
    const recentErrorsQuery = `
      SELECT COUNT(*) as count
      FROM system_logs 
      WHERE level IN ('ERROR', 'FATAL') 
      AND created_at >= NOW() - INTERVAL '1 hour'
    `;
    
    const recentErrorsResult = await logger.db.query(recentErrorsQuery);
    const recentErrors = parseInt(recentErrorsResult.rows[0].count);

    // Get connection test success rate
    const connectionTestQuery = `
      SELECT 
        COUNT(*) as total_tests,
        COUNT(CASE WHEN level = 'INFO' THEN 1 END) as successful_tests
      FROM system_logs 
      WHERE category = 'CONNECTION_TEST'
      AND created_at >= NOW() - INTERVAL '${timeRange}'
    `;
    
    const connectionTestResult = await logger.db.query(connectionTestQuery);
    const connectionTests = connectionTestResult.rows[0];
    
    const successRate = connectionTests.total_tests > 0 
      ? Math.round((connectionTests.successful_tests / connectionTests.total_tests) * 100)
      : 0;

    return res.status(200).json({
      stats,
      summary: {
        recentErrors,
        connectionTestSuccessRate: successRate,
        totalConnectionTests: parseInt(connectionTests.total_tests),
        timeRange
      }
    });

  } catch (error) {
    console.error('Failed to fetch log stats:', error);
    return res.status(500).json({
      error: 'Failed to fetch log statistics',
      details: error.message
    });
  }
}

// pages/api/logs/categories.js
import { logger } from '../../../lib/services/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const query = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM system_logs 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY category 
      ORDER BY count DESC
    `;
    
    const result = await logger.db.query(query);
    const categories = result.rows;

    return res.status(200).json({ categories });

  } catch (error) {
    console.error('Failed to fetch log categories:', error);
    return res.status(500).json({
      error: 'Failed to fetch log categories',
      details: error.message
    });
  }
}