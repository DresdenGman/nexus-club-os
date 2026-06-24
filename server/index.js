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

// Temporary: purge endpoint
app.post('/api/admin/purge', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { verifyToken } = await import('./routes/auth.js');
  const decoded = verifyToken(token || '');
  if (!decoded || decoded.email !== 'admin@nexusclub.com') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const { getSupabase } = await import('./db.js');
  const supabase = getSupabase();
  const results = {};
  try {
    // Delete all memberships
    const { error: e1, count: c1 } = await supabase.from('memberships').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    results.memberships = e1 ? e1.message : (c1 || 0);
  } catch {}
  try {
    // Delete all approvals
    const { error: e2, count: c2 } = await supabase.from('approvals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    results.approvals = e2 ? e2.message : (c2 || 0);
  } catch {}
  try {
    // Delete all clubs
    const { error: e3, count: c3 } = await supabase.from('clubs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    results.clubs = e3 ? e3.message : (c3 || 0);
  } catch {}
  try {
    // Delete all non-admin users
    const { error: e4, count: c4 } = await supabase.from('users').delete().neq('email', 'admin@nexusclub.com').neq('email', 'manager@nexusclub.com');
    results.users = e4 ? e4.message : (c4 || 0);
  } catch {}
  res.json({ success: true, results });
});

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
