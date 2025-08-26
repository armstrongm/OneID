// pages/api/test.js - Basic test endpoint
export default function handler(req, res) {
  console.log(`🔄 ${req.method} /api/test`);
  
  res.status(200).json({ 
    success: true,
    message: 'API is working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    server: 'Next.js API Routes'
  });
}