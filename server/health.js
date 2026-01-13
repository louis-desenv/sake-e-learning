import 'dotenv/config';
import express from 'express';

const app = express();
const HEALTH_PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ status: 'LiveKit Agent Health Check', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(HEALTH_PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${HEALTH_PORT}`);
});
