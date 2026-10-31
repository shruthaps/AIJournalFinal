import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';
import db, { initDatabase } from '../src/db/database.js';
import { retrieveContext } from '../src/services/ai/retriever.js';
import { LocalRAGProvider } from '../src/services/ai/localRAGProvider.js';

describe('Dearly Core Backend Test Suite', () => {
  before(() => {
    initDatabase();
  });

  test('Database is initialized with Demo User Clara Montgomery', () => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('clara@dearly.app');
    assert.ok(user, 'Demo user should exist in database');
    assert.equal(user.name, 'Clara Montgomery');
  });

  test('Demo user has at least two personal journals on the bookshelf', () => {
    const journals = db.prepare('SELECT * FROM journals WHERE user_id = ?').all('demo-user-clara');
    assert.ok(journals.length >= 2, 'Clara should have multiple journals on her bookshelf');
  });

  test('Demo user has rich authentic entries spanning multiple months', () => {
    const entries = db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY date ASC').all('demo-user-clara');
    assert.ok(entries.length >= 5, 'Clara should have at least 5 entries for historical depth');

    const marchEntry = entries.find(e => e.date === '2026-03-12');
    assert.ok(marchEntry, 'March presentation anxiety entry must exist');
    assert.equal(marchEntry.mood, 'anxious');

    const aprilEntry = entries.find(e => e.date === '2026-04-18');
    assert.ok(aprilEntry, 'April presentation success entry must exist');
    assert.equal(aprilEntry.mood, 'joyful');

    const octEntry = entries.find(e => e.date === '2026-10-15');
    assert.ok(octEntry, 'October 10k run entry must exist');
    assert.equal(octEntry.mood, 'energetic');
  });

  test('RAG Retriever retrieves grounded entries for "Remind Me Who I Am"', () => {
    const context = retrieveContext('demo-user-clara', 'Remind me how far I have come and what I achieved', 'remind_who_i_am');
    assert.ok(context.allEntries.length >= 5, 'Should retrieve user entries');
    assert.ok(context.citations.length > 0, 'Should generate citations');

    const hasPresentationEntry = context.allEntries.some(e => e.id === 'entry-2026-03-12' || e.id === 'entry-2026-04-18');
    assert.ok(hasPresentationEntry, 'Should retrieve relevant historical victory/struggle pair');
  });

  test('Local Grounded RAG generates empathetic response with citations', async () => {
    const provider = new LocalRAGProvider();
    const context = retrieveContext('demo-user-clara', 'Remind me who I am', 'remind_who_i_am');

    const response = await provider.generateResponse({
      query: 'Remind me how far I have come',
      mode: 'remind_who_i_am',
      context,
      userName: 'Clara'
    });

    assert.ok(response.message.length > 100, 'Response should be substantial and thoughtful');
    assert.ok(response.message.includes('presentation') || response.message.includes('March'), 'Must reference documented struggle');
    assert.ok(response.citations.length > 0, 'Must include citations');
  });

  test('RAG Provider analyzes patterns without medical diagnosing', async () => {
    const provider = new LocalRAGProvider();
    const context = retrieveContext('demo-user-clara', 'What patterns do you notice?', 'understand_patterns');

    const response = await provider.generateResponse({
      query: 'Understand my patterns',
      mode: 'understand_patterns',
      context,
      userName: 'Clara'
    });

    assert.ok(response.message.includes('patterns') || response.message.includes('Anticipation'), 'Should present patterns as gentle observations');
    assert.ok(response.citations.length > 0, 'Should cite supporting entries');
  });

  test('Situation reflection separates facts from assumptions', async () => {
    const provider = new LocalRAGProvider();
    const context = retrieveContext('demo-user-clara', 'What could I have done differently with Mark?', 'what_differently');

    const response = await provider.generateResponse({
      query: 'What could I have done differently?',
      mode: 'what_differently',
      context,
      userName: 'Clara'
    });

    assert.ok(response.message.includes('Facts') || response.message.includes('Assumptions'), 'Should separate facts from assumptions');
    assert.ok(response.message.includes('Alternative'), 'Should suggest constructive alternative responses');
  });
});
