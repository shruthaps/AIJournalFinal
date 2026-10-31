import express from 'express';
import { aiService } from '../services/ai/aiService.js';
import { authMiddleware } from '../middleware/auth.js';
import db from '../db/database.js';

const router = express.Router();
router.use(authMiddleware);

// Check AI configuration status
router.get('/status', (req, res) => {
  try {
    const status = aiService.getAIStatus(req.user.id);
    return res.json(status);
  } catch (err) {
    console.error('AI status error:', err);
    return res.status(500).json({ error: 'Could not determine AI status.' });
  }
});

// Send message to AI Companion
router.post('/chat', async (req, res) => {
  try {
    const { message, mode = 'general' } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const response = await aiService.processUserMessage(req.user.id, message.trim(), mode, req.user.name);
    return res.json(response);
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'Could not generate companion response.' });
  }
});

// Feature A: Remind Me Who I Am
router.post('/remind-me', async (req, res) => {
  try {
    const prompt = 'Remind me how far I have come, what I have achieved, and what challenges I overcame.';
    const response = await aiService.processUserMessage(req.user.id, prompt, 'remind_who_i_am', req.user.name);
    return res.json(response);
  } catch (err) {
    console.error('AI remind-me error:', err);
    return res.status(500).json({ error: 'Failed to generate reminder.' });
  }
});

// Feature B: Understand My Patterns
router.post('/patterns', async (req, res) => {
  try {
    const prompt = 'Help me understand recurring patterns, themes, or hesitations in my journal.';
    const response = await aiService.processUserMessage(req.user.id, prompt, 'understand_patterns', req.user.name);
    return res.json(response);
  } catch (err) {
    console.error('AI patterns error:', err);
    return res.status(500).json({ error: 'Failed to analyze patterns.' });
  }
});

// Feature C: What Could I Have Done Differently?
router.post('/what-differently', async (req, res) => {
  try {
    const { situation } = req.body;
    const prompt = situation || 'Help me reflect on a difficult conversation or conflict and consider alternative perspectives.';
    const response = await aiService.processUserMessage(req.user.id, prompt, 'what_differently', req.user.name);
    return res.json(response);
  } catch (err) {
    console.error('AI what-differently error:', err);
    return res.status(500).json({ error: 'Failed to generate reflection.' });
  }
});

// Feature D: Talk to My Past Self
router.post('/past-self', async (req, res) => {
  try {
    const { timeframe = 'six months ago' } = req.body;
    const prompt = `What was I worried about or experiencing ${timeframe}?`;
    const response = await aiService.processUserMessage(req.user.id, prompt, 'talk_to_past_self', req.user.name);
    return res.json(response);
  } catch (err) {
    console.error('AI past-self error:', err);
    return res.status(500).json({ error: 'Failed to retrieve past self reflection.' });
  }
});

// Feature E: Monthly Reflections
router.post('/monthly-reflection', async (req, res) => {
  try {
    const prompt = 'Generate a structured monthly reflection report from my recent journal entries.';
    const response = await aiService.processUserMessage(req.user.id, prompt, 'monthly_reflection', req.user.name);
    return res.json(response);
  } catch (err) {
    console.error('AI monthly-reflection error:', err);
    return res.status(500).json({ error: 'Failed to generate monthly reflection.' });
  }
});

// Feature F: Daily Prompts
router.get('/prompts', async (req, res) => {
  try {
    const prompt = 'Give me a thoughtful, introspective journaling prompt for today.';
    const response = await aiService.processUserMessage(req.user.id, prompt, 'daily_prompt', req.user.name);
    return res.json(response);
  } catch (err) {
    console.error('AI prompts error:', err);
    return res.status(500).json({ error: 'Failed to fetch prompt.' });
  }
});

// Conversation History
router.get('/history', (req, res) => {
  try {
    const history = db.prepare(`
      SELECT * FROM ai_conversations
      WHERE user_id = ?
      ORDER BY created_at ASC
      LIMIT 50
    `).all(req.user.id);

    const formatted = history.map(h => ({
      ...h,
      citations: JSON.parse(h.citations || '[]')
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fetch history error:', err);
    return res.status(500).json({ error: 'Could not fetch history.' });
  }
});

export default router;
