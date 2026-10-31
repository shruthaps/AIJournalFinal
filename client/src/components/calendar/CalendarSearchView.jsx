import React, { useState, useEffect } from 'react';
import { useJournal } from '../../context/JournalContext';
import { apiRequest } from '../../api/client';
import {
  Calendar as CalendarIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Bookmark,
  BookOpen,
  Filter,
  Sparkles
} from 'lucide-react';

export default function CalendarSearchView() {
  const { journals, calendarDates, openEntryById } = useJournal();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJournal, setSelectedJournal] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [hasPhotosOnly, setHasPhotosOnly] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Calendar current view month
  const [currentDate, setCurrentDate] = useState(new Date());

  // Perform search query
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedJournal, selectedMood, hasPhotosOnly]);

  const fetchSearchResults = async () => {
    setSearching(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('q', searchTerm);
      if (selectedJournal) queryParams.append('journalId', selectedJournal);
      if (selectedMood) queryParams.append('mood', selectedMood);
      if (hasPhotosOnly) queryParams.append('hasPhotos', 'true');

      const data = await apiRequest(`/search?${queryParams.toString()}`);
      setSearchResults(data.entries || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });

  // Compute days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map of calendar dates with entries
  const entryDateMap = new Map();
  calendarDates.forEach(d => {
    entryDateMap.set(d.date, d);
  });

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'joyful': return 'bg-amber-400';
      case 'peaceful': return 'bg-emerald-400';
      case 'contemplative': return 'bg-amber-600';
      case 'anxious': return 'bg-rose-400';
      case 'energetic': return 'bg-orange-400';
      case 'grateful': return 'bg-pink-400';
      default: return 'bg-taupe';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 animate-in fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-sans tracking-widest text-taupe uppercase font-semibold">
          MEMORIES & ARCHIVES
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-espresso font-semibold mt-1">
          Calendar & Memory Search
        </h1>
        <p className="font-sans text-xs sm:text-sm text-charcoal/70 mt-1">
          Explore dates of past writing or search across your thoughts, quotes, and photographs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Monthly Calendar Grid (5 cols) */}
        <div className="lg:col-span-5 bg-paper paper-texture rounded-2xl shadow-book border border-subtle-border p-6 flex flex-col justify-between">
          <div>
            {/* Month Header Navigation */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-subtle-border">
              <h2 className="font-serif text-xl text-espresso font-semibold">
                {monthName} {year}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-taupe hover:text-espresso hover:bg-beige/40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-taupe hover:text-espresso hover:bg-beige/40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 text-center text-[11px] font-sans text-taupe uppercase tracking-wider mb-2">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center font-sans text-xs">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const entryInfo = entryDateMap.get(dateKey);

                return (
                  <button
                    key={dayNum}
                    onClick={() => {
                      if (entryInfo?.id) {
                        openEntryById(entryInfo.id);
                      }
                    }}
                    disabled={!entryInfo}
                    className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all ${
                      entryInfo
                        ? 'hover:bg-beige/60 cursor-pointer font-medium text-espresso'
                        : 'text-taupe/40 cursor-default'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {entryInfo && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${getMoodColor(entryInfo.mood)}`}
                        title={`Entry: ${entryInfo.title || 'Journal'}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Mood Legend */}
          <div className="pt-6 mt-6 border-t border-subtle-border flex flex-wrap gap-3 text-[11px] font-sans text-taupe">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Peaceful</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Joyful</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Anxious</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span>Grateful</span>
            </span>
          </div>
        </div>

        {/* Right Column: Search & Memory Results (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search Bar & Filters */}
          <div className="bg-paper p-4 rounded-2xl border border-subtle-border shadow-subtle space-y-3 font-sans text-xs">
            
            {/* Search Input */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-ivory/60 border border-subtle-border">
              <Search className="w-4 h-4 text-taupe flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by keywords, people, reflections, or quotes..."
                className="w-full bg-transparent outline-none text-charcoal text-sm placeholder:text-taupe/60"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Journal Filter */}
              <select
                value={selectedJournal}
                onChange={(e) => setSelectedJournal(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal outline-none"
              >
                <option value="">All Journals</option>
                {journals.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>

              {/* Mood Filter */}
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal outline-none capitalize"
              >
                <option value="">Any Mood</option>
                <option value="peaceful">Peaceful</option>
                <option value="joyful">Joyful</option>
                <option value="contemplative">Contemplative</option>
                <option value="anxious">Anxious</option>
                <option value="energetic">Energetic</option>
                <option value="grateful">Grateful</option>
              </select>

              {/* Has Photos Toggle */}
              <button
                type="button"
                onClick={() => setHasPhotosOnly(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  hasPhotosOnly
                    ? 'bg-beige/60 border-taupe text-espresso font-medium'
                    : 'bg-ivory/40 border-subtle-border text-taupe hover:text-charcoal'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>With Photos</span>
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {searching ? (
              <div className="text-center py-12 text-taupe text-xs">Searching diary archives...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 bg-paper rounded-2xl border border-subtle-border text-taupe text-xs">
                No matching journal entries found. Try adjusting your search keywords.
              </div>
            ) : (
              searchResults.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => openEntryById(entry.id)}
                  className="p-5 rounded-2xl bg-paper hover:bg-paper/90 border border-subtle-border shadow-subtle hover:shadow-md cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between text-xs font-sans text-taupe mb-2">
                    <span className="font-semibold text-espresso">
                      {entry.date} · {entry.weekday}
                    </span>
                    <div className="flex items-center gap-2">
                      {entry.photos?.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-brown">
                          <ImageIcon className="w-3 h-3" />
                          <span>{entry.photos.length}</span>
                        </span>
                      )}
                      {entry.mood && (
                        <span className="capitalize px-2 py-0.5 rounded-full bg-sage/50 text-sage-dark text-[10px] font-medium">
                          {entry.mood}
                        </span>
                      )}
                    </div>
                  </div>

                  {entry.title && (
                    <h3 className="font-serif text-lg font-medium text-espresso group-hover:text-muted-brown transition-colors">
                      {entry.title}
                    </h3>
                  )}

                  {entry.quote_of_day && (
                    <p className="font-serif italic text-xs text-muted-brown mt-0.5">
                      "{entry.quote_of_day}"
                    </p>
                  )}

                  <p className="font-handwriting text-xl text-charcoal/80 line-clamp-2 mt-2 leading-snug">
                    {entry.content?.replace(/<[^>]*>/g, '')}
                  </p>

                  <div className="mt-3 pt-2 border-t border-subtle-border/50 flex items-center justify-between text-[11px] font-sans text-taupe">
                    <span>{entry.journal_title || 'Journal'}</span>
                    <span className="text-muted-brown group-hover:translate-x-1 transition-transform">
                      Open in Diary →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
