export default function handler(req, res) {
  return res.status(200).json({ test: 'working', connections: ['test-conn-1'] });
}