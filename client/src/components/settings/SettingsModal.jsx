import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import {
  X,
  Settings,
  Download,
  Key,
  Palette,
  ShieldCheck,
  Sparkles,
  FileText,
  Database,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const { user, updatePreferences } = useAuth();

  // Aesthetics state
  const [preferredFont, setPreferredFont] = useState(user?.preferences?.preferredFont || 'caveat');
  const [preferredTheme, setPreferredTheme] = useState(user?.preferences?.preferredTheme || 'cream');
  const [ruledLines, setRuledLines] = useState(user?.preferences?.ruledLines ?? true);
  const [aiCompanionName, setAiCompanionName] = useState(user?.preferences?.aiCompanionName || 'Dearly AI');

  // AI Provider state
  const existingAiConfig = user?.preferences?.aiConfig || {};
  const [aiProvider, setAiProvider] = useState(existingAiConfig.provider || 'gemini');
  const [apiKey, setApiKey] = useState(existingAiConfig.apiKey || '');
  const [aiModel, setAiModel] = useState(existingAiConfig.model || (aiProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'));
  const [showApiKey, setShowApiKey] = useState(false);

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setSavedSuccess(false);

    try {
      await updatePreferences({
        preferredFont,
        preferredTheme,
        ruledLines,
        aiCompanionName,
        aiConfig: {
          provider: aiProvider,
          apiKey: apiKey.trim(),
          model: aiModel
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Save preferences error:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleExportJSON = () => {
    window.open('/api/export/json', '_blank');
  };

  const handleExportMarkdown = () => {
    window.open('/api/export/markdown', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/30 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-paper rounded-2xl shadow-book border border-subtle-border p-6 sm:p-8 paper-texture space-y-6 text-xs font-sans max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-subtle-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-brown" />
            <h2 className="font-serif text-2xl text-espresso font-semibold">Settings & Privacy</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-taupe hover:text-espresso rounded-full hover:bg-beige/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Account Info */}
        <div className="p-4 rounded-xl bg-beige/30 border border-subtle-border/80 flex items-center justify-between">
          <div>
            <span className="font-medium text-espresso text-sm block">{user?.name}</span>
            <span className="text-taupe text-xs">{user?.email}</span>
          </div>
          <span className="text-[10px] bg-paper px-2.5 py-1 rounded-full border border-subtle-border text-charcoal font-medium">
            Private Account
          </span>
        </div>

        <form onSubmit={handleSaveAll} className="space-y-6">
          
          {/* Section 1: Journal Typography & Paper Tone */}
          <div className="space-y-4">
            <h3 className="font-serif text-base text-espresso font-medium flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-muted-brown" />
              <span>Journal Typography & Atmosphere</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-charcoal mb-1">Handwriting Style</label>
                <select
                  value={preferredFont}
                  onChange={(e) => setPreferredFont(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal outline-none focus:border-taupe"
                >
                  <option value="caveat">Caveat (Curvy & Warm)</option>
                  <option value="patrick">Patrick Hand (Casual Script)</option>
                  <option value="cormorant">Cormorant Garamond (Editorial Serif)</option>
                  <option value="inter">Inter (Clean Modern Sans)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-charcoal mb-1">Paper Tone</label>
                <select
                  value={preferredTheme}
                  onChange={(e) => setPreferredTheme(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal outline-none focus:border-taupe"
                >
                  <option value="cream">Cream Paper</option>
                  <option value="parchment">Warm Parchment</option>
                  <option value="rose_tint">Dusty Rose Tint</option>
                  <option value="sage_tint">Muted Sage Tint</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-ivory/40 border border-subtle-border">
              <div>
                <span className="font-medium text-charcoal block">Notebook Ruling Lines</span>
                <span className="text-[11px] text-taupe">Render horizontal notebook lines aligned with text baseline</span>
              </div>
              <input
                type="checkbox"
                checked={ruledLines}
                onChange={(e) => setRuledLines(e.target.checked)}
                className="w-4 h-4 accent-espresso"
              />
            </div>
          </div>

          <div className="border-t border-subtle-border" />

          {/* Section 2: AI Companion Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base text-espresso font-medium flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-dusty-rose-dark" />
                <span>AI Companion Configuration</span>
              </h3>
              {apiKey ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-sage-dark font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Configured</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-taupe">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>No Key Set</span>
                </span>
              )}
            </div>

            <p className="text-charcoal/70 leading-relaxed text-[11px]">
              Dearly uses an authentic retrieval-augmented generation (RAG) architecture. Configure your API key to enable live AI reflections. Your key is stored strictly within your private account and is never shared.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-charcoal mb-1">AI Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => {
                    setAiProvider(e.target.value);
                    setAiModel(e.target.value === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
                  }}
                  className="w-full px-2.5 py-2 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal outline-none focus:border-taupe"
                >
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-charcoal mb-1">Model</label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal outline-none focus:border-taupe"
                >
                  {aiProvider === 'gemini' ? (
                    <>
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Warm)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Latest)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o-mini">gpt-4o-mini (Fast & Efficient)</option>
                      <option value="gpt-4o">gpt-4o (Comprehensive)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-charcoal mb-1">
                {aiProvider === 'gemini' ? 'Google Gemini API Key' : 'OpenAI API Key'}
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={aiProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  className="w-full pl-3 pr-10 py-2 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal font-mono outline-none focus:border-taupe"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(prev => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-taupe hover:text-charcoal"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-taupe mt-1">
                {aiProvider === 'gemini'
                  ? 'Obtain a free key from Google AI Studio (aistudio.google.com)'
                  : 'Obtain from OpenAI Platform (platform.openai.com/api-keys)'}
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-sage-dark font-medium text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All settings saved successfully.</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={savingPrefs}
              className="px-5 py-2.5 bg-espresso text-paper font-medium rounded-xl hover:bg-charcoal shadow-sm transition-all text-xs"
            >
              {savingPrefs ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </form>

        <div className="border-t border-subtle-border" />

        {/* Section 3: Data Ownership & Export */}
        <div className="space-y-3">
          <h3 className="font-serif text-base text-espresso font-medium flex items-center gap-1.5">
            <Download className="w-4 h-4 text-muted-brown" />
            <span>Export & Data Sovereignty</span>
          </h3>
          <p className="text-charcoal/70 leading-relaxed text-[11px]">
            Your memories belong solely to you. You can download an offline archive of all your notebooks, entries, photographs, and reflections at any time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="p-3 rounded-xl bg-ivory/60 hover:bg-beige/40 border border-subtle-border flex items-center gap-2.5 text-left transition-colors"
            >
              <FileText className="w-4 h-4 text-muted-brown flex-shrink-0" />
              <div>
                <span className="font-medium text-espresso block">Markdown Bundle</span>
                <span className="text-[10px] text-taupe">Formatted text files for Obsidian / Print</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="p-3 rounded-xl bg-ivory/60 hover:bg-beige/40 border border-subtle-border flex items-center gap-2.5 text-left transition-colors"
            >
              <Database className="w-4 h-4 text-muted-brown flex-shrink-0" />
              <div>
                <span className="font-medium text-espresso block">Complete JSON Archive</span>
                <span className="text-[10px] text-taupe">All entries, goals, achievements & metadata</span>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
