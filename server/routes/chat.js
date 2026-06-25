import express from 'express';
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { prompt, context, model } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const AGNES_KEY = process.env.AGNES_CHAT_KEY || process.env.AGNES_API_KEY || '';
    const AGNES_BASE = process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1';
    const useModel = model || 'agnes-1.5-flash';

    // Auto-fetch ALL platform data
    let platformContext = '';
    try {
      const { getSupabase } = await import('../db.js');
      const s = getSupabase();

      // ── Clubs ──
      const { data: clubs } = await s.from('clubs').select('id,name,type,description,members_count,president_id').limit(100);
      if (clubs?.length) {
        const pids = [...new Set(clubs.map(c => c.president_id).filter(Boolean))];
        const nm = {};
        if (pids.length) {
          const { data: us } = await s.from('users').select('uid,name').in('uid', pids);
          us?.forEach(u => { nm[u.uid] = u.name; });
        }
        platformContext += `=== CLUBS (${clubs.length}) ===\n${clubs.map(c => `${c.name} (${c.type}) | ${c.members_count||0}m | President: ${nm[c.president_id]||'?'}`).join('\n')}\n\n`;
      }

      // ── Activities ──
      const { data: acts } = await s.from('activities').select('title,primary_club_id,start_time,end_time,participant_count,status').eq('status','active').limit(50);
      if (acts?.length) {
        const cids = [...new Set(acts.map(a => a.primary_club_id))];
        const cm = {};
        if (cids.length) {
          const { data: clx } = await s.from('clubs').select('id,name').in('id', cids);
          clx?.forEach(c => { cm[c.id] = c.name; });
        }
        platformContext += `=== ACTIVITIES (${acts.length}) ===\n${acts.map(a => `${a.title} | Host: ${cm[a.primary_club_id]||'?'} | ${a.participant_count||0}p | ${a.status}${a.end_time?' | Ends: '+a.end_time.split('T')[0]:''}`).join('\n')}\n\n`;
      }

      // ── Users ──
      const { count: userCount } = await s.from('users').select('*', { count: 'exact', head: true });
      platformContext += `=== STATS ===\nTotal Users: ${userCount||0} | Total Clubs: ${clubs?.length||0} | Active Activities: ${acts?.filter(a => a.status==='active').length||0}\n`;

    } catch { platformContext = '(Platform data unavailable)'; }

    const messages = [{
      role: 'system',
      content: 'You are an AI assistant for BRS (Beijing Royal School) Club Platform. Never mention your model name. Answer questions accurately using ONLY the real-time data below. If something isn\'t in the data, say so honestly.'
    }, {
      role: 'system',
      content: `=== CURRENT PLATFORM DATA ===\n${platformContext}\n=== END DATA ===`
    }];

    if (context) messages.push({ role: 'system', content: context });
    messages.push({ role: 'user', content: prompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const resp = await fetch(`${AGNES_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AGNES_KEY}` },
      body: JSON.stringify({ model: useModel, messages, max_tokens: 1024 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: 'Agnes API error', detail: errText.slice(0, 500) });
    }

    const data = await resp.json();
    res.json({ reply: data.choices?.[0]?.message?.content || '', model: useModel });
  } catch (err) {
    res.status(err.name === 'AbortError' ? 504 : 500).json({ error: err.name === 'AbortError' ? 'AI timeout (30s)' : err.message });
  }
});

router.get('/models', async (_req, res) => {
  try {
    const AGNES_KEY = process.env.AGNES_API_KEY || '';
    const resp = await fetch(`${process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1'}/models`, {
      headers: { 'Authorization': `Bearer ${AGNES_KEY}` },
    });
    if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to fetch models' });
    const data = await resp.json();
    res.json({ models: (data.data || []).map((m) => ({ id: m.id, owned_by: m.owned_by })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;