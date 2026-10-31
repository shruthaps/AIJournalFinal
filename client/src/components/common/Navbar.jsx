import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useJournal } from '../../context/JournalContext';
import {
  BookOpen,
  Library,
  Calendar,
  Sparkles,
  PenLine,
  Target,
  Settings,
  LogOut,
  ChevronDown,
  Plus
} from 'lucide-react';

export default function Navbar({ onOpenSettings }) {
  const { user, logout } = useAuth();
  const {
    journals,
    currentJournal,
    setCurrentJournal,
    activeView,
    setActiveView,
    openNewEntry,
    isCompanionOpen,
    setIsCompanionOpen
  } = useJournal();

  const [isJournalDropdownOpen, setIsJournalDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-ivory/85 backdrop-blur-md border-b border-subtle-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand & Journal Switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setActiveView('reader')}
            className="flex items-center gap-2 group text-left"
          >
            <span className="font-serif italic text-2xl md:text-3xl font-semibold tracking-tight text-espresso group-hover:text-muted-brown transition-colors">
              Dearly
            </span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-dusty-rose-dark" />
          </button>

          {/* Current Journal Selector */}
          {journals.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsJournalDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-sans text-charcoal bg-paper/70 hover:bg-paper border border-subtle-border shadow-subtle transition-all"
                title="Switch Journal"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: currentJournal?.cover_color || '#756558' }}
                />
                <span className="font-medium max-w-[120px] sm:max-w-[180px] truncate">
                  {currentJournal?.title || 'My Journal'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-taupe" />
              </button>

              {isJournalDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsJournalDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-64 bg-paper rounded-xl shadow-lg border border-subtle-border py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-1 text-[11px] font-sans uppercase tracking-wider text-taupe font-semibold">
                      Your Journals
                    </div>
                    {journals.map(j => (
                      <button
                        key={j.id}
                        onClick={() => {
                          setCurrentJournal(j);
                          setIsJournalDropdownOpen(false);
                          setActiveView('reader');
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-beige/40 transition-colors ${
                          currentJournal?.id === j.id ? 'bg-beige/60 font-medium text-espresso' : 'text-charcoal'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: j.cover_color }}
                        />
                        <span className="truncate flex-1">{j.title}</span>
                        <span className="text-xs text-taupe">{j.entry_count || 0}</span>
                      </button>
                    ))}
                    <div className="border-t border-subtle-border my-1" />
                    <button
                      onClick={() => {
                        setIsJournalDropdownOpen(false);
                        setActiveView('bookshelf');
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-muted-brown hover:bg-beige/40 flex items-center gap-2"
                    >
                      <Library className="w-3.5 h-3.5" />
                      Manage Bookshelf...
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-paper/60 p-1 rounded-xl border border-subtle-border shadow-subtle">
          <button
            onClick={() => setActiveView('reader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all ${
              activeView === 'reader'
                ? 'bg-paper text-espresso shadow-sm font-medium'
                : 'text-taupe hover:text-charcoal'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Diary</span>
          </button>

          <button
            onClick={() => setActiveView('bookshelf')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all ${
              activeView === 'bookshelf'
                ? 'bg-paper text-espresso shadow-sm font-medium'
                : 'text-taupe hover:text-charcoal'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Bookshelf</span>
          </button>

          <button
            onClick={() => setActiveView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all ${
              activeView === 'calendar'
                ? 'bg-paper text-espresso shadow-sm font-medium'
                : 'text-taupe hover:text-charcoal'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Search & Calendar</span>
          </button>

          <button
            onClick={() => setActiveView('goals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all ${
              activeView === 'goals'
                ? 'bg-paper text-espresso shadow-sm font-medium'
                : 'text-taupe hover:text-charcoal'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Goals & Reflections</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Entry Button */}
          <button
            onClick={openNewEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted-brown text-paper hover:bg-espresso rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-all"
            title="Write New Entry"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Entry</span>
          </button>

          {/* AI Companion Toggle */}
          <button
            onClick={() => setIsCompanionOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border ${
              isCompanionOpen
                ? 'bg-dusty-rose text-espresso border-dusty-rose-dark/40 shadow-sm'
                : 'bg-paper text-charcoal hover:bg-beige/40 border-subtle-border'
            }`}
            title="AI Companion"
          >
            <Sparkles className="w-3.5 h-3.5 text-dusty-rose-dark" />
            <span className="hidden sm:inline">Companion</span>
          </button>

          {/* User Settings & Logout */}
          <div className="flex items-center border-l border-subtle-border pl-2 sm:pl-3 gap-1">
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-taupe hover:text-charcoal rounded-md hover:bg-beige/40 transition-colors"
              title="Preferences & Export"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-1.5 text-taupe hover:text-red-700 rounded-md hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-subtle-border bg-paper/95 text-xs text-taupe">
        <button
          onClick={() => setActiveView('reader')}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'reader' ? 'text-espresso font-medium' : ''}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Diary</span>
        </button>
        <button
          onClick={() => setActiveView('bookshelf')}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'bookshelf' ? 'text-espresso font-medium' : ''}`}
        >
          <Library className="w-4 h-4" />
          <span>Shelf</span>
        </button>
        <button
          onClick={() => setActiveView('calendar')}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'calendar' ? 'text-espresso font-medium' : ''}`}
        >
          <Calendar className="w-4 h-4" />
          <span>Search</span>
        </button>
        <button
          onClick={() => setActiveView('goals')}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'goals' ? 'text-espresso font-medium' : ''}`}
        >
          <Target className="w-4 h-4" />
          <span>Reflections</span>
        </button>
      </div>
    </header>
  );
}
