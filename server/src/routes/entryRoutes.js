import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Helper to calculate weekday from date string (YYYY-MM-DD)
function getWeekday(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  }
  return 'DAY';
}

// Helper to count words
function calculateWordCount(text) {
  if (!text) return 0;
  const stripped = text.replace(/<[^>]*>/g, ' ').trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

// List entries with optional filters
router.get('/', (req, res) => {
  try {
    const { journalId, mood, hasPhotos, bookmarked, search, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM entries WHERE user_id = ?`;
    const params = [req.user.id];

    if (journalId) {
      query += ` AND journal_id = ?`;
      params.push(journalId);
    }
    if (mood) {
      query += ` AND mood = ?`;
      params.push(mood);
    }
    if (bookmarked === 'true') {
      query += ` AND is_bookmarked = 1`;
    }
    if (hasPhotos === 'true') {
      query += ` AND photos != '[]' AND photos IS NOT NULL`;
    }
    if (search) {
      query += ` AND (title LIKE ? OR content LIKE ? OR quote_of_day LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = db.prepare(query).all(...params);

    const formatted = rows.map(r => ({
      ...r,
      photos: JSON.parse(r.photos || '[]'),
      stickers: JSON.parse(r.stickers || '[]')
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fetch entries error:', err);
    return res.status(500).json({ error: 'Could not fetch entries.' });
  }
});

// Calendar entries mapping: Returns all dates with entries for the calendar
router.get('/calendar', (req, res) => {
  try {
    const { journalId } = req.query;
    let query = `
      SELECT id, journal_id, date, weekday, title, mood, 
             photos != '[]' AND photos IS NOT NULL as has_photos,
             is_bookmarked
      FROM entries
      WHERE user_id = ?
    `;
    const params = [req.user.id];

    if (journalId) {
      query += ` AND journal_id = ?`;
      params.push(journalId);
    }

    query += ` ORDER BY date ASC`;

    const rows = db.prepare(query).all(...params);
    return res.json(rows);
  } catch (err) {
    console.error('Calendar error:', err);
    return res.status(500).json({ error: 'Could not fetch calendar entries.' });
  }
});

// Get a single entry
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!row) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    // Get previous and next entry IDs in the same journal (or across user journals)
    const prev = db.prepare(`
      SELECT id, date, title FROM entries 
      WHERE user_id = ? AND journal_id = ? AND date < ? 
      ORDER BY date DESC, created_at DESC LIMIT 1
    `).get(req.user.id, row.journal_id, row.date);

    const next = db.prepare(`
      SELECT id, date, title FROM entries 
      WHERE user_id = ? AND journal_id = ? AND date > ? 
      ORDER BY date ASC, created_at ASC LIMIT 1
    `).get(req.user.id, row.journal_id, row.date);

    return res.json({
      ...row,
      photos: JSON.parse(row.photos || '[]'),
      stickers: JSON.parse(row.stickers || '[]'),
      navigation: {
        prev: prev || null,
        next: next || null
      }
    });
  } catch (err) {
    console.error('Get entry error:', err);
    return res.status(500).json({ error: 'Could not fetch entry.' });
  }
});

// Create entry
router.post('/', (req, res) => {
  try {
    const {
      journal_id,
      date,
      title,
      quote_of_day,
      content,
      mood,
      weather,
      location,
      paper_theme,
      font_style,
      font_size,
      ruled_lines,
      photos,
      stickers
    } = req.body;

    if (!journal_id) {
      return res.status(400).json({ error: 'Journal ID is required.' });
    }

    // Verify journal belongs to user
    const journal = db.prepare('SELECT id FROM journals WHERE id = ? AND user_id = ?').get(journal_id, req.user.id);
    if (!journal) {
      return res.status(404).json({ error: 'Journal not found.' });
    }

    const entryId = uuidv4();
    const entryDate = date || new Date().toISOString().split('T')[0];
    const weekday = getWeekday(entryDate);
    const bodyContent = content || '';
    const wordCount = calculateWordCount(bodyContent);
    const readingTime = Math.max(1, Math.ceil(wordCount / 180));

    db.prepare(`
      INSERT INTO entries (
        id, journal_id, user_id, date, weekday, title, quote_of_day, content,
        mood, weather, location, paper_theme, font_style, font_size, ruled_lines,
        photos, stickers, word_count, reading_time_min
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `).run(
      entryId,
      journal_id,
      req.user.id,
      entryDate,
      weekday,
      title?.trim() || null,
      quote_of_day?.trim() || null,
      bodyContent,
      mood || 'peaceful',
      weather?.trim() || null,
      location?.trim() || null,
      paper_theme || 'cream',
      font_style || 'caveat',
      font_size || 'text-lg',
      ruled_lines !== undefined ? (ruled_lines ? 1 : 0) : 1,
      JSON.stringify(photos || []),
      JSON.stringify(stickers || []),
      wordCount,
      readingTime
    );

    // Update journal updated_at
    db.prepare('UPDATE journals SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(journal_id);

    const created = db.prepare('SELECT * FROM entries WHERE id = ?').get(entryId);
    return res.status(201).json({
      ...created,
      photos: JSON.parse(created.photos || '[]'),
      stickers: JSON.parse(created.stickers || '[]')
    });
  } catch (err) {
    console.error('Create entry error:', err);
    return res.status(500).json({ error: 'Could not create entry.' });
  }
});

// Update entry (debounced auto-save or manual save)
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    const {
      date,
      title,
      quote_of_day,
      content,
      mood,
      weather,
      location,
      paper_theme,
      font_style,
      font_size,
      ruled_lines,
      photos,
      stickers,
      is_bookmarked
    } = req.body;

    const entryDate = date || existing.date;
    const weekday = getWeekday(entryDate);
    const bodyContent = content !== undefined ? content : existing.content;
    const wordCount = calculateWordCount(bodyContent);
    const readingTime = Math.max(1, Math.ceil(wordCount / 180));

    db.prepare(`
      UPDATE entries SET
        date = ?,
        weekday = ?,
        title = ?,
        quote_of_day = ?,
        content = ?,
        mood = ?,
        weather = ?,
        location = ?,
        paper_theme = ?,
        font_style = ?,
        font_size = ?,
        ruled_lines = ?,
        photos = ?,
        stickers = ?,
        word_count = ?,
        reading_time_min = ?,
        is_bookmarked = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      entryDate,
      weekday,
      title !== undefined ? (title ? title.trim() : null) : existing.title,
      quote_of_day !== undefined ? (quote_of_day ? quote_of_day.trim() : null) : existing.quote_of_day,
      bodyContent,
      mood !== undefined ? mood : existing.mood,
      weather !== undefined ? (weather ? weather.trim() : null) : existing.weather,
      location !== undefined ? (location ? location.trim() : null) : existing.location,
      paper_theme || existing.paper_theme,
      font_style || existing.font_style,
      font_size || existing.font_size,
      ruled_lines !== undefined ? (ruled_lines ? 1 : 0) : existing.ruled_lines,
      photos !== undefined ? JSON.stringify(photos) : existing.photos,
      stickers !== undefined ? JSON.stringify(stickers) : existing.stickers,
      wordCount,
      readingTime,
      is_bookmarked !== undefined ? (is_bookmarked ? 1 : 0) : existing.is_bookmarked,
      req.params.id,
      req.user.id
    );

    // Update parent journal's updated_at
    db.prepare('UPDATE journals SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(existing.journal_id);

    const updated = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
    return res.json({
      ...updated,
      photos: JSON.parse(updated.photos || '[]'),
      stickers: JSON.parse(updated.stickers || '[]')
    });
  } catch (err) {
    console.error('Update entry error:', err);
    return res.status(500).json({ error: 'Could not update entry.' });
  }
});

// Delete entry
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id, journal_id FROM entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    db.prepare('DELETE FROM entries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    db.prepare('UPDATE journals SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(existing.journal_id);

    return res.json({ message: 'Entry deleted successfully.' });
  } catch (err) {
    console.error('Delete entry error:', err);
    return res.status(500).json({ error: 'Could not delete entry.' });
  }
});

// Toggle bookmark
router.post('/:id/bookmark', (req, res) => {
  try {
    const existing = db.prepare('SELECT is_bookmarked FROM entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    const nextState = existing.is_bookmarked ? 0 : 1;
    db.prepare('UPDATE entries SET is_bookmarked = ? WHERE id = ?').run(nextState, req.params.id);

    return res.json({ is_bookmarked: nextState });
  } catch (err) {
    console.error('Bookmark error:', err);
    return res.status(500).json({ error: 'Could not toggle bookmark.' });
  }
});

export default router;
