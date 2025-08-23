// pages/api/test.js - Simple test endpoint
export default function handler(req, res) {
  console.log('Test endpoint called:', req.method);
  res.status(200).json({ 
    message: 'Backend is working!',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

fetch('/api/auth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: 'test-code',
    redirectUri: 'http://localhost:3001/auth/callback'
  })
})
.then(response => response.json())
.then(data => console.log('Response:', data))
.catch(error => console.error('Error:', error));