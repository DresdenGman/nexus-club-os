import { Router } from 'express';
import crypto from 'crypto';
import { getSupabase } from '../db.js';

const router = Router();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verify;
}

function generateToken(uid, email) {
  const secret = process.env.AUTH_SECRET || 'nexus-club-os-secret-2024';
  const payload = { uid, email, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(data).toString('base64') + '.' + hmac;
}

function verifyToken(token) {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    const data = Buffer.from(encoded, 'base64').toString('utf-8');
    const secret = process.env.AUTH_SECRET || 'nexus-club-os-secret-2024';
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    if (signature !== expected) return null;
    const payload = JSON.parse(data);
    if (payload.exp < Date.now()) return null;
    return { uid: payload.uid, email: payload.email };
  } catch { return null; }
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, department } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const supabase = getSupabase();
    const cleanEmail = email.toLowerCase().trim();

    const { data: existing } = await supabase.from('users').select('uid').eq('email', cleanEmail).maybeSingle();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const uid = crypto.randomUUID();
    const hashedPw = hashPassword(password);

    const { error: createError } = await supabase.from('users').insert({
      uid,
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password_hash: hashedPw,
      role: 'member',
      department: department || null,
      join_date: new Date().toISOString(),
      contribution: 0,
    });

    if (createError) {
      return res.status(500).json({ error: createError.message });
    }

    const { data: rawProfile } = await supabase.from('users').select('uid,name,email,role,department,join_date,contribution,avatar,created_at').eq('uid', uid).single();
    const profile = rawProfile;
    const token = generateToken(uid, cleanEmail);

    res.status(201).json({
      user: { uid, email: cleanEmail, displayName: name || cleanEmail.split('@')[0] },
      profile,
      session: { access_token: token },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const supabase = getSupabase();
    const cleanEmail = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('uid,name,email,role,department,join_date,contribution,avatar,password_hash,created_at')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Auto-promote admin email users
    const adminEmails = ['administrator@admin.com', 'dresdengoehner@gmail.com', 'admin@nexusclub.com'];
    if (adminEmails.includes(cleanEmail) && user.role !== 'admin') {
      await supabase.from('users').update({ role: 'admin' }).eq('uid', user.uid);
      user.role = 'admin';
    }

    const { password_hash, ...profile } = user;
    const token = generateToken(user.uid, user.email);

    res.json({
      user: { uid: user.uid, email: user.email, displayName: user.name },
      profile,
      session: { access_token: token },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/session
router.get('/session', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.json({ user: null, profile: null });

    const decoded = verifyToken(token);
    if (!decoded) return res.json({ user: null, profile: null });

    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('uid,name,email,role,department,join_date,contribution,avatar,password_hash,created_at')
      .eq('uid', decoded.uid)
      .maybeSingle();
    if (!user) return res.json({ user: null, profile: null });

    const { password_hash, ...profile } = user;
    res.json({
      user: { uid: user.uid, email: user.email, displayName: user.name },
      profile,
      session: { access_token: token },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.json({ success: true });
});

export { verifyToken };
export default router;
