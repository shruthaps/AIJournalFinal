import React, { useState } from 'react';
import { apiRequest } from '../../api/client';
import { useJournal } from '../../context/JournalContext';
import { X, Book, Feather, Sparkles, Star } from 'lucide-react';

export default function NewJournalModal({ isOpen, onClose }) {
  const { refreshJournals, setCurrentJournal, setActiveView } = useJournal();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState('#756558');
  const [coverTexture, setCoverTexture] = useState('linen');
  const [coverIcon, setCoverIcon] = useState('book');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const COLOR_PALETTE = [
    { label: 'Espresso', hex: '#756558' },
    { label: 'Deep Olive', hex: '#636b5a' },
    { label: 'Muted Sage', hex: '#8A9A86' },
    { label: 'Dusty Rose', hex: '#B88E8B' },
    { label: 'Midnight Slate', hex: '#4A5568' },
    { label: 'Warm Ochre', hex: '#A87D56' },
    { label: 'Vintage Wine', hex: '#6F4E56' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const created = await apiRequest('/journals', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          cover_color: coverColor,
          cover_texture: coverTexture,
          cover_icon: coverIcon
        })
      });

      await refreshJournals();
      setCurrentJournal(created);
      setActiveView('reader');
      onClose();
    } catch (err) {
      setError(err.message || 'Could not create journal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/30 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-paper rounded-2xl shadow-book border border-subtle-border p-6 sm:p-8 paper-texture">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-taupe hover:text-espresso rounded-full hover:bg-beige/40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <h2 className="font-serif text-2xl text-espresso font-semibold">Bind a New Journal</h2>
          <p className="font-sans text-xs text-charcoal/70 mt-1">
            Create a dedicated book for travel, creative writing, health, or personal reflections.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          
          <div>
            <label className="block font-medium text-charcoal mb-1">Journal Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Creative Sparks & Short Stories"
              className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border focus:border-taupe focus:bg-paper transition-all text-sm outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-charcoal mb-1">Description / Inscription</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A few words to set the intention for this journal..."
              className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border focus:border-taupe focus:bg-paper transition-all text-xs outline-none resize-none"
            />
          </div>

          {/* Cover Color Selection */}
          <div>
            <label className="block font-medium text-charcoal mb-2">Cover Color</label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PALETTE.map(c => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => setCoverColor(c.hex)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    coverColor === c.hex ? 'border-espresso scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Cover Texture Selection */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-medium text-charcoal mb-1">Cover Texture</label>
              <select
                value={coverTexture}
                onChange={(e) => setCoverTexture(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/50 border border-subtle-border text-xs text-charcoal outline-none"
              >
                <option value="linen">Fine Bookcloth Linen</option>
                <option value="leather">Embossed Soft Leather</option>
                <option value="paper">Handmade Heavy Paper</option>
                <option value="craft">Natural Craft Fiber</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-charcoal mb-1">Spine Foil Stamp</label>
              <select
                value={coverIcon}
                onChange={(e) => setCoverIcon(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/50 border border-subtle-border text-xs text-charcoal outline-none"
              >
                <option value="book">Classic Book</option>
                <option value="feather">Delicate Feather</option>
                <option value="botanical">Botanical Branch</option>
                <option value="star">Celestial Star</option>
              </select>
            </div>
          </div>

          {/* Live Mini Preview of Cover */}
          <div className="pt-2 flex justify-center">
            <div
              className="w-40 h-52 rounded-r-lg shadow-book flex flex-col justify-between p-4 relative overflow-hidden transition-all"
              style={{ backgroundColor: coverColor }}
            >
              {/* Left Spine Shadow */}
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20" />
              <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />

              <div className="pl-2 pt-2">
                <span className="text-[10px] text-paper/70 font-sans tracking-widest uppercase">
                  DEARLY
                </span>
                <h4 className="font-serif text-paper text-sm font-medium mt-1 leading-tight line-clamp-3">
                  {title || 'Untitled Journal'}
                </h4>
              </div>

              <div className="pl-2 pb-1 flex justify-between items-end text-paper/60">
                <Feather className="w-4 h-4" />
                <span className="text-[9px] tracking-wider uppercase font-sans">
                  {coverTexture}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 py-2.5 rounded-xl bg-espresso text-paper font-medium text-sm hover:bg-charcoal shadow-sm transition-all"
          >
            {submitting ? 'Creating Journal...' : 'Place on Bookshelf'}
          </button>

        </form>

      </div>
    </div>
  );
}
