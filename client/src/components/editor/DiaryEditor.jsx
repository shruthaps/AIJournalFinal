import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useJournal } from '../../context/JournalContext';
import { apiRequest } from '../../api/client';
import PolaroidPhoto from '../common/PolaroidPhoto';
import Sticker from '../common/Sticker';
import {
  Save,
  Check,
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Smile,
  Type,
  AlignLeft,
  Calendar,
  MapPin,
  CloudSun,
  Plus,
  Trash2,
  Sparkles,
  Bold,
  Italic,
  Underline,
  List,
  Quote,
  Palette
} from 'lucide-react';

export default function DiaryEditor() {
  const {
    currentEntry,
    setCurrentEntry,
    refreshEntries,
    refreshCalendar,
    setEditorMode,
    currentJournal
  } = useJournal();

  // Form states initialized from currentEntry
  const [title, setTitle] = useState(currentEntry?.title || '');
  const [quoteOfDay, setQuoteOfDay] = useState(currentEntry?.quote_of_day || '');
  const [content, setContent] = useState(currentEntry?.content || '');
  const [date, setDate] = useState(currentEntry?.date || new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState(currentEntry?.mood || 'peaceful');
  const [weather, setWeather] = useState(currentEntry?.weather || '');
  const [location, setLocation] = useState(currentEntry?.location || '');
  const [paperTheme, setPaperTheme] = useState(currentEntry?.paper_theme || 'cream');
  const [fontStyle, setFontStyle] = useState(currentEntry?.font_style || 'caveat');
  const [fontSize, setFontSize] = useState(currentEntry?.font_size || 'text-2xl');
  const [fontColor, setFontColor] = useState('#332C27');
  const [ruledLines, setRuledLines] = useState(currentEntry?.ruled_lines ?? 1);
  const [photos, setPhotos] = useState(currentEntry?.photos || []);
  const [stickers, setStickers] = useState(currentEntry?.stickers || []);

  // Save status states
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error'
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // New photo modal state
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoFrame, setNewPhotoFrame] = useState('polaroid');
  const [newPhotoRotation, setNewPhotoRotation] = useState(-2);
  const [newPhotoWidth, setNewPhotoWidth] = useState(260);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Debounced auto-save timer
  const autoSaveTimerRef = useRef(null);
  const isFirstRender = useRef(true);

  // Warn before leaving if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Perform Save
  const performSave = useCallback(async () => {
    if (!currentJournal?.id) return;
    setSaveStatus('saving');

    const payload = {
      journal_id: currentJournal.id,
      date,
      title,
      quote_of_day: quoteOfDay,
      content,
      mood,
      weather,
      location,
      paper_theme: paperTheme,
      font_style: fontStyle,
      font_size: fontSize,
      ruled_lines: ruledLines ? 1 : 0,
      photos,
      stickers
    };

    try {
      if (currentEntry?.id) {
        const updated = await apiRequest(`/entries/${currentEntry.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setCurrentEntry(updated);
      } else {
        const created = await apiRequest('/entries', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setCurrentEntry(created);
      }

      setSaveStatus('saved');
      refreshEntries();
      refreshCalendar();
    } catch (err) {
      console.error('Autosave error:', err);
      setSaveStatus('error');
    }
  }, [
    currentJournal?.id,
    currentEntry?.id,
    date,
    title,
    quoteOfDay,
    content,
    mood,
    weather,
    location,
    paperTheme,
    fontStyle,
    fontSize,
    ruledLines,
    photos,
    stickers,
    setCurrentEntry,
    refreshEntries,
    refreshCalendar
  ]);

  // Debounce trigger on change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('unsaved');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [
    title,
    quoteOfDay,
    content,
    date,
    mood,
    weather,
    location,
    paperTheme,
    fontStyle,
    fontSize,
    ruledLines,
    photos,
    stickers,
    performSave
  ]);

  // Text formatting insertion helper
  const insertFormatting = (prefix, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 4));
    }, 50);
  };

  // Image File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await apiRequest('/upload', {
        method: 'POST',
        body: formData
      });
      setNewPhotoUrl(res.url);
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl) return;
    const photo = {
      id: `photo-${Date.now()}`,
      url: newPhotoUrl,
      caption: newPhotoCaption,
      frameStyle: newPhotoFrame,
      rotation: Number(newPhotoRotation),
      width: Number(newPhotoWidth)
    };
    setPhotos(prev => [...prev, photo]);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setIsPhotoModalOpen(false);
  };

  const handleRemovePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // Sticker Add Handler
  const handleAddSticker = (type, variant = 'craft') => {
    const newSticker = {
      id: `stk-${Date.now()}`,
      type,
      variant,
      x: Math.floor(Math.random() * 60) + 20,
      y: Math.floor(Math.random() * 60) + 20,
      rotation: Math.floor(Math.random() * 20) - 10,
      scale: 1
    };
    setStickers(prev => [...prev, newSticker]);
    setIsStickerDrawerOpen(false);
  };

  const handleRemoveSticker = (stkId) => {
    setStickers(prev => prev.filter(s => s.id !== stkId));
  };

  const MOODS = [
    { value: 'peaceful', label: 'Peaceful', color: 'bg-sage/60 text-sage-dark' },
    { value: 'joyful', label: 'Joyful', color: 'bg-butter/60 text-butter-dark' },
    { value: 'contemplative', label: 'Contemplative', color: 'bg-beige text-muted-brown' },
    { value: 'anxious', label: 'Anxious', color: 'bg-amber-100 text-amber-800' },
    { value: 'energetic', label: 'Energetic', color: 'bg-orange-100 text-orange-800' },
    { value: 'grateful', label: 'Grateful', color: 'bg-dusty-rose/60 text-dusty-rose-dark' },
  ];

  const FONT_COLORS = [
    { label: 'Deep Espresso', hex: '#332C27' },
    { label: 'Soft Charcoal', hex: '#49433E' },
    { label: 'Warm Sepia', hex: '#756558' },
    { label: 'Dusty Rose', hex: '#9A6865' },
    { label: 'Vintage Navy', hex: '#3B4856' }
  ];

  const getFontFamilyClass = () => {
    switch (fontStyle) {
      case 'patrick': return 'font-patrick';
      case 'cormorant': return 'font-serif';
      case 'inter': return 'font-sans';
      case 'caveat':
      default: return 'font-handwriting';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 animate-in fade-in">
      
      {/* Top Action & Auto-Save Feedback Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-paper p-3.5 rounded-xl border border-subtle-border shadow-subtle">
        
        {/* Autosave Indicator */}
        <div className="flex items-center gap-2 text-xs font-sans">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-muted-brown">
              <span className="w-2 h-2 rounded-full bg-muted-brown animate-pulse" />
              <span>Saving thoughts...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-sage-dark font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>All changes saved</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="flex items-center gap-1.5 text-taupe">
              <span className="w-2 h-2 rounded-full bg-taupe" />
              <span>Unsaved changes...</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-red-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Unable to save. Retry</span>
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Text Formatting Shortcuts */}
          <div className="hidden sm:flex items-center gap-1 pr-2 border-r border-subtle-border">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 rounded hover:bg-beige/40 text-charcoal"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className="p-1.5 rounded hover:bg-beige/40 text-charcoal"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('<u>', '</u>')}
              className="p-1.5 rounded hover:bg-beige/40 text-charcoal"
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('• ')}
              className="p-1.5 rounded hover:bg-beige/40 text-charcoal"
              title="Bullet"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('> ')}
              className="p-1.5 rounded hover:bg-beige/40 text-charcoal"
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Photograph */}
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-paper hover:bg-beige/40 text-charcoal border border-subtle-border rounded-lg text-xs font-sans transition-all"
            title="Insert Photograph"
          >
            <ImageIcon className="w-3.5 h-3.5 text-muted-brown" />
            <span>Add Photo</span>
          </button>

          {/* Add Sticker */}
          <button
            onClick={() => setIsStickerDrawerOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-paper hover:bg-beige/40 text-charcoal border border-subtle-border rounded-lg text-xs font-sans transition-all"
            title="Decorate with Stickers"
          >
            <Smile className="w-3.5 h-3.5 text-dusty-rose-dark" />
            <span>Stickers</span>
          </button>

          {/* Toggle Ruled Lines */}
          <button
            onClick={() => setRuledLines(prev => (prev ? 0 : 1))}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-sans border transition-all ${
              ruledLines
                ? 'bg-beige/60 text-espresso border-taupe/40 font-medium'
                : 'bg-paper text-taupe border-subtle-border'
            }`}
            title="Toggle notebook ruled lines"
          >
            Ruled Lines
          </button>

          {/* View in Diary Reader */}
          <button
            onClick={async () => {
              await performSave();
              setEditorMode('read');
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-espresso text-paper hover:bg-charcoal rounded-lg text-xs font-sans font-medium shadow-sm transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Done Writing</span>
          </button>

        </div>
      </div>

      {/* Editor Main Canvas Sheet */}
      <div className="bg-paper paper-texture rounded-2xl shadow-book border border-subtle-border p-6 sm:p-10 md:p-12 relative overflow-hidden">
        
        {/* Metadata Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 pb-6 mb-6 border-b border-subtle-border text-xs font-sans">
          
          {/* Date Picker */}
          <div>
            <label className="block text-taupe text-[10px] uppercase tracking-wider mb-1">
              Date & Day
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal outline-none focus:border-taupe"
            />
          </div>

          {/* Mood Selector */}
          <div>
            <label className="block text-taupe text-[10px] uppercase tracking-wider mb-1">
              Today's Mood
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal outline-none focus:border-taupe capitalize"
            >
              {MOODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Handwriting Font Selector */}
          <div>
            <label className="block text-taupe text-[10px] uppercase tracking-wider mb-1">
              Font Style
            </label>
            <select
              value={fontStyle}
              onChange={(e) => setFontStyle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/60 border border-subtle-border text-xs text-charcoal outline-none focus:border-taupe"
            >
              <option value="caveat">Caveat (Curvy Script)</option>
              <option value="patrick">Patrick Hand (Casual)</option>
              <option value="cormorant">Cormorant (Serif)</option>
              <option value="inter">Inter (Sans)</option>
            </select>
          </div>

          {/* Ink Color Selector */}
          <div>
            <label className="block text-taupe text-[10px] uppercase tracking-wider mb-1">
              Ink Tone
            </label>
            <div className="flex items-center gap-1.5 py-1">
              {FONT_COLORS.map(c => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setFontColor(c.hex)}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    fontColor === c.hex ? 'border-espresso scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Location & Weather Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs font-sans">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ivory/40 border border-subtle-border">
            <MapPin className="w-3.5 h-3.5 text-taupe flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g. Balcony nook, Coffee shop)"
              className="bg-transparent text-charcoal text-xs outline-none w-full placeholder:text-taupe/60"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ivory/40 border border-subtle-border">
            <CloudSun className="w-3.5 h-3.5 text-taupe flex-shrink-0" />
            <input
              type="text"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="Weather (e.g. Crisp autumn sun, 18°C)"
              className="bg-transparent text-charcoal text-xs outline-none w-full placeholder:text-taupe/60"
            />
          </div>
        </div>

        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry Title..."
          className="w-full font-serif text-3xl sm:text-4xl text-espresso font-semibold bg-transparent border-none outline-none placeholder:text-taupe/50 mb-3"
        />

        {/* Subtitle / Quote of the Day */}
        <input
          type="text"
          value={quoteOfDay}
          onChange={(e) => setQuoteOfDay(e.target.value)}
          placeholder="A quiet quote or thought for the day (e.g. 'Enjoy the day')..."
          className="w-full font-serif italic text-lg sm:text-xl text-muted-brown bg-transparent border-none outline-none placeholder:text-taupe/40 mb-6"
        />

        {/* Photographs Gallery */}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-6 my-6 p-4 rounded-xl bg-beige/20 border border-subtle-border">
            {photos.map(p => (
              <PolaroidPhoto
                key={p.id}
                photo={p}
                editable
                onRemove={handleRemovePhoto}
              />
            ))}
          </div>
        )}

        {/* Main Journal Writing Area */}
        <div className={`relative min-h-[400px] ${ruledLines ? 'notebook-ruled' : ''}`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ color: fontColor }}
            placeholder="Write your heart out. What made today meaningful? What challenged you?..."
            className={`w-full h-full min-h-[400px] bg-transparent border-none outline-none leading-[32px] resize-y ${getFontFamilyClass()} text-2xl sm:text-3xl placeholder:text-taupe/40`}
          />

          {/* Render Stickers on Canvas Sheet */}
          {stickers.map(s => (
            <Sticker
              key={s.id}
              sticker={s}
              editable
              onRemove={handleRemoveSticker}
            />
          ))}
        </div>

      </div>

      {/* Insert Photograph Modal with Sizing Controls */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/30 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-paper rounded-2xl shadow-book border border-subtle-border p-6 paper-texture space-y-4 text-xs font-sans">
            <h3 className="font-serif text-xl text-espresso font-semibold">Preserve a Photograph</h3>
            
            {/* File Upload Button */}
            <div>
              <label className="block font-medium text-charcoal mb-1">Upload from Device</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-charcoal file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-muted-brown file:text-paper hover:file:bg-espresso cursor-pointer"
              />
              {uploadingImage && <p className="text-muted-brown mt-1">Uploading...</p>}
            </div>

            <div className="text-center text-taupe uppercase text-[10px] tracking-wider">— OR IMAGE URL —</div>

            <div>
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-charcoal mb-1">Handwritten Caption</label>
              <input
                type="text"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder="e.g. Sunset over the lake"
                className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border text-xs outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-charcoal mb-1">Frame Style</label>
                <select
                  value={newPhotoFrame}
                  onChange={(e) => setNewPhotoFrame(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/50 border border-subtle-border text-xs outline-none"
                >
                  <option value="polaroid">Classic Polaroid</option>
                  <option value="tape">Washi Tape Edge</option>
                  <option value="minimal">Minimal Borderless</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-charcoal mb-1">Photo Width: {newPhotoWidth}px</label>
                <input
                  type="range"
                  min="180"
                  max="380"
                  step="20"
                  value={newPhotoWidth}
                  onChange={(e) => setNewPhotoWidth(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-subtle-border text-charcoal hover:bg-beige/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPhoto}
                disabled={!newPhotoUrl}
                className="px-4 py-1.5 rounded-lg bg-espresso text-paper font-medium hover:bg-charcoal disabled:opacity-50"
              >
                Place on Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrapbook Sticker Tray Drawer */}
      {isStickerDrawerOpen && (
        <div className="fixed bottom-6 right-6 z-40 bg-paper rounded-2xl shadow-book border border-subtle-border p-4 w-72 paper-texture animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-subtle-border">
            <span className="font-serif text-sm font-medium text-espresso">Select Sticker</span>
            <button
              onClick={() => setIsStickerDrawerOpen(false)}
              className="text-taupe hover:text-espresso text-xs"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleAddSticker('botanical')}
              className="p-3 rounded-xl bg-ivory/50 hover:bg-beige/40 flex flex-col items-center gap-1 border border-subtle-border"
            >
              <span className="text-xl">🌿</span>
              <span className="text-[10px] text-charcoal">Botanical</span>
            </button>

            <button
              onClick={() => handleAddSticker('star')}
              className="p-3 rounded-xl bg-ivory/50 hover:bg-beige/40 flex flex-col items-center gap-1 border border-subtle-border"
            >
              <span className="text-xl">⭐</span>
              <span className="text-[10px] text-charcoal">Gold Star</span>
            </button>

            <button
              onClick={() => handleAddSticker('heart')}
              className="p-3 rounded-xl bg-ivory/50 hover:bg-beige/40 flex flex-col items-center gap-1 border border-subtle-border"
            >
              <span className="text-xl">🌸</span>
              <span className="text-[10px] text-charcoal">Rose Heart</span>
            </button>

            <button
              onClick={() => handleAddSticker('paperclip')}
              className="p-3 rounded-xl bg-ivory/50 hover:bg-beige/40 flex flex-col items-center gap-1 border border-subtle-border"
            >
              <span className="text-xl">📎</span>
              <span className="text-[10px] text-charcoal">Paperclip</span>
            </button>

            <button
              onClick={() => handleAddSticker('tape', 'sage')}
              className="p-3 rounded-xl bg-ivory/50 hover:bg-beige/40 flex flex-col items-center gap-1 border border-subtle-border"
            >
              <span className="w-8 h-2 bg-sage rounded-sm" />
              <span className="text-[10px] text-charcoal">Sage Tape</span>
            </button>

            <button
              onClick={() => handleAddSticker('tape', 'rose')}
              className="p-3 rounded-xl bg-ivory/50 hover:bg-beige/40 flex flex-col items-center gap-1 border border-subtle-border"
            >
              <span className="w-8 h-2 bg-dusty-rose rounded-sm" />
              <span className="text-[10px] text-charcoal">Rose Tape</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
