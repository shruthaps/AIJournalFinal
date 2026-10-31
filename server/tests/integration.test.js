import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';

let server;
let serverPort = 5055;
let baseUrl;
let authToken;
let attackerToken;

describe('Dearly End-to-End API Integration & Security Test Suite', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(serverPort, () => {
        baseUrl = `http://localhost:${serverPort}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('GET /health returns healthy status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
  });

  test('POST /auth/demo logs in as Clara Montgomery', async () => {
    const res = await fetch(`${baseUrl}/auth/demo`, { method: 'POST' });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token, 'Token must be returned');
    assert.equal(data.user.email, 'clara@dearly.app');
    authToken = data.token;
  });

  test('GET /journals returns user journals with entry counts', async () => {
    const res = await fetch(`${baseUrl}/journals`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const journals = await res.json();
    assert.ok(journals.length >= 2, 'Should have multiple journals');
    assert.ok(journals[0].title);
    assert.ok(journals[0].cover_color);
  });

  test('POST /entries creates a new authentic entry with mood and tags', async () => {
    const journalsRes = await fetch(`${baseUrl}/journals`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const journals = await journalsRes.json();
    const journalId = journals[0].id;

    const payload = {
      journal_id: journalId,
      date: '2026-10-31',
      title: 'A New Beginning with Dearly',
      quote_of_day: 'The quietest moments hold the deepest truths.',
      content: 'Testing the journal editor end-to-end. The cream paper and ruled lines feel peaceful.',
      mood: 'peaceful',
      weather: 'Crisp & Clear',
      location: 'Study desk',
      paper_theme: 'cream',
      font_style: 'caveat',
      font_size: 'text-lg',
      ruled_lines: 1,
      photos: [],
      stickers: []
    };

    const res = await fetch(`${baseUrl}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    const created = await res.json();
    assert.equal(created.title, 'A New Beginning with Dearly');
    assert.equal(created.weekday, 'SATURDAY');
    assert.ok(created.word_count > 0);
  });

  test('POST /ai/remind-me without API key returns clear requiresConfiguration notice', async () => {
    const res = await fetch(`${baseUrl}/ai/remind-me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.requiresConfiguration, true);
    assert.ok(data.message.includes('API key'));
  });

  test('GET /ai/status accurately returns configuration state', async () => {
    const res = await fetch(`${baseUrl}/ai/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const status = await res.json();
    assert.equal(typeof status.configured, 'boolean');
  });

  test('GET /export/markdown produces clean Markdown archive', async () => {
    const res = await fetch(`${baseUrl}/export/markdown`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('# Dearly — Personal Digital Journal'));
    assert.ok(text.includes('Clara') || text.includes('2026'));
  });

  test('SECURITY & ISOLATION: Second user cannot access or modify Clara data', async () => {
    // 1. Register second user
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second User',
        email: `second-${Date.now()}@example.com`,
        password: 'Password123!',
        diaryName: 'Separate Diary'
      })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    attackerToken = regData.token;

    // 2. Attacker attempts to read Clara's entry (entry-2026-03-12)
    const readAttempt = await fetch(`${baseUrl}/entries/entry-2026-03-12`, {
      headers: { Authorization: `Bearer ${attackerToken}` }
    });
    assert.equal(readAttempt.status, 404, 'Must return 404 Not Found for unauthorized entries');

    // 3. Attacker attempts to delete Clara's entry
    const deleteAttempt = await fetch(`${baseUrl}/entries/entry-2026-03-12`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${attackerToken}` }
    });
    assert.equal(deleteAttempt.status, 404, 'Must not allow unauthorized deletion');

    // 4. Attacker attempts to read Clara's journal
    const journalAttempt = await fetch(`${baseUrl}/journals/journal-daily-chronicles`, {
      headers: { Authorization: `Bearer ${attackerToken}` }
    });
    assert.equal(journalAttempt.status, 404, 'Must not allow unauthorized journal access');
  });
});
