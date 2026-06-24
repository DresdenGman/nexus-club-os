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
const CLUB_FIELDS = ['name', 'type', 'president_id', 'members_count', 'image', 'description'];
const APPROVAL_FIELDS = ['type', 'details'];
const CLUB_UPDATE_FIELDS = ['name', 'type', 'status', 'image', 'description'];

function whitelist(obj, fields) {
  const result = {};
  for (const f of fields) {
    if (obj[f] !== undefined) result[f] = obj[f];
  }
  return result;
}

// ===== CLUBS =====

router.get('/clubs/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: club, error } = await supabase.from('clubs').select('*').eq('id', req.params.id).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    if (!club) return res.status(404).json({ error: 'Not found' });

    // Fetch president name
    if (club.president_id) {
      const { data: user } = await supabase.from('users').select('name').eq('uid', club.president_id).maybeSingle();
      club.president_name = user?.name || 'Unknown';
    }
    res.json(club);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/clubs', async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data: clubs, error } = await supabase.from('clubs').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    // Batch-fetch president names
    const presidentIds = [...new Set(clubs.map(c => c.president_id).filter(Boolean))];
    if (presidentIds.length > 0) {
      const { data: users } = await supabase.from('users').select('uid,name').in('uid', presidentIds);
      const nameMap = {};
      if (users) users.forEach(u => { nameMap[u.uid] = u.name; });
      clubs.forEach(c => { c.president_name = nameMap[c.president_id] || 'Unknown'; });
    }

    res.json(clubs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/data/memberships — apply to join club
router.post('/memberships', requireAuth, async (req, res) => {
  try {
    const { club_id } = req.body;
    if (!club_id) return res.status(400).json({ error: 'club_id required' });
    const supabase = getSupabase();

    // Verify club exists
    const { data: club } = await supabase.from('clubs').select('id').eq('id', club_id).maybeSingle();
    if (!club) return res.status(404).json({ error: 'Club not found' });

    const { data: existing } = await supabase.from('memberships')
      .select('id,status').eq('user_id', req.user.uid).eq('club_id', club_id).maybeSingle();
    if (existing) {
      if (existing.status === 'pending') return res.status(409).json({ error: 'Already applied' });
      if (existing.status === 'active') return res.status(409).json({ error: 'Already a member' });
      // Rejected — delete old record and allow re-apply
      await supabase.from('memberships').delete().eq('id', existing.id);
    }
    const { data, error } = await supabase.from('memberships').insert({
      user_id: req.user.uid, club_id, role: 'member', status: 'pending',
    }).select().maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/data/memberships/:id — approve/reject
router.patch('/memberships/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be active or rejected' });
    const supabase = getSupabase();
    const { data: membership } = await supabase.from('memberships').select('club_id').eq('id', req.params.id).maybeSingle();
    if (!membership) return res.status(404).json({ error: 'Not found' });
    const { data: president } = await supabase.from('memberships')
      .select('id').eq('user_id', req.user.uid).eq('club_id', membership.club_id).eq('role', 'president').maybeSingle();
    const { data: profile } = await supabase.from('users').select('role').eq('uid', req.user.uid).maybeSingle();
    if (!president && profile?.role !== 'admin') return res.status(403).json({ error: 'Only president or admin' });
    const { data, error } = await supabase.from('memberships').update({ status }).eq('id', req.params.id).eq('status', 'pending').select().maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(400).json({ error: 'Application is no longer pending — may have already been processed' });
    if (status === 'active') {
      const { data: club } = await supabase.from('clubs').select('members_count').eq('id', membership.club_id).maybeSingle();
      if (club) await supabase.from('clubs').update({ members_count: (club.members_count || 0) + 1 }).eq('id', membership.club_id);
    }
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/data/clubs/:id/pending — pending applications for this club
router.get('/clubs/:id/pending', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    // Verify club exists and user is president or admin
    const { data: club } = await supabase.from('clubs').select('id').eq('id', req.params.id).maybeSingle();
    if (!club) return res.status(404).json({ error: 'Club not found' });

    const { data: president } = await supabase.from('memberships')
      .select('id').eq('user_id', req.user.uid).eq('club_id', req.params.id).eq('role', 'president').maybeSingle();
    const { data: profile } = await supabase.from('users').select('role').eq('uid', req.user.uid).maybeSingle();
    if (!president && profile?.role !== 'admin') return res.status(403).json({ error: 'Only president or admin' });

    const { data, error } = await supabase.from('memberships')
      .select('id,user_id,role,status,created_at')
      .eq('club_id', req.params.id)
      .eq('status', 'pending');
    if (error) return res.status(400).json({ error: error.message });
    if (!data || data.length === 0) return res.json([]);

    const userIds = data.map(m => m.user_id);
    const { data: users } = await supabase.from('users').select('uid,name').in('uid', userIds);
    const userMap = {};
    if (users) users.forEach(u => { userMap[u.uid] = u.name; });

    const result = data.map(m => ({ ...m, applicant_name: userMap[m.user_id] || 'Unknown' }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/data/memberships/my
router.get('/memberships/my', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('club_id, role, status')
      .eq('user_id', req.user.uid)
      .eq('status', 'active');

    if (error) return res.status(400).json({ error: error.message });
    if (!memberships || memberships.length === 0) return res.json([]);

    const clubIds = memberships.map(m => m.club_id);
    const { data: clubs } = await supabase.from('clubs').select('id,name,type,members_count,description').in('id', clubIds);
    const clubMap = {};
    if (clubs) clubs.forEach(c => { clubMap[c.id] = c; });

    const result = memberships.map(m => ({
      ...clubMap[m.club_id],
      my_role: m.role,
    })).filter(m => m.id);

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/data/clubs/:id/members
router.get('/clubs/:id/members', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('user_id, role, status')
      .eq('club_id', req.params.id)
      .eq('status', 'active');

    if (error) return res.status(400).json({ error: error.message });
    if (!memberships || memberships.length === 0) return res.json([]);

    const userIds = memberships.map(m => m.user_id);
    const { data: users } = await supabase.from('users').select('uid,name,email,avatar').in('uid', userIds);
    const userMap = {};
    if (users) users.forEach(u => { userMap[u.uid] = u; });

    const members = memberships.map(m => ({
      ...userMap[m.user_id],
      role: m.role,
    }));

    res.json(members);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clubs', requireAuth, async (req, res) => {
  try {
    const clean = whitelist(req.body, CLUB_FIELDS);
    if (!clean.name || !clean.name.trim()) return res.status(400).json({ error: 'Club name is required' });
    clean.status = 'Active';
    if (!clean.president_id) clean.president_id = req.user.uid;
    if (clean.president_id !== req.user.uid) {
      const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).maybeSingle();
      if (profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Cannot create club for another user' });
      }
    }
    const { data, error } = await getSupabase().from('clubs').insert(clean).select().maybeSingle();
    if (error) return res.status(400).json({ error: error.message });

    // Auto-create president membership
    if (data) {
      const { error: mErr } = await getSupabase().from('memberships').insert({
        user_id: clean.president_id,
        club_id: data.id,
        role: 'president',
        status: 'active',
      });
      if (mErr) console.error('Failed to create president membership:', mErr.message);
    }

    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/clubs/:id', requireAuth, async (req, res) => {
  try {
    // Verify ownership: must be president or admin
    const { data: membership } = await getSupabase().from('memberships')
      .select('role').eq('user_id', req.user.uid).eq('club_id', req.params.id).maybeSingle();
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).maybeSingle();
    if ((!membership || membership.role !== 'president') && profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Only club president or admin can edit' });
    }

    const clean = whitelist(req.body, CLUB_UPDATE_FIELDS);
    const { data, error } = await getSupabase().from('clubs').update(clean).eq('id', req.params.id).select().maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/clubs/:id', requireAuth, async (req, res) => {
  try {
    const { data: club } = await getSupabase().from('clubs').select('president_id').eq('id', req.params.id).maybeSingle();
    if (!club) return res.status(404).json({ error: 'Club not found' });
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).maybeSingle();
    if (club.president_id !== req.user.uid && profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    // Cascade: delete memberships first
    await getSupabase().from('memberships').delete().eq('club_id', req.params.id);
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
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).maybeSingle();
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
    // Force applicant from token
    clean.applicant_id = req.user.uid;
    clean.status = 'Pending Review';
    // Always use the user's real name from DB
    const { data: userProfile } = await getSupabase().from('users').select('name').eq('uid', req.user.uid).maybeSingle();
    clean.applicant_name = userProfile?.name || 'Unknown';
    const { data, error } = await getSupabase().from('approvals').insert(clean).select().maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/approvals/:id', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).maybeSingle();
    if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (!req.body.status || !['Approved','Rejected','Pending Review'].includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates = {};
    if (req.body.status) updates.status = req.body.status;

    const { data, error } = await getSupabase().from('approvals').update(updates).eq('id', req.params.id).select().maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/approvals/:id', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).maybeSingle();
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
      .select('id,uid,name,email,username,role,department,join_date,contribution,avatar,created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/users/:id', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).maybeSingle();
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
      .maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await getSupabase().from('users').select('role').eq('uid', req.user.uid).maybeSingle();
    if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (req.params.id === req.user.uid) return res.status(400).json({ error: 'Cannot delete yourself' });
    // Cascade: delete memberships first
    await getSupabase().from('memberships').delete().eq('user_id', req.params.id);
    const { error } = await getSupabase().from('users').delete().eq('uid', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
