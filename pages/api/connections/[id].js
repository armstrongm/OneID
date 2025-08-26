// pages/api/connections/[id].js - With debugging
import { getConnection, updateConnection } from '../../../lib/simple-connections';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  console.log(`API Call: ${method} /api/connections/${id}`);

  try {
    if (method === 'GET') {
      const connection = getConnection(id);
      if (!connection) {
        console.log(`GET: Connection not found: ${id}`);
        return res.status(404).json({ error: 'Connection not found' });
      }
      console.log(`GET: Returning connection: ${connection.name}`);
      return res.status(200).json(connection);
    }

    if (method === 'PUT') {
      console.log('PUT: Request body:', req.body);
      
      if (!req.body) {
        return res.status(400).json({ error: 'Request body required' });
      }

      const updatedConnection = updateConnection(id, req.body);
      if (!updatedConnection) {
        console.log(`PUT: Connection not found: ${id}`);
        return res.status(404).json({ error: 'Connection not found' });
      }
      
      console.log(`PUT: Successfully updated connection: ${id}`);
      return res.status(200).json(updatedConnection);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error(`API Error for ${method} ${id}:`, error);
    return res.status(500).json({ error: error.message });
  }
}