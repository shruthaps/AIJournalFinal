import express from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Advanced unified search endpoint
router.get('/', (req, res) => {
  try {
    const { q = '', journalId, mood, hasPhotos, startDate, endDate } = req.query;
    const queryTerm = q.trim();

    let entrySql = `
      SELECT 
        e.id, e.journal_id, e.date, e.weekday, e.title, e.quote_of_day, e.content, 
        e.mood, e.weather, e.location, e.photos, e.is_bookmarked,
        j.title as journal_title, j.cover_color
      FROM entries e
      JOIN journals j ON e.journal_id = j.id
      WHERE e.user_id = ?
    `;
    const params = [req.user.id];

    if (queryTerm) {
      entrySql += ` AND (e.title LIKE ? OR e.content LIKE ? OR e.quote_of_day LIKE ? OR e.location LIKE ?)`;
      const wildcard = `%${queryTerm}%`;
      params.push(wildcard, wildcard, wildcard, wildcard);
    }

    if (journalId) {
      entrySql += ` AND e.journal_id = ?`;
      params.push(journalId);
    }

    if (mood) {
      entrySql += ` AND e.mood = ?`;
      params.push(mood);
    }

    if (hasPhotos === 'true') {
      entrySql += ` AND e.photos != '[]' AND e.photos IS NOT NULL`;
    }

    if (startDate) {
      entrySql += ` AND e.date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      entrySql += ` AND e.date <= ?`;
      params.push(endDate);
    }

    entrySql += ` ORDER BY e.date DESC LIMIT 50`;

    const rawEntries = db.prepare(entrySql).all(...params);

    const entries = rawEntries.map(e => ({
      ...e,
      photos: JSON.parse(e.photos || '[]')
    }));

    // If query term present, also search goals and achievements
    let matchingGoals = [];
    let matchingAchievements = [];

    if (queryTerm) {
      matchingGoals = db.prepare(`
        SELECT * FROM goals 
        WHERE user_id = ? AND (title LIKE ? OR reflection_notes LIKE ?)
        LIMIT 10
      `).all(req.user.id, `%${queryTerm}%`, `%${queryTerm}%`).map(g => ({
        ...g,
        linked_entry_ids: JSON.parse(g.linked_entry_ids || '[]')
      }));

      matchingAchievements = db.prepare(`
        SELECT * FROM achievements 
        WHERE user_id = ? AND (title LIKE ? OR description LIKE ?)
        LIMIT 10
      `).all(req.user.id, `%${queryTerm}%`, `%${queryTerm}%`);
    }

    return res.json({
      query: queryTerm,
      totalEntries: entries.length,
      entries,
      goals: matchingGoals,
      achievements: matchingAchievements
    });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Search failed.' });
  }
});

export default router;
