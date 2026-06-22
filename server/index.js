import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// MUST load .env BEFORE any imports that read process.env
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import routes AFTER dotenv.config()
const { default: chatRoutes } = await import('./routes/chat.js');
const { default: dataRoutes } = await import('./routes/data.js');
const { default: authRoutes } = await import('./routes/auth.js');

const app = express();
const PORT = process.env.PORT || 3001;

const isProd = process.env.NODE_ENV === 'production';
app.use(cors(isProd ? {} : {}));
app.use(express.json({ limit: '10mb' }));

// Request logging (reads statusCode after response is sent)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.error(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    }
  });
  next();
});

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
});
