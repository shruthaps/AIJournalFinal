import React, { useState, useEffect, useRef } from 'react';
import { useJournal } from '../../context/JournalContext';
import { apiRequest } from '../../api/client';
import {
  Sparkles,
  X,
  Send,
  BookOpen,
  Calendar,
  Compass,
  ArrowRight,
  HelpCircle,
  Clock,
  History,
  PenLine,
  Key,
  ShieldAlert,
  Settings
} from 'lucide-react';

export default function AICompanionDrawer({ onOpenSettings }) {
  const {
    isCompanionOpen,
    setIsCompanionOpen,
    companionInitialMode,
    openEntryById,
    currentEntry,
    setCurrentEntry,
    setEditorMode
  } = useJournal();

  const [aiStatus, setAiStatus] = useState({ configured: false, providerName: 'None' });
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ai',
      text: "Hello, Clara. I am here as a quiet companion to your journal. When an AI API key is configured, I can help retrieve memories, recognize patterns, or reflect on your journey using your authentic entries. What would you like to explore today?",
      citations: []
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Check AI provider status on mount or open
  useEffect(() => {
    if (isCompanionOpen) {
      setCheckingStatus(true);
      apiRequest('/ai/status')
        .then(data => setAiStatus(data))
        .catch(err => console.error('Status check error:', err))
        .finally(() => setCheckingStatus(false));
    }
  }, [isCompanionOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // If opened with a specific initial mode, trigger it
  useEffect(() => {
    if (isCompanionOpen && companionInitialMode && companionInitialMode !== 'general') {
      triggerFeatureMode(companionInitialMode);
    }
  }, [isCompanionOpen, companionInitialMode]);

  const triggerFeatureMode = async (modeKey) => {
    let endpoint = '/ai/chat';
    let userPrompt = '';

    switch (modeKey) {
      case 'remind_who_i_am':
        endpoint = '/ai/remind-me';
        userPrompt = "Remind me how far I've come.";
        break;
      case 'understand_patterns':
        endpoint = '/ai/patterns';
        userPrompt = 'Help me understand recurring patterns in my writing.';
        break;
      case 'what_differently':
        endpoint = '/ai/what-differently';
        userPrompt = 'What could I have done differently in a recent difficult situation?';
        break;
      case 'talk_to_past_self':
        endpoint = '/ai/past-self';
        userPrompt = 'What was I worried about six months ago?';
        break;
      case 'monthly_reflection':
        endpoint = '/ai/monthly-reflection';
        userPrompt = 'Generate a draft of my monthly reflection.';
        break;
      case 'daily_prompt':
        endpoint = '/ai/prompts';
        userPrompt = 'Give me a thoughtful journaling prompt for today.';
        break;
      default:
        endpoint = '/ai/chat';
        userPrompt = 'Reflect with me.';
    }

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userPrompt }]);
    setLoading(true);

    try {
      const res = await apiRequest(endpoint, {
        method: modeKey === 'daily_prompt' ? 'GET' : 'POST',
        ...(modeKey !== 'daily_prompt' && { body: JSON.stringify({ mode: modeKey, message: userPrompt }) })
      });

      if (res.requiresConfiguration) {
        setAiStatus({ configured: false, providerName: 'None' });
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: res.message,
          citations: res.citations || [],
          requiresConfiguration: res.requiresConfiguration || false
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'ai',
          text: 'I am unable to retrieve that reflection right now. Please feel free to write freely in your diary.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const text = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', text }]);
    setLoading(true);

    try {
      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, mode: 'general' })
      });

      if (res.requiresConfiguration) {
        setAiStatus({ configured: false, providerName: 'None' });
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: res.message,
          citations: res.citations || [],
          requiresConfiguration: res.requiresConfiguration || false
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'ai',
          text: 'Unable to communicate with the AI engine. Your journal entries remain securely preserved.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Insert Reflection / Prompt into Journal Entry
  const handleInsertIntoEntry = (textToInsert) => {
    if (!currentEntry) return;
    const addition = `\n\n${textToInsert}`;
    setCurrentEntry(prev => ({
      ...prev,
      content: (prev.content || '') + addition
    }));
    setEditorMode('write');
    setIsCompanionOpen(false);
  };

  if (!isCompanionOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-paper paper-texture shadow-2xl border-l border-subtle-border flex flex-col justify-between animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-subtle-border flex items-center justify-between bg-paper/90 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-dusty-rose/60 flex items-center justify-center text-dusty-rose-dark shadow-subtle">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-espresso font-semibold leading-tight flex items-center gap-2">
              <span>Dearly Companion</span>
              {aiStatus.configured && (
                <span className="text-[10px] bg-sage/60 text-sage-dark px-2 py-0.5 rounded-full font-sans font-medium">
                  {aiStatus.providerName}
                </span>
              )}
            </h2>
            <p className="text-[11px] font-sans text-taupe">
              Grounded in your authentic journal history
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCompanionOpen(false)}
          className="p-1.5 text-taupe hover:text-espresso rounded-full hover:bg-beige/40 transition-colors"
          title="Close Companion"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Configuration Required Callout Banner (if not yet configured) */}
      {!aiStatus.configured && !checkingStatus && (
        <div className="p-4 mx-4 mt-3 rounded-xl bg-beige/40 border border-subtle-border/80 text-xs font-sans text-charcoal space-y-2">
          <div className="flex items-center gap-1.5 font-medium text-espresso">
            <Key className="w-4 h-4 text-muted-brown" />
            <span>AI Provider Configuration Required</span>
          </div>
          <p className="text-charcoal/80 leading-relaxed text-[11px]">
            To converse with the AI companion and reflect on your entries, configure a <strong>Google Gemini</strong> or <strong>OpenAI</strong> API key in Settings. Your diary writing and bookshelf remain 100% functional without it.
          </p>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-espresso text-paper text-xs font-medium hover:bg-charcoal shadow-sm transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure AI Key in Settings</span>
            </button>
          )}
        </div>
      )}

      {/* Suggested Functional Starters (Horizontal scrollable pills) */}
      <div className="px-4 py-2.5 bg-beige/30 border-b border-subtle-border overflow-x-auto flex gap-2 no-scrollbar text-xs font-sans">
        
        <button
          onClick={() => triggerFeatureMode('remind_who_i_am')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-paper hover:bg-paper/80 text-charcoal border border-subtle-border shadow-subtle transition-all flex items-center gap-1.5 hover:border-dusty-rose-dark/40"
        >
          <span>🌱 Remind me who I am</span>
        </button>

        <button
          onClick={() => triggerFeatureMode('understand_patterns')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-paper hover:bg-paper/80 text-charcoal border border-subtle-border shadow-subtle transition-all flex items-center gap-1.5 hover:border-sage-dark/40"
        >
          <span>🔍 Understand my patterns</span>
        </button>

        <button
          onClick={() => triggerFeatureMode('talk_to_past_self')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-paper hover:bg-paper/80 text-charcoal border border-subtle-border shadow-subtle transition-all flex items-center gap-1.5 hover:border-butter-dark/40"
        >
          <span>⏳ Talk to past self</span>
        </button>

        <button
          onClick={() => triggerFeatureMode('what_differently')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-paper hover:bg-paper/80 text-charcoal border border-subtle-border shadow-subtle transition-all flex items-center gap-1.5"
        >
          <span>⚖️ What could I do differently?</span>
        </button>

        <button
          onClick={() => triggerFeatureMode('monthly_reflection')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-paper hover:bg-paper/80 text-charcoal border border-subtle-border shadow-subtle transition-all flex items-center gap-1.5"
        >
          <span>🍁 Monthly reflection</span>
        </button>

        <button
          onClick={() => triggerFeatureMode('daily_prompt')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-paper hover:bg-paper/80 text-charcoal border border-subtle-border shadow-subtle transition-all flex items-center gap-1.5"
        >
          <span>✨ Daily prompt</span>
        </button>

      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-sm font-sans">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-4 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-muted-brown text-paper rounded-br-none shadow-sm text-xs sm:text-sm'
                  : 'bg-paper text-espresso border border-subtle-border shadow-subtle rounded-bl-none text-xs sm:text-sm'
              }`}
            >
              {/* Message text with Markdown formatting */}
              <div className="whitespace-pre-wrap space-y-2">
                {msg.text}
              </div>

              {/* Configure button if message indicates configuration requirement */}
              {msg.requiresConfiguration && onOpenSettings && (
                <div className="mt-3 pt-2">
                  <button
                    onClick={onOpenSettings}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-espresso text-paper text-xs font-medium hover:bg-charcoal shadow-sm transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Open Settings to Add API Key</span>
                  </button>
                </div>
              )}

              {/* Grounded Entry Citations (Clickable reference pills) */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-subtle-border/60">
                  <div className="text-[10px] uppercase tracking-wider text-taupe font-semibold mb-2 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-muted-brown" />
                    <span>Referenced Journal Entries</span>
                  </div>
                  <div className="space-y-1.5">
                    {msg.citations.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => openEntryById(c.entryId)}
                        className="w-full text-left p-2 rounded-lg bg-beige/30 hover:bg-beige/60 border border-subtle-border/80 transition-all flex items-center justify-between text-xs group"
                        title="Open this entry in the Diary Reader"
                      >
                        <div className="truncate">
                          <span className="font-medium text-espresso block truncate">
                            {c.entryTitle}
                          </span>
                          <span className="text-[10px] text-taupe block font-mono">
                            {c.entryDate}
                          </span>
                        </div>
                        <span className="text-muted-brown group-hover:translate-x-1 transition-transform ml-2">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 1-Click Paste into Journal Action */}
              {msg.role === 'ai' && !msg.requiresConfiguration && (
                <div className="mt-3 pt-2 flex justify-end">
                  <button
                    onClick={() => handleInsertIntoEntry(msg.text)}
                    className="text-[11px] text-muted-brown hover:text-espresso flex items-center gap-1 font-medium transition-colors"
                    title="Insert this thought into today's journal"
                  >
                    <PenLine className="w-3 h-3" />
                    <span>Insert into Journal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 text-xs text-taupe bg-paper/60 rounded-xl max-w-[200px] border border-subtle-border animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-dusty-rose-dark animate-spin" />
            <span>Reflecting on memories...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 border-t border-subtle-border bg-paper/95 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question about your journal..."
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-ivory/60 border border-subtle-border text-xs sm:text-sm text-charcoal outline-none focus:border-taupe focus:bg-paper transition-all placeholder:text-taupe/60"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="p-2.5 rounded-xl bg-espresso text-paper hover:bg-charcoal disabled:opacity-40 shadow-sm transition-all flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </aside>
  );
}
