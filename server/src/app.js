import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import api from './routes/index.js';

export default function createApp() {
  const app = express();
  const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
  app.disable('x-powered-by');
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: '50kb' }));
  app.get('/health', (_, res) => res.json({ ok: true }));
  app.use(clerkMiddleware());
  app.use('/api', api);
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.code === 11000) return res.status(409).json({ error: 'That name already exists' });
    if (err.name === 'CastError' || err.name === 'ValidationError') return res.status(400).json({ error: 'Invalid input' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  });
  return app;
}
