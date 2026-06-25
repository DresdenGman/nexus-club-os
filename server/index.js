import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

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
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// File upload
const uploadDir = path.join(__dirname, '..', 'uploads');
import fs from 'fs';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } });
app.use('/uploads', express.static(uploadDir));

// Request logging (reads statusCode after response is sent)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    }
  });
  next();
});

app.use('/api/chat', chatRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/auth', authRoutes);

// Visit counter
app.post('/api/visit', async (_req, res) => {
  try {
    const { getSupabase } = await import('./db.js');
    await getSupabase().from('visits').insert({});
    res.json({ ok: true });
  } catch { res.json({ ok: false }); }
});

// Daily visit counts for last 7 days
app.get('/api/data/visits/daily', async (_req, res) => {
  try {
    const { getSupabase } = await import('./db.js');
    const supabase = getSupabase();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const { count } = await supabase.from('visits').select('*', { count: 'exact', head: true })
        .gte('created_at', dayStr + 'T00:00:00Z').lt('created_at', dayStr + 'T23:59:59Z');
      result.push(count || 0);
    }
    res.json(result);
  } catch { res.json([0,0,0,0,0,0,0]); }
});

// Daily membership counts for last 7 days
app.get('/api/data/memberships/daily', async (_req, res) => {
  try {
    const { getSupabase } = await import('./db.js');
    const supabase = getSupabase();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const { count } = await supabase.from('memberships').select('*', { count: 'exact', head: true })
        .gte('created_at', dayStr + 'T00:00:00Z').lt('created_at', dayStr + 'T23:59:59Z');
      result.push(count || 0);
    }
    res.json(result);
  } catch { res.json([0,0,0,0,0,0,0]); }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload club image
app.post('/api/upload/club/:id', upload.single('image'), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { verifyToken } = await import('./routes/auth.js');
    const decoded = verifyToken(token || '');
    if (!decoded) return res.status(401).json({ error: 'Auth required' });

    if (!req.file) return res.status(400).json({ error: 'No image file' });

    const { getSupabase } = await import('./db.js');
    const supabase = getSupabase();

    // Verify user is president of this club or admin
    const { data: membership } = await supabase.from('memberships')
      .select('role').eq('user_id', decoded.uid).eq('club_id', req.params.id).maybeSingle();
    const { data: profile } = await supabase.from('users').select('role').eq('uid', decoded.uid).maybeSingle();
    
    if (!membership && profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Only president or admin can update' });
    }
    if (membership && membership.role !== 'president' && profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Only president or admin can update' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    await supabase.from('clubs').update({ image: imageUrl }).eq('id', req.params.id);
    
    res.json({ success: true, image_url: imageUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
  console.log(`Server running: http://localhost:${PORT}`);
});
