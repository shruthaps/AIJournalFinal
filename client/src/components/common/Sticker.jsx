import React from 'react';

export default function Sticker({ sticker, onRemove, editable = false }) {
  const { type, variant, x = 50, y = 50, rotation = 0, scale = 1 } = sticker;

  const renderIcon = () => {
    switch (type) {
      case 'botanical':
        return (
          <svg className="w-10 h-10 text-sage-dark/80 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M12 2L12 22" strokeLinecap="round" />
            <path d="M12 7C9.5 5 6 6 6 8.5C6 11 12 13 12 13" strokeLinecap="round" />
            <path d="M12 11C14.5 9 18 10 18 12.5C18 15 12 17 12 17" strokeLinecap="round" />
            <path d="M12 16C9.5 14 7 15 7 17.5C7 20 12 21 12 21" strokeLinecap="round" />
          </svg>
        );
      case 'star':
        return (
          <svg className="w-7 h-7 text-butter-dark drop-shadow-sm fill-butter/60" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case 'heart':
        return (
          <svg className="w-6 h-6 text-dusty-rose-dark drop-shadow-sm fill-dusty-rose/70" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case 'paperclip':
        return (
          <svg className="w-8 h-8 text-taupe drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        );
      case 'coffee-stain':
        return (
          <div className="w-14 h-14 rounded-full border border-amber-900/15 border-dashed opacity-40 shadow-inner" />
        );
      case 'tape':
      default: {
        const tapeColors = {
          sage: 'bg-sage/80 border-sage',
          rose: 'bg-dusty-rose/80 border-dusty-rose',
          butter: 'bg-butter/80 border-butter',
          craft: 'bg-[#ddcbb7]/80 border-[#d8c3ad]',
        };
        return (
          <div className={`w-16 h-4 shadow-sm border-t border-b border-black/5 opacity-85 ${tapeColors[variant || 'craft']}`} />
        );
      }
    }
  };

  return (
    <div
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
      }}
      className="absolute pointer-events-none select-none z-10 group"
    >
      <div className="relative">
        {renderIcon()}
        {editable && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(sticker.id);
            }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-espresso/80 text-paper rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
            title="Remove sticker"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
