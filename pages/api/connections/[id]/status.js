// pages/api/connections/[id]/status.js
import { getConnection } from '../../../../lib/simple-connections';

export default async function handler(req, res) {
  const { query: { id } } = req;

  try {
    const connection = getConnection(id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    return res.status(200).json({
      id: connection.id,
      status: connection.status || 'created',
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}