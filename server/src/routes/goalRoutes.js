import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// --- GOALS ---

router.get('/', (req, res) => {
  try {
    const goals = db.prepare(`
      SELECT * FROM goals 
      WHERE user_id = ? 
      ORDER BY 
        CASE status 
          WHEN 'in_progress' THEN 1 
          WHEN 'not_started' THEN 2 
          WHEN 'achieved' THEN 3 
          ELSE 4 
        END, 
        created_at DESC
    `).all(req.user.id);

    const formatted = goals.map(g => ({
      ...g,
      linked_entry_ids: JSON.parse(g.linked_entry_ids || '[]')
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fetch goals error:', err);
    return res.status(500).json({ error: 'Could not fetch goals.' });
  }
});

router.post('/', (req, res) => {
  try {
    const { title, category, status, target_date, reflection_notes, linked_entry_ids } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Goal title is required.' });
    }

    const goalId = uuidv4();
    const achievedDate = status === 'achieved' ? new Date().toISOString().split('T')[0] : null;

    db.prepare(`
      INSERT INTO goals (id, user_id, title, category, status, target_date, achieved_date, reflection_notes, linked_entry_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      goalId,
      req.user.id,
      title.trim(),
      category || 'personal',
      status || 'in_progress',
      target_date || null,
      achievedDate,
      reflection_notes || null,
      JSON.stringify(linked_entry_ids || [])
    );

    const created = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId);
    return res.status(201).json({
      ...created,
      linked_entry_ids: JSON.parse(created.linked_entry_ids || '[]')
    });
  } catch (err) {
    console.error('Create goal error:', err);
    return res.status(500).json({ error: 'Could not create goal.' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    const { title, category, status, target_date, achieved_date, reflection_notes, linked_entry_ids } = req.body;

    let finalAchievedDate = existing.achieved_date;
    if (status === 'achieved' && existing.status !== 'achieved') {
      finalAchievedDate = achieved_date || new Date().toISOString().split('T')[0];

      // Automatically record an achievement milestone if not already present
      const achId = uuidv4();
      db.prepare(`
        INSERT INTO achievements (id, user_id, title, description, date, category)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        achId,
        req.user.id,
        title || existing.title,
        `Accomplished goal: ${title || existing.title}`,
        finalAchievedDate,
        category || existing.category
      );
    } else if (status && status !== 'achieved') {
      finalAchievedDate = null;
    }

    db.prepare(`
      UPDATE goals SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        status = COALESCE(?, status),
        target_date = COALESCE(?, target_date),
        achieved_date = ?,
        reflection_notes = COALESCE(?, reflection_notes),
        linked_entry_ids = COALESCE(?, linked_entry_ids),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      title ? title.trim() : null,
      category || null,
      status || null,
      target_date || null,
      finalAchievedDate,
      reflection_notes !== undefined ? reflection_notes : null,
      linked_entry_ids ? JSON.stringify(linked_entry_ids) : null,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
    return res.json({
      ...updated,
      linked_entry_ids: JSON.parse(updated.linked_entry_ids || '[]')
    });
  } catch (err) {
    console.error('Update goal error:', err);
    return res.status(500).json({ error: 'Could not update goal.' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    return res.json({ message: 'Goal removed.' });
  } catch (err) {
    console.error('Delete goal error:', err);
    return res.status(500).json({ error: 'Could not delete goal.' });
  }
});

// --- ACHIEVEMENTS ---

router.get('/achievements/all', (req, res) => {
  try {
    const list = db.prepare(`
      SELECT a.*, e.title as entry_title, e.date as entry_date
      FROM achievements a
      LEFT JOIN entries e ON a.linked_entry_id = e.id
      WHERE a.user_id = ?
      ORDER BY a.date DESC
    `).all(req.user.id);

    return res.json(list);
  } catch (err) {
    console.error('Fetch achievements error:', err);
    return res.status(500).json({ error: 'Could not fetch achievements.' });
  }
});

router.post('/achievements/create', (req, res) => {
  try {
    const { title, description, date, category, linked_entry_id } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Achievement title is required.' });
    }

    const achId = uuidv4();
    const achDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO achievements (id, user_id, title, description, date, category, linked_entry_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      achId,
      req.user.id,
      title.trim(),
      description?.trim() || '',
      achDate,
      category || 'personal',
      linked_entry_id || null
    );

    const created = db.prepare('SELECT * FROM achievements WHERE id = ?').get(achId);
    return res.status(201).json(created);
  } catch (err) {
    console.error('Create achievement error:', err);
    return res.status(500).json({ error: 'Could not record achievement.' });
  }
});

// --- REFLECTIONS ---

router.get('/reflections/all', (req, res) => {
  try {
    const list = db.prepare(`
      SELECT * FROM reflections
      WHERE user_id = ?
      ORDER BY period DESC
    `).all(req.user.id);

    const formatted = list.map(r => ({
      ...r,
      highlights: JSON.parse(r.highlights || '[]')
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fetch reflections error:', err);
    return res.status(500).json({ error: 'Could not fetch reflections.' });
  }
});

router.post('/reflections/save', (req, res) => {
  try {
    const { period, highlights, challenges, lessons_learned, gratitude, next_month_intentions } = req.body;
    if (!period) {
      return res.status(400).json({ error: 'Reflection period is required (e.g., 2026-10).' });
    }

    const existing = db.prepare('SELECT id FROM reflections WHERE user_id = ? AND period = ?').get(req.user.id, period);

    if (existing) {
      db.prepare(`
        UPDATE reflections SET
          highlights = ?,
          challenges = ?,
          lessons_learned = ?,
          gratitude = ?,
          next_month_intentions = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        JSON.stringify(highlights || []),
        challenges || '',
        lessons_learned || '',
        gratitude || '',
        next_month_intentions || '',
        existing.id
      );

      const updated = db.prepare('SELECT * FROM reflections WHERE id = ?').get(existing.id);
      return res.json({ ...updated, highlights: JSON.parse(updated.highlights || '[]') });
    } else {
      const refId = uuidv4();
      db.prepare(`
        INSERT INTO reflections (id, user_id, period, highlights, challenges, lessons_learned, gratitude, next_month_intentions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        refId,
        req.user.id,
        period,
        JSON.stringify(highlights || []),
        challenges || '',
        lessons_learned || '',
        gratitude || '',
        next_month_intentions || ''
      );

      const created = db.prepare('SELECT * FROM reflections WHERE id = ?').get(refId);
      return res.status(201).json({ ...created, highlights: JSON.parse(created.highlights || '[]') });
    }
  } catch (err) {
    console.error('Save reflection error:', err);
    return res.status(500).json({ error: 'Could not save reflection.' });
  }
});

export default router;
