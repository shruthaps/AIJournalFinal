import express from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Export complete data as JSON
router.get('/json', (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, preferences, created_at FROM users WHERE id = ?').get(req.user.id);
    const journals = db.prepare('SELECT * FROM journals WHERE user_id = ?').all(req.user.id);
    const entries = db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY date ASC').all(req.user.id).map(e => ({
      ...e,
      photos: JSON.parse(e.photos || '[]'),
      stickers: JSON.parse(e.stickers || '[]')
    }));
    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user.id).map(g => ({
      ...g,
      linked_entry_ids: JSON.parse(g.linked_entry_ids || '[]')
    }));
    const achievements = db.prepare('SELECT * FROM achievements WHERE user_id = ?').all(req.user.id);
    const reflections = db.prepare('SELECT * FROM reflections WHERE user_id = ?').all(req.user.id).map(r => ({
      ...r,
      highlights: JSON.parse(r.highlights || '[]')
    }));

    const exportData = {
      app: 'Dearly Journal',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: {
        ...user,
        preferences: JSON.parse(user?.preferences || '{}')
      },
      journals,
      entries,
      goals,
      achievements,
      reflections
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="dearly-backup-${new Date().toISOString().split('T')[0]}.json"`);
    return res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error('Export JSON error:', err);
    return res.status(500).json({ error: 'Export failed.' });
  }
});

// Export as readable Markdown text
router.get('/markdown', (req, res) => {
  try {
    const entries = db.prepare(`
      SELECT e.*, j.title as journal_name
      FROM entries e
      JOIN journals j ON e.journal_id = j.id
      WHERE e.user_id = ?
      ORDER BY e.date ASC
    `).all(req.user.id);

    let md = `# Dearly — Personal Digital Journal\n\n`;
    md += `*Exported on ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}*\n\n---\n\n`;

    entries.forEach(e => {
      md += `## ${e.date} · ${e.weekday}\n`;
      if (e.title) md += `### ${e.title}\n\n`;
      if (e.quote_of_day) md += `> *"${e.quote_of_day}"*\n\n`;
      md += `**Journal:** ${e.journal_name}  \n`;
      if (e.mood) md += `**Mood:** ${e.mood}  \n`;
      if (e.weather) md += `**Weather:** ${e.weather}  \n`;
      if (e.location) md += `**Location:** ${e.location}  \n`;
      md += `\n${e.content}\n\n`;

      const photos = JSON.parse(e.photos || '[]');
      if (photos.length > 0) {
        md += `**Photographs:**\n`;
        photos.forEach(p => {
          md += `- ![${p.caption || 'Photo'}](${p.url})\n  *${p.caption || ''}*\n`;
        });
        md += `\n`;
      }

      md += `---\n\n`;
    });

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="dearly-entries-${new Date().toISOString().split('T')[0]}.md"`);
    return res.send(md);
  } catch (err) {
    console.error('Export Markdown error:', err);
    return res.status(500).json({ error: 'Markdown export failed.' });
  }
});

export default router;
