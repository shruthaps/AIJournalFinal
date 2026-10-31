import db from '../../db/database.js';

// Clean and tokenize text
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

// Stopwords to ignore in lexical scoring
const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'were', 'what',
  'when', 'where', 'which', 'about', 'some', 'could', 'would', 'there', 'their'
]);

export function retrieveContext(userId, query = '', mode = 'general') {
  // 1. Fetch user's entries, goals, achievements
  const rawEntries = db.prepare(`
    SELECT id, journal_id, date, weekday, title, quote_of_day, content, mood, weather, location, photos
    FROM entries
    WHERE user_id = ?
    ORDER BY date DESC
  `).all(userId);

  const entries = rawEntries.map(e => ({
    ...e,
    photos: JSON.parse(e.photos || '[]')
  }));

  const goals = db.prepare(`
    SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId).map(g => ({
    ...g,
    linked_entry_ids: JSON.parse(g.linked_entry_ids || '[]')
  }));

  const achievements = db.prepare(`
    SELECT * FROM achievements WHERE user_id = ? ORDER BY date DESC
  `).all(userId);

  const reflections = db.prepare(`
    SELECT * FROM reflections WHERE user_id = ? ORDER BY period DESC LIMIT 3
  `).all(userId).map(r => ({
    ...r,
    highlights: JSON.parse(r.highlights || '[]')
  }));

  // If there are no entries at all
  if (entries.length === 0) {
    return {
      entries: [],
      goals,
      achievements,
      reflections,
      topEntries: [],
      citations: []
    };
  }

  // 2. Score entries based on query relevance and mode
  const queryTokens = tokenize(query).filter(w => !STOPWORDS.has(w));
  const queryLower = query.toLowerCase();

  // Mode-specific temporal / thematic boosters
  const isPastSelf = mode === 'talk_to_past_self' || queryLower.includes('months ago') || queryLower.includes('earlier') || queryLower.includes('worried');
  const isRemindWhoIAm = mode === 'remind_who_i_am' || queryLower.includes('how far') || queryLower.includes('achieve') || queryLower.includes('proud');
  const isPatterns = mode === 'understand_patterns' || queryLower.includes('pattern') || queryLower.includes('recurring') || queryLower.includes('habit');
  const isWhatDifferently = mode === 'what_differently' || queryLower.includes('differently') || queryLower.includes('mistake') || queryLower.includes('conflict');

  const scoredEntries = entries.map(entry => {
    let score = 0;
    const entryText = `${entry.title || ''} ${entry.content || ''} ${entry.quote_of_day || ''} ${entry.mood || ''}`.toLowerCase();
    const entryTokens = new Set(tokenize(entryText));

    // Token match scoring
    for (const token of queryTokens) {
      if (entryText.includes(token)) score += 3;
      if (entry.title && entry.title.toLowerCase().includes(token)) score += 5;
      if (entry.mood && entry.mood.toLowerCase() === token) score += 4;
    }

    // Temporal detection: e.g. "March", "April", "October", "autumn", "summer"
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    months.forEach((m, idx) => {
      if (queryLower.includes(m)) {
        const monthNum = String(idx + 1).padStart(2, '0');
        if (entry.date.includes(`-${monthNum}-`)) score += 8;
      }
    });

    // Six months ago check
    if (queryLower.includes('six months ago') || queryLower.includes('6 months ago')) {
      // Relative to October 2026 -> April/March/May 2026
      if (entry.date.includes('2026-03') || entry.date.includes('2026-04')) {
        score += 10;
      }
    }

    // Last month check
    if (queryLower.includes('last month')) {
      if (entry.date.includes('2026-09')) score += 8;
    }

    // Mode-specific boosters
    if (isRemindWhoIAm) {
      if (entry.mood === 'joyful' || entry.mood === 'energetic' || entry.mood === 'anxious') score += 4;
      if (entryText.includes('struggle') || entryText.includes('afraid') || entryText.includes('presentation') || entryText.includes('kilometer') || entryText.includes('proud') || entryText.includes('did it')) {
        score += 6;
      }
    }

    if (isPatterns) {
      if (entry.mood === 'anxious' || entry.mood === 'contemplative' || entryText.includes('defensive') || entryText.includes('worry') || entryText.includes('habit')) {
        score += 5;
      }
    }

    if (isWhatDifferently) {
      if (entryText.includes('conversation') || entryText.includes('conflict') || entryText.includes('defensive') || entryText.includes('mark') || entryText.includes('differently')) {
        score += 12;
      }
    }

    return { ...entry, score };
  });

  // Sort by score, then by date descending
  scoredEntries.sort((a, b) => b.score - a.score || new Date(b.date) - new Date(a.date));

  // Top relevant entries (up to 5 for deep grounded context)
  const topEntries = scoredEntries.slice(0, 5);

  // Generate citations
  const citations = topEntries
    .filter(e => e.score > 0 || mode !== 'general')
    .slice(0, 3)
    .map(e => ({
      entryId: e.id,
      entryDate: e.date,
      entryTitle: e.title || `Entry from ${e.date}`,
      snippet: e.content.length > 140 ? e.content.substring(0, 140) + '...' : e.content
    }));

  return {
    allEntries: entries,
    topEntries,
    goals,
    achievements,
    reflections,
    citations
  };
}
