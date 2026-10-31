import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import WashiTape from '../common/WashiTape';
import PolaroidPhoto from '../common/PolaroidPhoto';
import Sticker from '../common/Sticker';
import { Sparkles, BookOpen, ShieldCheck, Heart, Feather, ArrowRight, Lock } from 'lucide-react';

export default function LandingPage({ onOpenAuthModal }) {
  const { loginDemo } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoClick = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-espresso flex flex-col justify-between selection:bg-dusty-rose selection:text-espresso">
      
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif italic text-3xl font-semibold tracking-tight text-espresso">
            Dearly
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-dusty-rose-dark" />
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => onOpenAuthModal('login')}
            className="text-xs sm:text-sm font-sans font-medium text-charcoal hover:text-espresso px-3 py-1.5 rounded-md hover:bg-beige/40 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuthModal('register')}
            className="text-xs sm:text-sm font-sans font-medium bg-muted-brown text-paper hover:bg-espresso px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-4 pb-16 flex-1 flex flex-col items-center">
        
        {/* Tagline & Headline */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-beige/60 border border-subtle-border text-xs font-sans text-muted-brown">
            <Feather className="w-3.5 h-3.5 text-dusty-rose-dark" />
            <span>A calm, intimate digital diary</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-espresso tracking-tight leading-[1.15]">
            Your life, <span className="italic font-light">beautifully</span> remembered.
          </h1>

          <p className="font-sans text-charcoal/80 text-base sm:text-lg max-w-xl mx-auto font-light leading-relaxed">
            A little space for your thoughts, your memories, and the person you're becoming.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuthModal('register')}
              className="px-6 py-3 rounded-xl bg-espresso text-paper font-sans text-sm font-medium hover:bg-charcoal shadow-paper transition-all flex items-center gap-2"
            >
              <span>Open your diary</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleDemoClick}
              disabled={demoLoading}
              className="px-6 py-3 rounded-xl bg-paper border border-subtle-border text-espresso font-sans text-sm font-medium hover:bg-beige/40 shadow-subtle transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-dusty-rose-dark" />
              <span>{demoLoading ? 'Opening Demo...' : 'Explore Demo Journal (Clara)'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Open Journal Spread Preview */}
        <div className="w-full max-w-4xl mx-auto my-6">
          <div className="relative bg-paper rounded-2xl shadow-book border border-subtle-border overflow-hidden grid grid-cols-1 md:grid-cols-2">
            
            {/* Book Spine Center Shadow on Desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-subtle-border book-center-crease z-20 pointer-events-none" />

            {/* Left Page: Date & Photograph */}
            <div className="p-8 sm:p-10 paper-texture book-spine-left relative flex flex-col justify-between border-b md:border-b-0 md:border-r border-subtle-border">
              <div>
                <div className="flex items-center justify-between text-xs font-sans tracking-widest text-taupe uppercase mb-4">
                  <span>JUNE 19 · FRIDAY</span>
                  <span>24°C Sunny</span>
                </div>

                <div className="font-serif italic text-2xl text-espresso/90 mb-6">
                  "Enjoy the day."
                </div>

                {/* Polaroid Photo with Washi Tape */}
                <div className="flex justify-center my-4">
                  <PolaroidPhoto
                    photo={{
                      id: 'landing-p1',
                      url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=600&q=80',
                      caption: 'Summer blooms and afternoon tea on the balcony.',
                      rotation: -2,
                      frameStyle: 'polaroid',
                      width: 240
                    }}
                  />
                </div>
              </div>

              {/* Decorative botanical sticker */}
              <Sticker sticker={{ type: 'botanical', x: 88, y: 88, rotation: 12, scale: 1 }} />
              <div className="text-[11px] font-sans text-taupe/70 tracking-wider">
                PAGE 42
              </div>
            </div>

            {/* Right Page: Handwritten Journal Text */}
            <div className="p-8 sm:p-10 paper-texture book-spine-right relative flex flex-col justify-between">
              <div>
                <div className="text-xs font-sans tracking-widest text-taupe uppercase mb-6 flex items-center justify-between">
                  <span>REFLECTIONS</span>
                  <span className="text-sage-dark font-medium">Peaceful Mood</span>
                </div>

                <div className="notebook-ruled font-handwriting text-2xl sm:text-3xl text-espresso leading-[32px] space-y-4">
                  <p>
                    Today felt gentle. The air had that sweet jasmine scent that only arrives in late June.
                  </p>
                  <p>
                    I realized today that I haven't skipped my morning 20-minute meditation for four weeks now. It used to feel like an uphill chore; now it feels like dry clothes after rain.
                  </p>
                  <p>
                    There is quiet dignity in showing up for yourself in small ways.
                  </p>
                </div>
              </div>

              {/* Washi Tape Accent */}
              <div className="flex items-center justify-between pt-6">
                <div className="text-[11px] font-sans text-taupe/70 tracking-wider">
                  PAGE 43
                </div>
                <WashiTape variant="sage" rotation={1} className="w-20" />
              </div>
            </div>

          </div>
        </div>

        {/* 4 Core Architectural Principles (concise as requested) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mt-14">
          
          <div className="p-5 rounded-xl bg-paper/60 border border-subtle-border space-y-2">
            <div className="w-8 h-8 rounded-lg bg-beige/60 flex items-center justify-center text-muted-brown">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg text-espresso font-medium">A Personal Space to Write</h3>
            <p className="font-sans text-xs text-charcoal/75 leading-relaxed">
              Warm cream paper, fine notebook ruling, handwritten fonts, and tactile scrapbook decorations that invite quiet reflection.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-paper/60 border border-subtle-border space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sage/60 flex items-center justify-center text-sage-dark">
              <Feather className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg text-espresso font-medium">Remembers Your Journey</h3>
            <p className="font-sans text-xs text-charcoal/75 leading-relaxed">
              Organize multiple notebooks on an elegant bookshelf. Search through past months by mood, photographs, or goals.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-paper/60 border border-subtle-border space-y-2">
            <div className="w-8 h-8 rounded-lg bg-dusty-rose/60 flex items-center justify-center text-dusty-rose-dark">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg text-espresso font-medium">A Thoughtful AI Companion</h3>
            <p className="font-sans text-xs text-charcoal/75 leading-relaxed">
              Grounded strictly in your own writing. Reminds you how far you've come, illuminates gentle patterns, and helps talk through difficult days.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-paper/60 border border-subtle-border space-y-2">
            <div className="w-8 h-8 rounded-lg bg-butter/60 flex items-center justify-center text-butter-dark">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg text-espresso font-medium">A Private Home for Memories</h3>
            <p className="font-sans text-xs text-charcoal/75 leading-relaxed">
              Your entries are private, securely encrypted, and never sold. Export your entire journal as Markdown or JSON at any moment.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-subtle-border py-6 text-center text-xs text-taupe font-sans">
        <p>© 2026 Dearly. Your life, in your words. Your journey, remembered.</p>
      </footer>

    </div>
  );
}
