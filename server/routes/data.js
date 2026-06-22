import { Router } from 'express';
import { getSupabase } from '../db.js';
import { verifyToken } from './auth.js';

const router = Router();

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token || '');
  if (!decoded) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = decoded;
  next();
}

// Field whitelists to prevent mass assignment
const CLUB_FIELDS = ['name', 'type', 'status', 'president_id', 'members_count', 'image', 'description'];
const APPROVAL_FIELDS = ['type', 'applicant_id', 'applicant_name', 'status', 'details'];
const CLUB_UPDATE_FIELDS = ['name', 'type', 'status', 'members_count', 'image', 'description'];

function whitelist(obj, fields) {
  const result = {};
  for (const f of fields) {
    if (obj[f] !== undefined) result[f] = obj[f];
  }
  return result;
}

// ===== CLUBS =====

router.get('/clubs', async (_req, res) => {
  try { const data = await getSupabase().from('clubs').select('*').order('created_at', { ascending: false }); res.json(data.data || data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clubs', requireAuth, async (req, res) => {
  try {
    const clean = whitelist(req.body, CLUB_FIELDS);
    // Default president_id to current user
    if (!clean.president_id) clean.president_id = req.user.uid;
    // Only allow creating own club or admin
    if (clean.president_id !== req.user.uid) {
      const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).single();
      if (profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Cannot create club for another user' });
      }
    }
    const { data, error } = await getSupabase().from('clubs').insert(clean).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/clubs/:id', requireAuth, async (req, res) => {
  try {
    const clean = whitelist(req.body, CLUB_UPDATE_FIELDS);
    const { data, error } = await getSupabase().from('clubs').update(clean).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/clubs/:id', requireAuth, async (req, res) => {
  try {
    const { data: club } = await getSupabase().from('clubs').select('president_id').eq('id', req.params.id).single();
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).single();
    if (!club || (club.president_id !== req.user.uid && profile?.role !== 'admin')) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    const { error } = await getSupabase().from('clubs').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== APPROVALS =====

router.get('/approvals', requireAuth, async (req, res) => {
  try {
    let query = getSupabase().from('approvals').select('*').order('created_at', { ascending: false });
    // Non-admins only see own approvals
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).single();
    if (profile?.role !== 'admin') {
      query = query.eq('applicant_id', req.user.uid);
    }
    if (req.query.uid && profile?.role === 'admin') {
      query = query.eq('applicant_id', req.query.uid);
    }
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/approvals', requireAuth, async (req, res) => {
  try {
    const clean = whitelist(req.body, APPROVAL_FIELDS);
    // Force applicant to be the logged-in user
    clean.applicant_id = req.user.uid;
    clean.status = 'Pending Review';
    const { data, error } = await getSupabase().from('approvals').insert(clean).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/approvals/:id', requireAuth, async (req, res) => {
  try {
    // Only allow status changes, and only for admins
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).single();
    if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const updates = {};
    if (req.body.status) updates.status = req.body.status;

    const { data, error } = await getSupabase().from('approvals').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/approvals/:id', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).single();
    if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { error } = await getSupabase().from('approvals').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== USERS =====

router.get('/users', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('users')
      .select('id,uid,name,email,role,department,join_date,contribution,avatar,created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/users/:id', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).single();
    if (profile?.role !== 'admin' && req.user.uid !== req.params.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    const allowed = ['name', 'department', 'avatar'];
    const clean = {};
    for (const f of allowed) { if (req.body[f] !== undefined) clean[f] = req.body[f]; }
    const { data, error } = await getSupabase()
      .from('users')
      .update(clean)
      .eq('uid', req.params.id)
      .select('uid,name,email,role,department,join_date,contribution,avatar,created_at')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).single();
    if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    // Prevent deleting self
    if (req.params.id === req.user.uid) return res.status(400).json({ error: 'Cannot delete yourself' });
    const { error } = await getSupabase().from('users').delete().eq('uid', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
