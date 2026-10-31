import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', (req, res) => {
  try {
    const { name, email, password, diaryName, preferredTheme, preferredFont } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const preferences = JSON.stringify({
      preferredFont: preferredFont || 'caveat',
      preferredTheme: preferredTheme || 'cream',
      ruledLines: true,
      aiCompanionName: 'Dearly AI',
      notifications: true
    });

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, preferences)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, name.trim(), email.toLowerCase().trim(), passwordHash, preferences);

    // Create user's initial journal
    const journalId = uuidv4();
    db.prepare(`
      INSERT INTO journals (id, user_id, title, description, cover_color, cover_texture, cover_icon, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      journalId,
      userId,
      diaryName?.trim() || `${name.trim()}'s Journal`,
      'A quiet, private haven for thoughts and memories.',
      '#756558',
      'linen',
      'book'
    );

    const user = { id: userId, name: name.trim(), email: email.toLowerCase().trim(), preferences: JSON.parse(preferences) };
    const token = signToken(user);

    return res.status(201).json({
      message: 'Welcome to Dearly.',
      token,
      user,
      initialJournalId: journalId
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login user
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      preferences: JSON.parse(user.preferences || '{}'),
      createdAt: user.created_at
    };

    const token = signToken(userPayload);
    return res.json({ token, user: userPayload });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Demo account instant login
router.post('/demo', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('clara@dearly.app');
    if (!user) {
      return res.status(500).json({ error: 'Demo user not found.' });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      preferences: JSON.parse(user.preferences || '{}'),
      createdAt: user.created_at
    };

    const token = signToken(userPayload);
    return res.json({
      token,
      user: userPayload,
      message: 'Logged in as Clara Montgomery (Demo Account).'
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ error: 'Demo login failed.' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, preferences, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      ...user,
      preferences: JSON.parse(user.preferences || '{}')
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Could not fetch profile.' });
  }
});

// Update user preferences
router.put('/preferences', authMiddleware, (req, res) => {
  try {
    const { preferredFont, preferredTheme, ruledLines, aiCompanionName, notifications, aiConfig } = req.body;
    const current = db.prepare('SELECT preferences FROM users WHERE id = ?').get(req.user.id);
    const existingPrefs = JSON.parse(current?.preferences || '{}');

    const updated = {
      ...existingPrefs,
      ...(preferredFont !== undefined && { preferredFont }),
      ...(preferredTheme !== undefined && { preferredTheme }),
      ...(ruledLines !== undefined && { ruledLines }),
      ...(aiCompanionName !== undefined && { aiCompanionName }),
      ...(notifications !== undefined && { notifications }),
      ...(aiConfig !== undefined && { aiConfig })
    };

    db.prepare('UPDATE users SET preferences = ? WHERE id = ?').run(JSON.stringify(updated), req.user.id);
    return res.json({ message: 'Preferences updated.', preferences: updated });
  } catch (err) {
    console.error('Update preferences error:', err);
    return res.status(500).json({ error: 'Could not update preferences.' });
  }
});

export default router;
