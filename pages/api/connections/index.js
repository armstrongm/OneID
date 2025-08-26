// pages/api/connections/index.js - Working version with simple database
import { getAllConnections, createConnection } from '../../../lib/simple-connections';

export default async function handler(req, res) {
  console.log('CONNECTIONS API - Method:', req.method);
  
  try {
    if (req.method === 'GET') {
      const connections = getAllConnections();
      console.log('Retrieved connections:', connections.length);
      return res.status(200).json({ connections });
    }
    
    if (req.method === 'POST') {
      const newConnection = createConnection(req.body);
      console.log('Created connection:', newConnection.id);
      return res.status(201).json(newConnection);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}