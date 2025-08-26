// pages/api/connections/[id]/test.js - Test stored connection
import { ConnectionManager } from '../../../../lib/database-connections';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(`Testing connection: ${id}`);
    
    const testResult = await ConnectionManager.testConnection(id);
    
    return res.status(200).json({
      connectionId: id,
      ...testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Connection test failed for ${id}:`, error);
    
    if (error.message === 'Connection not found') {
      return res.status(404).json({
        error: 'Connection not found',
        connectionId: id
      });
    }

    return res.status(400).json({
      connectionId: id,
      success: false,
      error: 'Connection test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}