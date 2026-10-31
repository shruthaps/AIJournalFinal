import React from 'react';
import WashiTape from './WashiTape';

export default function PolaroidPhoto({ photo, editable = false, onRemove, onEdit }) {
  const { url, caption, rotation = 0, frameStyle = 'polaroid', width } = photo;

  const getFrameClasses = () => {
    switch (frameStyle) {
      case 'tape':
        return 'p-1.5 bg-paper shadow-md rounded-sm border border-subtle-border';
      case 'minimal':
        return 'p-0 shadow-sm rounded border border-subtle-border overflow-hidden';
      case 'polaroid':
      default:
        return 'p-2.5 pb-7 bg-paper shadow-polaroid rounded-sm border border-[#e5ded4]';
    }
  };

  return (
    <div
      style={{
        transform: `rotate(${rotation}deg)`,
        maxWidth: width ? `${width}px` : '280px',
      }}
      className="relative inline-block transition-transform duration-200 hover:scale-[1.02] group z-10 my-3"
    >
      {/* Top washi tape for taped or polaroid style */}
      {frameStyle !== 'minimal' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <WashiTape
            variant={rotation > 0 ? 'rose' : 'craft'}
            rotation={rotation * -0.8}
            className="w-16 md:w-20"
          />
        </div>
      )}

      <div className={`relative ${getFrameClasses()}`}>
        <img
          src={url}
          alt={caption || 'Journal photo'}
          className="w-full h-auto object-cover rounded-[1px] select-none"
          loading="lazy"
        />

        {caption && (
          <p className="mt-2 text-center font-handwriting text-espresso/80 text-sm md:text-base leading-tight select-none">
            {caption}
          </p>
        )}

        {editable && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(photo); }}
                className="w-6 h-6 bg-paper/90 text-charcoal rounded text-xs flex items-center justify-center shadow"
                title="Edit photo"
              >
                ✎
              </button>
            )}
            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(photo.id); }}
                className="w-6 h-6 bg-red-100/90 text-red-700 rounded text-xs flex items-center justify-center shadow"
                title="Delete photo"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
