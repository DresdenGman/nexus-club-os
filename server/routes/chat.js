import express from 'express';
const router = express.Router();

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { prompt, context, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const AGNES_KEY = process.env.AGNES_API_KEY || '';
    const AGNES_BASE = process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1';
    const useModel = model || 'agnes-1.5-flash';

    const messages = [];
    if (context) {
      messages.push({ role: 'system', content: context });
    }
    messages.push({ role: 'user', content: prompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${AGNES_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AGNES_KEY}`,
      },
      body: JSON.stringify({
        model: useModel,
        messages,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Agnes error ${response.status}:`, errText.slice(0, 300));
      return res.status(response.status).json({
        error: 'Agnes API error',
        detail: errText.slice(0, 500),
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    res.json({ reply, model: useModel });
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'AI request timed out (15s)' : err.message;
    res.status(err.name === 'AbortError' ? 504 : 500).json({ error: msg });
  }
});

// GET /api/chat/models
router.get('/models', async (_req, res) => {
  try {
    const AGNES_KEY = process.env.AGNES_API_KEY || '';
    const AGNES_BASE = process.env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1';

    const response = await fetch(`${AGNES_BASE}/models`, {
      headers: { 'Authorization': `Bearer ${AGNES_KEY}` },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch models' });
    }

    const data = await response.json();
    const models = (data.data || []).map((m) => ({ id: m.id, owned_by: m.owned_by }));
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
