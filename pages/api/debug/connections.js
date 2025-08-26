// pages/api/debug/connections.js
export default function handler(req, res) {
  console.log('DEBUG ENDPOINT CALLED');
  return res.status(200).json({
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString()
  });
}