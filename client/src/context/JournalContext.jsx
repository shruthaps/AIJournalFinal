import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from './AuthContext';

const JournalContext = createContext(null);

export function JournalProvider({ children }) {
  const { user } = useAuth();

  const [journals, setJournals] = useState([]);
  const [currentJournal, setCurrentJournal] = useState(null);
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [calendarDates, setCalendarDates] = useState([]);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  
  // App views: 'bookshelf', 'reader', 'editor', 'calendar', 'goals'
  const [activeView, setActiveView] = useState('reader');
  const [editorMode, setEditorMode] = useState('read'); // 'read' or 'write'
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [companionInitialMode, setCompanionInitialMode] = useState('general');
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Load Journals
  const refreshJournals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest('/journals');
      setJournals(data);
      if (data.length > 0 && !currentJournal) {
        // Default to favorite or first journal
        const defaultJournal = data.find(j => j.is_favorite) || data[0];
        setCurrentJournal(defaultJournal);
      }
    } catch (err) {
      console.error('Error fetching journals:', err);
    }
  }, [user, currentJournal]);

  // Load Entries for current journal
  const refreshEntries = useCallback(async (journalId) => {
    if (!user) return;
    const targetJournalId = journalId || currentJournal?.id;
    if (!targetJournalId) return;

    setLoadingEntries(true);
    try {
      const data = await apiRequest(`/entries?journalId=${targetJournalId}`);
      setEntries(data);
      
      // If no current entry, select the latest entry
      if (data.length > 0 && (!currentEntry || currentEntry.journal_id !== targetJournalId)) {
        setCurrentEntry(data[0]);
      } else if (data.length === 0) {
        setCurrentEntry(null);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setLoadingEntries(false);
    }
  }, [user, currentJournal, currentEntry]);

  // Load Calendar Dates
  const refreshCalendar = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest('/entries/calendar');
      setCalendarDates(data);
    } catch (err) {
      console.error('Error fetching calendar:', err);
    }
  }, [user]);

  // Load Goals & Achievements
  const refreshGoals = useCallback(async () => {
    if (!user) return;
    try {
      const [goalsData, achData] = await Promise.all([
        apiRequest('/goals'),
        apiRequest('/goals/achievements/all')
      ]);
      setGoals(goalsData);
      setAchievements(achData);
    } catch (err) {
      console.error('Error fetching goals/achievements:', err);
    }
  }, [user]);

  // Trigger initial fetches when user logs in
  useEffect(() => {
    if (user) {
      refreshJournals();
      refreshCalendar();
      refreshGoals();
    } else {
      setJournals([]);
      setCurrentJournal(null);
      setEntries([]);
      setCurrentEntry(null);
      setCalendarDates([]);
    }
  }, [user, refreshJournals, refreshCalendar, refreshGoals]);

  // Fetch entries whenever current journal changes
  useEffect(() => {
    if (currentJournal?.id) {
      refreshEntries(currentJournal.id);
    }
  }, [currentJournal?.id, refreshEntries]);

  // Navigation helpers
  const openEntryById = async (entryId) => {
    try {
      const entry = await apiRequest(`/entries/${entryId}`);
      setCurrentEntry(entry);
      // Switch journal if needed
      if (currentJournal?.id !== entry.journal_id) {
        const matchingJournal = journals.find(j => j.id === entry.journal_id);
        if (matchingJournal) setCurrentJournal(matchingJournal);
      }
      setActiveView('reader');
      setEditorMode('read');
    } catch (err) {
      console.error('Error opening entry:', err);
    }
  };

  const openNewEntry = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newDraft = {
      id: null, // Indicates unsaved draft
      journal_id: currentJournal?.id || (journals[0] ? journals[0].id : null),
      date: todayStr,
      weekday: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
      title: '',
      quote_of_day: 'Enjoy the day.',
      content: '',
      mood: 'peaceful',
      weather: '',
      location: '',
      paper_theme: user?.preferences?.preferredTheme || 'cream',
      font_style: user?.preferences?.preferredFont || 'caveat',
      font_size: 'text-lg',
      ruled_lines: 1,
      photos: [],
      stickers: []
    };
    setCurrentEntry(newDraft);
    setActiveView('reader');
    setEditorMode('write');
  };

  const openCompanionWithMode = (mode) => {
    setCompanionInitialMode(mode);
    setIsCompanionOpen(true);
  };

  return (
    <JournalContext.Provider value={{
      journals,
      currentJournal,
      setCurrentJournal,
      refreshJournals,
      entries,
      currentEntry,
      setCurrentEntry,
      refreshEntries,
      loadingEntries,
      calendarDates,
      refreshCalendar,
      goals,
      achievements,
      refreshGoals,
      activeView,
      setActiveView,
      editorMode,
      setEditorMode,
      isCompanionOpen,
      setIsCompanionOpen,
      companionInitialMode,
      openEntryById,
      openNewEntry,
      openCompanionWithMode
    }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
}
