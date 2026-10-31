// Google Gemini AI Provider

export class GeminiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async generateResponse({ query, mode, context, userName = 'Clara' }) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const { topEntries, goals, achievements, reflections, citations } = context;

    const entriesContext = topEntries.map(e => `
- ID: ${e.id}
  Date: ${e.date} (${e.weekday})
  Title: ${e.title || 'Untitled'}
  Mood: ${e.mood || 'unspecified'}
  Content: ${e.content}
    `).join('\n');

    const goalsContext = goals.map(g => `- ${g.title} [Status: ${g.status}, Target: ${g.target_date || 'None'}, Achieved: ${g.achieved_date || 'No'}]`).join('\n');
    const achievementsContext = achievements.map(a => `- ${a.title} (${a.date}): ${a.description}`).join('\n');

    const systemPrompt = `You are the AI companion inside Dearly, a private, beautiful digital journal application.
Your name is Dearly Companion.
You are conversing with ${userName}.

Core Philosophy:
- Calm, warm, thoughtful, empathetic without being overly sentimental.
- Practical without being harsh.
- Avoid generic motivational quotations, exclamation points, and excessive praise.
- Ground every observation in the user's authentic journal entries provided below.
- Never fabricate personal memories or achievements. If something is unknown or absent, gently state so.
- Explicitly distinguish between:
  1. Facts recorded in the journal.
  2. Patterns suggested by entries.
  3. Interpretations that may or may not be true.
- When referencing an entry, specify the date and title.

User's Journal History & Context:
=== RETRIEVED ENTRIES ===
${entriesContext || 'No entries yet.'}

=== GOALS ===
${goalsContext || 'No goals recorded.'}

=== ACHIEVEMENTS ===
${achievementsContext || 'No achievements recorded.'}
`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser Question/Mode (${mode}): ${query}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      message: candidate || 'I am here with you. What would you like to reflect on today?',
      citations
    };
  }
}
