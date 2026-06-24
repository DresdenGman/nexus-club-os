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
app.use(cors(isProd ? {} : {}));
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
