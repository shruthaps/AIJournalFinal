import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, Heart } from 'lucide-react';

export default function OnboardingModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [diaryName, setDiaryName] = useState('');
  const [preferredTheme, setPreferredTheme] = useState('cream');
  const [preferredFont, setPreferredFont] = useState('caveat');
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          diaryName: diaryName || `${name}'s Journal`,
          preferredTheme,
          preferredFont
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/30 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-paper rounded-2xl shadow-book border border-subtle-border p-6 sm:p-8 paper-texture">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-taupe hover:text-espresso rounded-full hover:bg-beige/40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <span className="font-serif italic text-3xl font-semibold text-espresso">
            Dearly
          </span>
          <p className="font-sans text-xs text-charcoal/70 mt-1">
            {mode === 'login' ? 'Welcome back to your private diary.' : 'Begin your personal journaling journey.'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-beige/50 p-1 rounded-lg border border-subtle-border mb-5 text-xs font-sans">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
              mode === 'login' ? 'bg-paper text-espresso shadow-sm' : 'text-taupe hover:text-charcoal'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
              mode === 'register' ? 'bg-paper text-espresso shadow-sm' : 'text-taupe hover:text-charcoal'
            }`}
          >
            Create Diary
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          
          {mode === 'register' && (
            <>
              <div>
                <label className="block font-medium text-charcoal mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Clara Montgomery"
                  className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border focus:border-taupe focus:bg-paper transition-all text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal mb-1">Diary Title (Optional)</label>
                <input
                  type="text"
                  value={diaryName}
                  onChange={(e) => setDiaryName(e.target.value)}
                  placeholder="e.g. Morning Pages & Quiet Dreams"
                  className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border focus:border-taupe focus:bg-paper transition-all text-sm outline-none"
                />
              </div>

              {/* Theme & Font Selection */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-medium text-charcoal mb-1">Paper Theme</label>
                  <select
                    value={preferredTheme}
                    onChange={(e) => setPreferredTheme(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/50 border border-subtle-border text-xs text-charcoal outline-none"
                  >
                    <option value="cream">Cream Paper</option>
                    <option value="parchment">Warm Parchment</option>
                    <option value="rose_tint">Dusty Rose Tint</option>
                    <option value="sage_tint">Muted Sage Tint</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-charcoal mb-1">Handwriting Font</label>
                  <select
                    value={preferredFont}
                    onChange={(e) => setPreferredFont(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/50 border border-subtle-border text-xs text-charcoal outline-none"
                  >
                    <option value="caveat">Caveat (Curvy & Warm)</option>
                    <option value="patrick">Patrick Hand (Clean & Casual)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-medium text-charcoal mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border focus:border-taupe focus:bg-paper transition-all text-sm outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-charcoal mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border focus:border-taupe focus:bg-paper transition-all text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 rounded-xl bg-espresso text-paper font-medium text-sm hover:bg-charcoal shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-dusty-rose" />
            <span>
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In to Dearly' : 'Open My New Diary'}
            </span>
          </button>

        </form>

      </div>
    </div>
  );
}
