import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// MUST load .env BEFORE any imports that read process.env
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env (optional — on Render, env vars come from dashboard)
dotenv.config({ path: path.join(__dirname, '.env') });
// Also try loading from project root (for Render compatibility)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const AGNES_KEY = process.env.AGNES_API_KEY || '';
console.error('[STARTUP] Key MD5:', crypto.createHash('md5').update(AGNES_KEY).digest('hex'));

// Import routes AFTER dotenv.config()
const { default: chatRoutes } = await import('./routes/chat.js');
const { default: dataRoutes } = await import('./routes/data.js');
const { default: authRoutes } = await import('./routes/auth.js');

const app = express();
const PORT = process.env.PORT || 3001;

const isProd = process.env.NODE_ENV === 'production';
app.use(cors(isProd ? { origin: true } : {}));
app.use(express.json({ limit: '10mb' }));
app.use('/api/chat', chatRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production: serve built frontend
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.error(`Server running: http://localhost:${PORT}`);
  console.error(`Health: http://localhost:${PORT}/api/health`);
});
