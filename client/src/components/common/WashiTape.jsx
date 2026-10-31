import React from 'react';

export default function WashiTape({ variant = 'craft', rotation = -2, className = '' }) {
  const variantClasses = {
    sage: 'washi-tape-sage border-sage',
    rose: 'washi-tape-rose border-dusty-rose',
    butter: 'washi-tape-butter border-butter',
    craft: 'washi-tape-craft border-[#d8c3ad]',
  };

  return (
    <div
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`h-4 w-20 md:w-24 opacity-90 rounded-sm pointer-events-none select-none z-10 ${variantClasses[variant] || variantClasses.craft} ${className}`}
      aria-hidden="true"
    >
      {/* Torn edge effect via subtle jagged borders */}
      <div className="w-full h-full border-t border-b border-black/5 opacity-60" />
    </div>
  );
}
