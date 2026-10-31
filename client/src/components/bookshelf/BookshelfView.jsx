import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import NewJournalModal from './NewJournalModal';
import { Plus, Book, Feather, Star, Sparkles, Clock, Calendar } from 'lucide-react';

export default function BookshelfView() {
  const { journals, setCurrentJournal, setActiveView } = useJournal();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const handleSelectJournal = (journal) => {
    setCurrentJournal(journal);
    setActiveView('reader');
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'feather': return <Feather className="w-5 h-5" />;
      case 'star': return <Star className="w-5 h-5" />;
      case 'botanical':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L12 22" strokeLinecap="round" />
            <path d="M12 7C9.5 5 6 6 6 8.5C6 11 12 13 12 13" strokeLinecap="round" />
            <path d="M12 11C14.5 9 18 10 18 12.5C18 15 12 17 12 17" strokeLinecap="round" />
          </svg>
        );
      case 'book':
      default:
        return <Book className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 animate-in fade-in">
      
      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-subtle-border">
        <div>
          <span className="text-xs font-sans tracking-widest text-taupe uppercase font-semibold">
            YOUR COLLECTION
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-espresso font-semibold mt-1">
            Personal Bookshelf
          </h1>
          <p className="font-sans text-xs sm:text-sm text-charcoal/70 mt-1">
            Each journal is a distinct volume of your experiences, reflections, and evolving thoughts.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-muted-brown text-paper hover:bg-espresso rounded-xl text-xs sm:text-sm font-sans font-medium shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal</span>
        </button>
      </div>

      {/* Bookshelf Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {journals.map(journal => (
          <div
            key={journal.id}
            onClick={() => handleSelectJournal(journal)}
            className="group cursor-pointer flex flex-col justify-between p-6 bg-paper rounded-2xl border border-subtle-border shadow-subtle hover:shadow-book transition-all duration-300 hover:-translate-y-1"
          >
            {/* Physical Journal Cover Representation */}
            <div className="flex justify-center mb-6">
              <div
                className="w-44 h-60 rounded-r-xl shadow-book flex flex-col justify-between p-5 relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: journal.cover_color || '#756558' }}
              >
                {/* Left Spine Groove */}
                <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-black/25" />
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-white/15" />
                <div className="absolute left-4 top-0 bottom-0 w-1 bg-black/10" />

                {/* Top Gold Foil Branding */}
                <div className="pl-3 pt-2">
                  <div className="text-[9px] tracking-widest uppercase font-sans text-paper/70 font-semibold">
                    DEARLY VOLUME
                  </div>
                  <h3 className="font-serif text-paper text-lg font-medium mt-1 leading-snug line-clamp-3">
                    {journal.title}
                  </h3>
                </div>

                {/* Cover Center Icon */}
                <div className="flex justify-center pl-3 text-paper/40 group-hover:text-paper/70 transition-colors">
                  {getIcon(journal.cover_icon)}
                </div>

                {/* Bottom Ribbon / Page Indicator */}
                <div className="pl-3 flex items-center justify-between text-paper/60 text-[10px] font-sans">
                  <span>{journal.cover_texture || 'linen'}</span>
                  <span className="bg-black/20 px-2 py-0.5 rounded-full font-medium">
                    {journal.entry_count || 0} entries
                  </span>
                </div>
              </div>
            </div>

            {/* Journal Meta & Details */}
            <div className="space-y-3 pt-2 border-t border-subtle-border">
              <div className="flex items-center justify-between text-xs text-taupe font-sans">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{journal.latest_entry_date ? `Latest: ${journal.latest_entry_date}` : 'No entries yet'}</span>
                </span>
                {journal.is_favorite ? (
                  <span className="text-[10px] bg-dusty-rose text-dusty-rose-dark px-2 py-0.5 rounded-full font-medium">
                    Favorite
                  </span>
                ) : null}
              </div>

              {journal.description && (
                <p className="font-sans text-xs text-charcoal/80 line-clamp-2 italic">
                  "{journal.description}"
                </p>
              )}

              {journal.recent_preview && (
                <div className="p-2.5 rounded-lg bg-beige/30 border border-subtle-border/60">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-taupe block mb-1">
                    Recent Writing
                  </span>
                  <p className="font-handwriting text-base text-espresso/80 line-clamp-2 leading-tight">
                    {journal.recent_preview.replace(/<[^>]*>/g, '')}
                  </p>
                </div>
              )}
            </div>

            {/* Action pill */}
            <div className="mt-4 pt-2 flex items-center justify-between text-xs font-sans text-muted-brown group-hover:text-espresso font-medium">
              <span>Open in Diary Reader</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        ))}

        {/* Empty / Add Journal Card */}
        <div
          onClick={() => setIsNewModalOpen(true)}
          className="border-2 border-dashed border-subtle-border hover:border-taupe rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-beige/20 transition-all min-h-[360px] group"
        >
          <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-taupe group-hover:text-espresso group-hover:scale-110 transition-all shadow-subtle mb-4">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl text-espresso font-medium">Bind a New Journal</h3>
          <p className="font-sans text-xs text-charcoal/60 max-w-xs mt-1 leading-relaxed">
            Create an additional journal for specific projects, personal reflections, or travel logs.
          </p>
        </div>

      </div>

      <NewJournalModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

    </div>
  );
}
