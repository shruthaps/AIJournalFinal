import React, { useState, useEffect } from 'react';
import { useJournal } from '../../context/JournalContext';
import { apiRequest } from '../../api/client';
import PolaroidPhoto from '../common/PolaroidPhoto';
import Sticker from '../common/Sticker';
import WashiTape from '../common/WashiTape';
import { playPageFlipSound } from '../common/AudioFeedback';
import DiaryEditor from '../editor/DiaryEditor';
import {
  ChevronLeft,
  ChevronRight,
  PenLine,
  Bookmark,
  Calendar,
  Trash2,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  BookOpen
} from 'lucide-react';

export default function DiaryReader() {
  const {
    entries,
    currentEntry,
    setCurrentEntry,
    refreshEntries,
    refreshCalendar,
    editorMode,
    setEditorMode,
    openNewEntry,
    openCompanionWithMode
  } = useJournal();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [turningDirection, setTurningDirection] = useState(null); // 'left' or 'right'
  const [spreadIndex, setSpreadIndex] = useState(0); // For multi-page entries (Spread 0 = pages 1-2, Spread 1 = pages 3-4...)

  // Reset spread index when current entry changes
  useEffect(() => {
    setSpreadIndex(0);
  }, [currentEntry?.id]);

  // Keyboard navigation: Left/Right arrows to turn pages
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editorMode === 'write' || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entries, currentEntry, editorMode, spreadIndex]);

  // Find current index in entries list
  const currentIndex = entries.findIndex(e => e.id === currentEntry?.id);
  const hasPreviousEntry = currentIndex < entries.length - 1;
  const hasNextEntry = currentIndex > 0;

  // Pagination Engine for this entry:
  // Split content by paragraphs or double newlines
  const rawParagraphs = (currentEntry?.content || '')
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0);

  // Group paragraphs into spreads (each spread has a Left and Right page)
  // Spread 0: Left page has Header + Photos + up to 2 paragraphs; Right page has up to 3 paragraphs.
  // Subsequent Spreads: Left page has up to 3 paragraphs, Right page has up to 3 paragraphs.
  const pages = [];
  if (rawParagraphs.length === 0) {
    pages.push(['A quiet, unwritten page...']);
  } else {
    // Page 1 (with header & photo): max 2 paragraphs
    const page1 = rawParagraphs.slice(0, 2);
    pages.push(page1);

    // Remaining paragraphs distributed 2-3 per page to guarantee comfortable reading & zero overlap
    let remaining = rawParagraphs.slice(2);
    while (remaining.length > 0) {
      pages.push(remaining.slice(0, 3));
      remaining = remaining.slice(3);
    }
  }

  // Group pages into spreads (each spread has [leftPage, rightPage])
  const totalPages = Math.max(2, pages.length % 2 === 0 ? pages.length : pages.length + 1);
  const totalSpreads = Math.ceil(totalPages / 2);

  const leftPageIndex = spreadIndex * 2;
  const rightPageIndex = spreadIndex * 2 + 1;

  const leftPageContent = pages[leftPageIndex] || [];
  const rightPageContent = pages[rightPageIndex] || [];

  const canGoPrevSpread = spreadIndex > 0;
  const canGoNextSpread = spreadIndex < totalSpreads - 1;

  const goToPrevious = () => {
    if (canGoPrevSpread) {
      triggerPageTurn('left', () => setSpreadIndex(prev => prev - 1));
    } else if (hasPreviousEntry) {
      triggerPageTurn('left', () => {
        setCurrentEntry(entries[currentIndex + 1]);
        setSpreadIndex(0);
      });
    }
  };

  const goToNext = () => {
    if (canGoNextSpread) {
      triggerPageTurn('right', () => setSpreadIndex(prev => prev + 1));
    } else if (hasNextEntry) {
      triggerPageTurn('right', () => {
        setCurrentEntry(entries[currentIndex - 1]);
        setSpreadIndex(0);
      });
    }
  };

  const triggerPageTurn = (dir, callback) => {
    if (soundEnabled) {
      playPageFlipSound();
    }
    setTurningDirection(dir);
    setTimeout(() => {
      callback();
      setTurningDirection(null);
    }, 180);
  };

  const handleToggleBookmark = async () => {
    if (!currentEntry?.id) return;
    try {
      const res = await apiRequest(`/entries/${currentEntry.id}/bookmark`, { method: 'POST' });
      setCurrentEntry(prev => ({ ...prev, is_bookmarked: res.is_bookmarked }));
      refreshEntries();
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleDeleteEntry = async () => {
    if (!currentEntry?.id) return;
    if (!window.confirm('Are you sure you wish to tear out and delete this diary entry? This cannot be undone.')) {
      return;
    }

    try {
      await apiRequest(`/entries/${currentEntry.id}`, { method: 'DELETE' });
      await refreshEntries();
      await refreshCalendar();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // If in write mode, render the DiaryEditor
  if (editorMode === 'write') {
    return <DiaryEditor />;
  }

  // Empty state if journal has no entries yet
  if (!currentEntry && entries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-paper shadow-book mx-auto flex items-center justify-center text-taupe mb-6 border border-subtle-border">
          <PenLine className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl text-espresso font-semibold">An Unwritten Page Awaits</h2>
        <p className="font-sans text-xs sm:text-sm text-charcoal/70 max-w-md mx-auto mt-2 leading-relaxed">
          Your diary is open and quiet. Write your first thought, preserve a photograph, or reflect on your day.
        </p>
        <button
          onClick={openNewEntry}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-espresso text-paper font-sans text-sm font-medium rounded-xl hover:bg-charcoal shadow-sm transition-all"
        >
          <PenLine className="w-4 h-4" />
          <span>Write First Entry</span>
        </button>
      </div>
    );
  }

  if (!currentEntry) return null;

  const photos = currentEntry.photos || [];
  const stickers = currentEntry.stickers || [];

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-6 py-6 md:py-10 animate-in fade-in">
      
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-2 mb-6 px-2">
        
        {/* Navigation Indicator & Jump */}
        <div className="flex items-center gap-2 text-xs font-sans text-taupe">
          <span className="font-medium text-espresso">
            {currentIndex >= 0 ? `Entry ${entries.length - currentIndex} of ${entries.length}` : 'New Entry'}
          </span>
          <span>·</span>
          <span className="font-mono text-[11px]">{currentEntry.date}</span>
          {totalSpreads > 1 && (
            <>
              <span>·</span>
              <span className="text-muted-brown font-medium">
                Pages {leftPageIndex + 1}–{rightPageIndex + 1} of {totalPages}
              </span>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-1.5 text-taupe hover:text-charcoal rounded-md hover:bg-beige/40 transition-colors"
            title={soundEnabled ? 'Mute page turning sound' : 'Enable page turning sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-md hover:bg-beige/40 transition-colors ${
              currentEntry.is_bookmarked ? 'text-dusty-rose-dark' : 'text-taupe hover:text-charcoal'
            }`}
            title="Bookmark entry"
          >
            <Bookmark className={`w-4 h-4 ${currentEntry.is_bookmarked ? 'fill-dusty-rose' : ''}`} />
          </button>

          <button
            onClick={handleDeleteEntry}
            className="p-1.5 text-taupe hover:text-red-700 rounded-md hover:bg-red-50 transition-colors"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Write / Edit Toggle */}
          <button
            onClick={() => setEditorMode('write')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-paper hover:bg-beige/50 text-espresso border border-subtle-border rounded-lg text-xs font-sans font-medium shadow-subtle transition-all"
            title="Edit this entry"
          >
            <PenLine className="w-3.5 h-3.5 text-muted-brown" />
            <span>Edit Entry</span>
          </button>

        </div>
      </div>

      {/* Realistic Two-Page Open Book Spread Container */}
      <div className={`relative bg-paper rounded-2xl shadow-book border border-subtle-border overflow-hidden transition-all duration-300 ${
        turningDirection ? 'opacity-70 scale-[0.99]' : 'opacity-100 scale-100'
      }`}>

        {/* Book Spine Center Line on Desktop */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-subtle-border book-center-crease z-20 pointer-events-none" />

        {/* The Two Pages Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* LEFT PAGE */}
          <div
            onClick={(e) => {
              if (e.clientX < 120 && (canGoPrevSpread || hasPreviousEntry)) goToPrevious();
            }}
            className="paper-texture book-spine-left relative p-6 sm:p-10 md:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-subtle-border min-h-[580px]"
          >
            <div>
              {/* Only show Date and Title header on Spread 0 (First spread) */}
              {spreadIndex === 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs font-sans tracking-widest text-taupe uppercase mb-3">
                    <span className="font-semibold text-espresso">
                      {currentEntry.date.split('-')[1]}·{currentEntry.date.split('-')[2]} · {currentEntry.weekday}
                    </span>
                    {currentEntry.weather && (
                      <span className="text-[11px] text-taupe">{currentEntry.weather}</span>
                    )}
                  </div>

                  {currentEntry.title && (
                    <h1 className="font-serif text-2xl sm:text-3xl text-espresso font-semibold leading-tight mb-2">
                      {currentEntry.title}
                    </h1>
                  )}

                  {currentEntry.quote_of_day && (
                    <div className="font-serif italic text-lg sm:text-xl text-muted-brown mb-5">
                      "{currentEntry.quote_of_day}"
                    </div>
                  )}

                  {/* Photographs on First Page */}
                  {photos.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-4 my-3">
                      {photos.map(p => (
                        <PolaroidPhoto key={p.id} photo={p} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between text-xs font-sans tracking-widest text-taupe uppercase mb-6 pb-2 border-b border-subtle-border/60">
                  <span className="font-serif italic text-espresso">
                    {currentEntry.title || 'Continuation'}
                  </span>
                  <span>PAGE {leftPageIndex + 1}</span>
                </div>
              )}

              {/* Handwritten text on ruled lines */}
              <div className="notebook-ruled font-handwriting text-2xl sm:text-3xl text-espresso leading-[32px] space-y-4 pt-1">
                {leftPageContent.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>

            {/* Left Page Stickers */}
            {stickers.filter(s => (s.x || 50) <= 50).map(s => (
              <Sticker key={s.id} sticker={s} />
            ))}

            {/* Left Page Footer */}
            <div className="pt-6 flex items-center justify-between text-[11px] font-sans text-taupe">
              <span className="tracking-wider uppercase">
                {currentEntry.location || 'DEARLY JOURNAL'}
              </span>
              <span>
                {currentEntry.mood && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sage/50 text-sage-dark capitalize font-medium">
                    {currentEntry.mood}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* RIGHT PAGE */}
          <div
            onClick={(e) => {
              if (window.innerWidth - e.clientX < 120 && (canGoNextSpread || hasNextEntry)) goToNext();
            }}
            className="paper-texture book-spine-right relative p-6 sm:p-10 md:p-12 flex flex-col justify-between min-h-[580px]"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-sans tracking-widest text-taupe uppercase mb-6 pb-2 border-b border-subtle-border/60">
                <span>MEMOIR & REFLECTION</span>
                <span>PAGE {rightPageIndex + 1}</span>
              </div>

              {/* Right Page Continuation */}
              <div className="notebook-ruled font-handwriting text-2xl sm:text-3xl text-espresso leading-[32px] space-y-4">
                {rightPageContent.length > 0 ? (
                  rightPageContent.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))
                ) : (
                  <div className="pt-6 space-y-6">
                    <p className="text-espresso/90">
                      Quiet reflection allows today's emotions to settle like calm water.
                    </p>
                    <div className="p-4 rounded-xl bg-beige/30 border border-subtle-border/70 text-base font-sans text-charcoal/80 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-brown uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-dusty-rose-dark" />
                        <span>Companion Reflection Prompt</span>
                      </div>
                      <p className="font-serif italic text-lg text-espresso">
                        "What is one lesson from today you want to preserve for your future self?"
                      </p>
                      <button
                        onClick={() => openCompanionWithMode('remind_who_i_am')}
                        className="text-xs text-muted-brown hover:text-espresso font-medium inline-flex items-center gap-1 pt-1"
                      >
                        Ask AI Companion about this →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Page Stickers */}
            {stickers.filter(s => (s.x || 50) > 50).map(s => (
              <Sticker key={s.id} sticker={s} />
            ))}

            {/* Right Page Footer */}
            <div className="pt-6 flex items-center justify-between text-[11px] font-sans text-taupe">
              <span>{currentEntry.word_count || 0} WORDS</span>
              <WashiTape variant="rose" rotation={2} className="w-16" />
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Page Navigation Controls */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        
        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          disabled={!canGoPrevSpread && !hasPreviousEntry}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-sans font-medium transition-all ${
            canGoPrevSpread || hasPreviousEntry
              ? 'bg-paper text-espresso border border-subtle-border shadow-subtle hover:bg-beige/40'
              : 'text-taupe/40 cursor-not-allowed'
          }`}
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{canGoPrevSpread ? 'Previous Page' : 'Previous Entry'}</span>
        </button>

        {/* Multi-page Spread indicator if entry spans multiple spreads */}
        {totalSpreads > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-beige/40 border border-subtle-border text-xs font-sans text-muted-brown font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Spread {spreadIndex + 1} of {totalSpreads}</span>
          </div>
        )}

        <button
          onClick={openNewEntry}
          className="px-4 py-2 bg-muted-brown text-paper hover:bg-espresso rounded-xl text-xs font-sans font-medium shadow-sm transition-all flex items-center gap-1.5"
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>Write Today</span>
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          disabled={!canGoNextSpread && !hasNextEntry}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-sans font-medium transition-all ${
            canGoNextSpread || hasNextEntry
              ? 'bg-paper text-espresso border border-subtle-border shadow-subtle hover:bg-beige/40'
              : 'text-taupe/40 cursor-not-allowed'
          }`}
          title="Next Page (Right Arrow)"
        >
          <span>{canGoNextSpread ? 'Next Page' : 'Next Entry'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
