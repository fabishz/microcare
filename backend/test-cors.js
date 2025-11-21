import express from 'express';
import cors from 'cors';

const app = express();

// Simulate the CORS configuration from the backend
const allowedOrigins = ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(3001, () => {
  console.log('Test server running on port 3001');
});

// Test CORS headers
setTimeout(() => {
  const http = require('http');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Origin': 'http://localhost:5173'
    }
  };

  const req = http.request(options, (res) => {
    console.log('\n✓ CORS Test Results:');
    console.log('Status:', res.statusCode);
    console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Credentials:', res.headers['access-control-allow-credentials']);
    console.log('Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
    console.log('Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
    
    server.close();
    process.exit(0);
  });

  req.on('error', (e) => {
    console.error('Error:', e);
    server.close();
    process.exit(1);
  });

  req.end();
}, 500);
