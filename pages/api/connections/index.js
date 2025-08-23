// pages/api/connections/index.js
const mockConnections = [
  {
    id: 'conn-1',
    name: 'Primary Active Directory',
    type: 'AD',
    status: 'connected',
    serverName: 'dc01.company.com',
    domain: 'company.com',
    lastTested: new Date().toISOString(),
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 'conn-2',
    name: 'HR LDAP Server',
    type: 'LDAP',
    status: 'connected',
    serverName: 'ldap.hr.company.com',
    baseDN: 'ou=users,dc=hr,dc=company,dc=com',
    lastTested: new Date().toISOString(),
    createdAt: new Date('2024-01-20').toISOString()
  }
];

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return res.status(200).json({ connections: mockConnections });
      
      case 'POST':
        const newConnection = {
          id: `conn-${Date.now()}`,
          ...req.body,
          status: 'testing',
          createdAt: new Date().toISOString(),
          lastTested: new Date().toISOString()
        };
        mockConnections.push(newConnection);
        return res.status(201).json(newConnection);
      
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Connections API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}