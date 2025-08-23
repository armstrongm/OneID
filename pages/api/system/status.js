// pages/api/system/status.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const systemStatus = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'operational',
          responseTime: Math.floor(Math.random() * 50) + 10,
          lastCheck: new Date().toISOString()
        },
        authentication: {
          status: 'operational',
          responseTime: Math.floor(Math.random() * 100) + 50,
          lastCheck: new Date().toISOString()
        },
        api: {
          status: 'operational',
          responseTime: Math.floor(Math.random() * 30) + 5,
          lastCheck: new Date().toISOString()
        }
      },
      metrics: {
        uptime: '99.9%',
        totalUsers: 1284,
        activeUsers: 1127,
        totalGroups: 64,
        systemLoad: Math.floor(Math.random() * 30) + 20,
        memoryUsage: Math.floor(Math.random() * 40) + 30,
      }
    };

    return res.status(200).json(systemStatus);

  } catch (error) {
    console.error('System status check failed:', error);
    return res.status(500).json({
      status: 'down',
      error: 'System status check failed',
      timestamp: new Date().toISOString()
    });
  }
}