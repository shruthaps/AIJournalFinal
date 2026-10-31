import { retrieveContext } from './retriever.js';
import { GeminiProvider } from './geminiProvider.js';
import { OpenAIProvider } from './openaiProvider.js';
import db from '../../db/database.js';
import { v4 as uuidv4 } from 'uuid';

class AIService {
  getProviderForUser(userId) {
    // 1. Check user preferences in database
    const user = db.prepare('SELECT preferences FROM users WHERE id = ?').get(userId);
    const prefs = JSON.parse(user?.preferences || '{}');
    const aiConfig = prefs.aiConfig || {};

    // If user provided their own key in Settings
    if (aiConfig.apiKey && aiConfig.apiKey.trim()) {
      if (aiConfig.provider === 'openai') {
        return {
          provider: new OpenAIProvider(aiConfig.apiKey.trim(), aiConfig.model || 'gpt-4o-mini'),
          providerName: 'OpenAI'
        };
      }
      return {
        provider: new GeminiProvider(aiConfig.apiKey.trim()),
        providerName: 'Google Gemini'
      };
    }

    // 2. Check server environment variables
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
      return {
        provider: new GeminiProvider(process.env.GEMINI_API_KEY.trim()),
        providerName: 'Google Gemini (Server)'
      };
    }

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
      return {
        provider: new OpenAIProvider(process.env.OPENAI_API_KEY.trim()),
        providerName: 'OpenAI (Server)'
      };
    }

    // No key configured
    return {
      provider: null,
      providerName: 'None'
    };
  }

  getAIStatus(userId) {
    const { provider, providerName } = this.getProviderForUser(userId);
    return {
      configured: provider !== null,
      providerName
    };
  }

  async processUserMessage(userId, userMessage, mode = 'general', userName = 'Clara') {
    // Check if provider is configured
    const { provider, providerName } = this.getProviderForUser(userId);

    if (!provider) {
      return {
        requiresConfiguration: true,
        message: `Dearly Companion requires an AI API key (Google Gemini or OpenAI) to analyze your journal entries and converse with you. Your private diary writing, browsing, searching, and bookshelf remain fully functional without an AI key.\n\nYou can configure your API key in Settings or add GEMINI_API_KEY to your server .env file.`,
        citations: [],
        featureMode: mode
      };
    }

    // 1. Retrieve user's grounded context (strictly scoped to this authenticated userId)
    const context = retrieveContext(userId, userMessage, mode);

    // 2. Delegate to active live LLM provider
    let result;
    try {
      result = await provider.generateResponse({
        query: userMessage,
        mode,
        context,
        userName
      });
    } catch (err) {
      console.error(`AI Provider (${providerName}) error:`, err.message);
      return {
        error: true,
        message: `An error occurred while contacting the AI service (${err.message}). Please verify your API key or network connection.`,
        citations: []
      };
    }

    // 3. Save conversation record to database
    const conversationId = uuidv4();
    try {
      db.prepare(`
        INSERT INTO ai_conversations (id, user_id, feature_mode, user_message, ai_response, citations)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        conversationId,
        userId,
        mode,
        userMessage,
        result.message,
        JSON.stringify(result.citations || [])
      );
    } catch (dbErr) {
      console.error('Failed to log AI conversation:', dbErr);
    }

    return {
      conversationId,
      message: result.message,
      citations: result.citations || [],
      featureMode: mode,
      providerName
    };
  }
}

export const aiService = new AIService();
