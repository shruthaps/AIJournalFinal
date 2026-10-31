import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// List all journals for user with entry count and recent preview
router.get('/', (req, res) => {
  try {
    const journals = db.prepare(`
      SELECT 
        j.*,
        COUNT(e.id) as entry_count,
        MAX(e.date) as latest_entry_date,
        (
          SELECT content FROM entries 
          WHERE journal_id = j.id 
          ORDER BY date DESC, created_at DESC 
          LIMIT 1
        ) as recent_preview
      FROM journals j
      LEFT JOIN entries e ON j.id = e.journal_id
      WHERE j.user_id = ?
      GROUP BY j.id
      ORDER BY j.is_favorite DESC, j.updated_at DESC
    `).all(req.user.id);

    return res.json(journals);
  } catch (err) {
    console.error('Fetch journals error:', err);
    return res.status(500).json({ error: 'Could not fetch journals.' });
  }
});

// Create a new journal
router.post('/', (req, res) => {
  try {
    const { title, description, cover_color, cover_texture, cover_icon } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Journal title is required.' });
    }

    const journalId = uuidv4();
    db.prepare(`
      INSERT INTO journals (id, user_id, title, description, cover_color, cover_texture, cover_icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      journalId,
      req.user.id,
      title.trim(),
      description?.trim() || '',
      cover_color || '#756558',
      cover_texture || 'linen',
      cover_icon || 'book'
    );

    const created = db.prepare('SELECT * FROM journals WHERE id = ?').get(journalId);
    return res.status(201).json({ ...created, entry_count: 0 });
  } catch (err) {
    console.error('Create journal error:', err);
    return res.status(500).json({ error: 'Could not create journal.' });
  }
});

// Get a specific journal
router.get('/:id', (req, res) => {
  try {
    const journal = db.prepare(`
      SELECT j.*, COUNT(e.id) as entry_count
      FROM journals j
      LEFT JOIN entries e ON j.id = e.journal_id
      WHERE j.id = ? AND j.user_id = ?
      GROUP BY j.id
    `).get(req.params.id, req.user.id);

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found.' });
    }

    return res.json(journal);
  } catch (err) {
    console.error('Get journal error:', err);
    return res.status(500).json({ error: 'Could not fetch journal.' });
  }
});

// Update journal
router.put('/:id', (req, res) => {
  try {
    const { title, description, cover_color, cover_texture, cover_icon, is_favorite } = req.body;
    const existing = db.prepare('SELECT id FROM journals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Journal not found.' });
    }

    db.prepare(`
      UPDATE journals SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        cover_color = COALESCE(?, cover_color),
        cover_texture = COALESCE(?, cover_texture),
        cover_icon = COALESCE(?, cover_icon),
        is_favorite = COALESCE(?, is_favorite),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      title ? title.trim() : null,
      description !== undefined ? description.trim() : null,
      cover_color || null,
      cover_texture || null,
      cover_icon || null,
      is_favorite !== undefined ? (is_favorite ? 1 : 0) : null,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM journals WHERE id = ?').get(req.params.id);
    return res.json(updated);
  } catch (err) {
    console.error('Update journal error:', err);
    return res.status(500).json({ error: 'Could not update journal.' });
  }
});

// Delete journal
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM journals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Journal not found.' });
    }

    // Safety: ensure user retains at least one journal
    const count = db.prepare('SELECT COUNT(*) as count FROM journals WHERE user_id = ?').get(req.user.id);
    if (count.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete your only journal.' });
    }

    db.prepare('DELETE FROM journals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    return res.json({ message: 'Journal deleted successfully.' });
  } catch (err) {
    console.error('Delete journal error:', err);
    return res.status(500).json({ error: 'Could not delete journal.' });
  }
});

export default router;
