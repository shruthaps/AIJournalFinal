import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'dearly.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      preferences TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cover_color TEXT DEFAULT '#756558',
      cover_texture TEXT DEFAULT 'linen',
      cover_icon TEXT DEFAULT 'book',
      is_favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      journal_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      weekday TEXT NOT NULL,
      title TEXT,
      quote_of_day TEXT,
      content TEXT NOT NULL,
      mood TEXT,
      weather TEXT,
      location TEXT,
      paper_theme TEXT DEFAULT 'cream',
      font_style TEXT DEFAULT 'caveat',
      font_size TEXT DEFAULT 'text-lg',
      ruled_lines INTEGER DEFAULT 1,
      photos TEXT DEFAULT '[]',
      stickers TEXT DEFAULT '[]',
      word_count INTEGER DEFAULT 0,
      reading_time_min INTEGER DEFAULT 1,
      is_bookmarked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'personal',
      status TEXT DEFAULT 'in_progress',
      target_date TEXT,
      achieved_date TEXT,
      reflection_notes TEXT,
      linked_entry_ids TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      category TEXT DEFAULT 'personal',
      linked_entry_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reflections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      period TEXT NOT NULL,
      highlights TEXT,
      challenges TEXT,
      lessons_learned TEXT,
      gratitude TEXT,
      next_month_intentions TEXT,
      is_generated INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      feature_mode TEXT DEFAULT 'general',
      user_message TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      citations TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_entries_journal ON entries(journal_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
  `);

  seedDemoUserIfNeeded();
}

function seedDemoUserIfNeeded() {
  const demoEmail = 'clara@dearly.app';
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail);

  if (existingUser) {
    return; // Already seeded
  }

  const userId = 'demo-user-clara';
  const hashedPassword = bcrypt.hashSync('dearly2026', 10);

  const preferences = JSON.stringify({
    preferredFont: 'caveat',
    preferredTheme: 'cream',
    ruledLines: true,
    aiCompanionName: 'Dearly AI',
    notifications: true
  });

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, preferences, created_at)
    VALUES (?, ?, ?, ?, ?, '2026-01-01 08:00:00')
  `).run(userId, 'Clara Montgomery', demoEmail, hashedPassword, preferences);

  // Seed Primary Journal
  const journalId = 'journal-daily-chronicles';
  db.prepare(`
    INSERT INTO journals (id, user_id, title, description, cover_color, cover_texture, cover_icon, is_favorite, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, '2026-01-01 08:00:00', '2026-10-30 21:00:00')
  `).run(
    journalId,
    userId,
    'My Daily Chronicles',
    'A quiet haven for morning reflections, fleeting moments, and quiet dreams.',
    '#756558',
    'linen',
    'feather'
  );

  // Seed Creative Journal
  const journal2Id = 'journal-creative-spark';
  db.prepare(`
    INSERT INTO journals (id, user_id, title, description, cover_color, cover_texture, cover_icon, is_favorite, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, '2026-03-15 10:00:00', '2026-10-25 18:00:00')
  `).run(
    journal2Id,
    userId,
    'Creative Sparks & Stories',
    'Essays, prose sketches, book thoughts, and visual scrapbooks.',
    '#8A9A86',
    'paper',
    'botanical'
  );

  // Seed Rich Journal Entries demonstrating realistic diary, scrapbooking, struggles, achievements
  const entries = [
    {
      id: 'entry-2026-03-12',
      journal_id: journalId,
      user_id: userId,
      date: '2026-03-12',
      weekday: 'THURSDAY',
      title: 'A Knot in My Stomach Before the Presentation',
      quote_of_day: 'Courage is being scared to death, but saddling up anyway.',
      mood: 'anxious',
      weather: 'Overcast & Chilly',
      location: 'Quiet kitchen nook',
      paper_theme: 'cream',
      font_style: 'caveat',
      font_size: 'text-lg',
      ruled_lines: 1,
      photos: JSON.stringify([
        {
          id: 'photo-1',
          url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80',
          caption: 'Morning tea with too much honey, trying to steady my hands.',
          rotation: -2,
          frameStyle: 'polaroid'
        }
      ]),
      stickers: JSON.stringify([
        { id: 'stk-1', type: 'tape', variant: 'craft', x: 20, y: 15, rotation: -3, scale: 1 },
        { id: 'stk-2', type: 'coffee-stain', x: 80, y: 85, rotation: 12, scale: 0.9 }
      ]),
      content: `I could barely sleep past 5 AM. Tomorrow is the design architecture review for our whole department.

I keep re-reading my slides, doubting every design decision. What if Julian challenges the modular pipeline? What if I freeze during the live architecture walkthrough?

I talked to Maya on the phone for ten minutes. She reminded me: "You designed this system from the ground up over four months. No one in that room understands the edge cases better than you."

I need to breathe. Tonight I am closing my laptop by 9 PM. If I make a mistake, it will not be the end of the world. Just one step at a time.`,
      word_count: 112,
      created_at: '2026-03-12 07:15:00'
    },
    {
      id: 'entry-2026-04-18',
      journal_id: journalId,
      user_id: userId,
      date: '2026-04-18',
      weekday: 'SATURDAY',
      title: 'The Room Fell Silent, Then They Applauded',
      quote_of_day: 'The best view comes after the hardest climb.',
      mood: 'joyful',
      weather: 'Golden Spring Sunshine',
      location: 'Botanical Garden Café',
      paper_theme: 'cream',
      font_style: 'caveat',
      font_size: 'text-lg',
      ruled_lines: 1,
      photos: JSON.stringify([
        {
          id: 'photo-2',
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
          caption: 'Sunlight filtering through the conservatory palms. A deep exhale.',
          rotation: 3,
          frameStyle: 'tape'
        }
      ]),
      stickers: JSON.stringify([
        { id: 'stk-3', type: 'botanical', x: 85, y: 15, rotation: 8, scale: 1.1 },
        { id: 'stk-4', type: 'star', x: 15, y: 88, rotation: 5, scale: 1 }
      ]),
      content: `I did it! The presentation that kept me up in March went better than I ever dared to imagine.

Not only did Julian agree with our modular architecture, but the director asked if I would lead the Q3 cross-platform migration.

Looking back at how terrified I was a month ago feels so surreal. The anxiety was so loud, but the reality was just a group of curious engineers wanting to solve a problem together.

Celebrated today with an oat latte and fresh lemon tart in the glass greenhouse. I am capable of far more than my self-doubt tries to convince me of.`,
      word_count: 104,
      created_at: '2026-04-18 15:30:00'
    },
    {
      id: 'entry-2026-06-19',
      journal_id: journalId,
      user_id: userId,
      date: '2026-06-19',
      weekday: 'FRIDAY',
      title: 'Summer Solstice & Finding My Rhythm',
      quote_of_day: 'Enjoy the day.',
      mood: 'peaceful',
      weather: 'Warm Breeze, 24°C',
      location: 'Balcony under string lights',
      paper_theme: 'cream',
      font_style: 'caveat',
      font_size: 'text-lg',
      ruled_lines: 1,
      photos: JSON.stringify([
        {
          id: 'photo-3',
          url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=600&q=80',
          caption: 'Summer blooms and my well-worn journal.',
          rotation: -1,
          frameStyle: 'polaroid'
        }
      ]),
      stickers: JSON.stringify([
        { id: 'stk-5', type: 'tape', variant: 'rose', x: 30, y: 10, rotation: 2, scale: 1 },
        { id: 'stk-6', type: 'heart', x: 75, y: 82, rotation: -4, scale: 0.9 }
      ]),
      content: `Today felt gentle. The air had that sweet jasmine scent that only arrives in late June.

I finished my work sprint by 4 PM, closed my screen, and sat out on the balcony with iced hibiscus tea.

I realized today that I haven't skipped my morning 20-minute meditation for four consecutive weeks now. It used to feel like a chore; now it feels like putting on dry clothes after being caught in a sudden downpour.

There is a quiet dignity in showing up for yourself in small, unglamorous ways. No grand proclamations, just tea, sunlight, and presence.`,
      word_count: 98,
      created_at: '2026-06-19 19:45:00'
    },
    {
      id: 'entry-2026-09-08',
      journal_id: journalId,
      user_id: userId,
      date: '2026-09-08',
      weekday: 'TUESDAY',
      title: 'A Difficult Conversation with Mark',
      quote_of_day: 'Truth without compassion is cruelty. Compassion without truth is avoidance.',
      mood: 'contemplative',
      weather: 'Soft Autumn Drizzle',
      location: 'Desk by the rain-streaked window',
      paper_theme: 'parchment',
      font_style: 'caveat',
      font_size: 'text-lg',
      ruled_lines: 1,
      photos: JSON.stringify([]),
      stickers: JSON.stringify([
        { id: 'stk-7', type: 'paperclip', x: 88, y: 12, rotation: 15, scale: 1 }
      ]),
      content: `Mark and I had a tense conversation over lunch about our shared project responsibilities.

I found myself getting defensive when he asked why the user feedback synthesis wasn't completed yet. In the moment, I felt like he was dismissing how much unblocking work I had done for the frontend team.

Looking back tonight after taking a walk in the drizzle:
1. Fact: The feedback synthesis was indeed two days behind schedule.
2. Fact: Mark asked politely, but my fatigue made it sound like an interrogation.
3. Assumption: I assumed he was judging my commitment.

What could I have done differently?
Instead of immediately defending my hours, I could have said: "You're right, it is delayed. Let me share what blocked me this week and when you can realistically expect it."

I will send him a brief note tomorrow morning acknowledging that. Grace starts with owning your part.`,
      word_count: 147,
      created_at: '2026-09-08 21:10:00'
    },
    {
      id: 'entry-2026-10-15',
      journal_id: journalId,
      user_id: userId,
      date: '2026-10-15',
      weekday: 'THURSDAY',
      title: 'Running 10 Kilometers Without Stopping',
      quote_of_day: 'Every strike brings me closer to the next home run.',
      mood: 'energetic',
      weather: 'Crisp Morning, 14°C',
      location: 'Lakeside trail bench',
      paper_theme: 'cream',
      font_style: 'caveat',
      font_size: 'text-lg',
      ruled_lines: 1,
      photos: JSON.stringify([
        {
          id: 'photo-4',
          url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
          caption: 'Morning mist over the lake at 7:30 AM.',
          rotation: 2,
          frameStyle: 'polaroid'
        }
      ]),
      stickers: JSON.stringify([
        { id: 'stk-8', type: 'star', x: 12, y: 20, rotation: -10, scale: 1.2 },
        { id: 'stk-9', type: 'tape', variant: 'butter', x: 70, y: 8, rotation: 1, scale: 0.95 }
      ]),
      content: `10.2 kilometers. 56 minutes. Zero walking breaks.

In January, when I couldn't run three blocks without gasping for breath, I thought 10k was reserved for natural athletes.

At kilometer 7, when my calves were burning and my mind tried to bargain for an early stop at the boathouse, I remembered what I wrote in this very journal back in February: "Discomfort is just a sensation, not an emergency."

Crossing the wooden footbridge at the end with the morning mist rising off the lake was pure magic. My body is strong and my spirit is steady.`,
      word_count: 98,
      created_at: '2026-10-15 08:45:00'
    },
    {
      id: 'entry-2026-10-30',
      journal_id: journalId,
      user_id: userId,
      date: '2026-10-30',
      weekday: 'FRIDAY',
      title: 'October Harvest & Looking Toward the Year-End',
      quote_of_day: 'Gratitude turns what we have into enough.',
      mood: 'grateful',
      weather: 'Crisp Autumn Twilight',
      location: 'Warm armchair by the fire',
      paper_theme: 'cream',
      font_style: 'caveat',
      font_size: 'text-lg',
      ruled_lines: 1,
      photos: JSON.stringify([
        {
          id: 'photo-5',
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
          caption: 'A quiet pause before the year winds down.',
          rotation: -2,
          frameStyle: 'tape'
        }
      ]),
      stickers: JSON.stringify([
        { id: 'stk-10', type: 'botanical', x: 25, y: 85, rotation: 12, scale: 1 },
        { id: 'stk-11', type: 'tape', variant: 'sage', x: 65, y: 12, rotation: -2, scale: 1 }
      ]),
      content: `October is slipping into November. The maple tree outside my study window has shed almost all its crimson leaves.

This month was full of quiet milestones:
- Completed the 10k run goal.
- Kept our team migration on schedule without late-night panics.
- Maintained honest communication with Mark, which deepened our trust.

I am feeling an overwhelming sense of gratitude for this journal. Being able to flip back through pages from March, April, and June and see the evolution of my thoughts is like talking to an old, patient friend who never judged me.

Tomorrow is Halloween. Pumpkin soup, thick knit socks, and listening to the autumn wind.`,
      word_count: 110,
      created_at: '2026-10-30 20:15:00'
    }
  ];

  const insertEntry = db.prepare(`
    INSERT INTO entries (
      id, journal_id, user_id, date, weekday, title, quote_of_day, content,
      mood, weather, location, paper_theme, font_style, font_size, ruled_lines,
      photos, stickers, word_count, created_at, updated_at
    ) VALUES (
      @id, @journal_id, @user_id, @date, @weekday, @title, @quote_of_day, @content,
      @mood, @weather, @location, @paper_theme, @font_style, @font_size, @ruled_lines,
      @photos, @stickers, @word_count, @created_at, @created_at
    )
  `);

  entries.forEach(entry => insertEntry.run(entry));

  // Seed Goals
  const goals = [
    {
      id: 'goal-run-10k',
      user_id: userId,
      title: 'Run a 10K race comfortably without stopping',
      category: 'health',
      status: 'achieved',
      target_date: '2026-10-31',
      achieved_date: '2026-10-15',
      reflection_notes: 'Achieved on Oct 15 at 56 minutes! Proved to myself that persistence compounds.',
      linked_entry_ids: JSON.stringify(['entry-2026-10-15'])
    },
    {
      id: 'goal-lead-migration',
      user_id: userId,
      title: 'Lead the department architecture migration',
      category: 'career',
      status: 'in_progress',
      target_date: '2026-12-15',
      achieved_date: null,
      reflection_notes: 'Presentation succeeded in April. Q3 phase completed, finishing up Q4 rollout.',
      linked_entry_ids: JSON.stringify(['entry-2026-03-12', 'entry-2026-04-18', 'entry-2026-10-30'])
    },
    {
      id: 'goal-daily-meditation',
      user_id: userId,
      title: 'Establish a morning 20-minute mindfulness practice',
      category: 'mindfulness',
      status: 'achieved',
      target_date: '2026-07-01',
      achieved_date: '2026-06-19',
      reflection_notes: 'Formed a consistent habit by June solstice.',
      linked_entry_ids: JSON.stringify(['entry-2026-06-19'])
    },
    {
      id: 'goal-publish-essay',
      user_id: userId,
      title: 'Write and publish personal essay collection',
      category: 'creative',
      status: 'in_progress',
      target_date: '2027-02-01',
      achieved_date: null,
      reflection_notes: 'Drafting stories in the Creative Sparks journal.',
      linked_entry_ids: JSON.stringify([])
    }
  ];

  const insertGoal = db.prepare(`
    INSERT INTO goals (id, user_id, title, category, status, target_date, achieved_date, reflection_notes, linked_entry_ids)
    VALUES (@id, @user_id, @title, @category, @status, @target_date, @achieved_date, @reflection_notes, @linked_entry_ids)
  `);

  goals.forEach(goal => insertGoal.run(goal));

  // Seed Achievements
  const achievements = [
    {
      id: 'ach-pres-success',
      user_id: userId,
      title: 'Delivered High-Stakes Architecture Presentation',
      description: 'Overcame severe presentation anxiety; awarded cross-platform migration lead.',
      date: '2026-04-18',
      category: 'career',
      linked_entry_id: 'entry-2026-04-18'
    },
    {
      id: 'ach-10k-finish',
      user_id: userId,
      title: 'Completed 10K Continuous Run in 56 Minutes',
      description: 'Ran 10.2km along the lakeside trail without walking breaks.',
      date: '2026-10-15',
      category: 'health',
      linked_entry_id: 'entry-2026-10-15'
    },
    {
      id: 'ach-communication-breakthrough',
      user_id: userId,
      title: 'Constructive Conflict Resolution with Mark',
      description: 'Replaced defensiveness with active listening and transparent accountability.',
      date: '2026-09-08',
      category: 'relationships',
      linked_entry_id: 'entry-2026-09-08'
    }
  ];

  const insertAchievement = db.prepare(`
    INSERT INTO achievements (id, user_id, title, description, date, category, linked_entry_id)
    VALUES (@id, @user_id, @title, @description, @date, @category, @linked_entry_id)
  `);

  achievements.forEach(ach => insertAchievement.run(ach));

  // Seed October Reflection
  db.prepare(`
    INSERT INTO reflections (id, user_id, period, highlights, challenges, lessons_learned, gratitude, next_month_intentions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'reflection-2026-10',
    userId,
    '2026-10',
    JSON.stringify([
      'Finished 10k run comfortably in 56 minutes',
      'Architecture rollout on track with cross-functional praise',
      'Consistent evening journal ritual'
    ]),
    'Balancing energy as daylight hours shorten; avoiding fatigue-induced irritability.',
    'Discomfort is a sensation, not an emergency. Acknowledging delays proactively prevents friction.',
    'Crisp autumn walks, supportive teammates, quiet morning tea.',
    'Prepare migration wrap-up; begin outline for essay collection; prioritize restorative sleep.'
  );

  console.log('Seeded demo user Clara Montgomery with rich journal history, goals, and reflections.');
}

export default db;
