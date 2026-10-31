import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useJournal } from './context/JournalContext';
import LandingPage from './components/landing/LandingPage';
import OnboardingModal from './components/onboarding/OnboardingModal';
import Navbar from './components/common/Navbar';
import BookshelfView from './components/bookshelf/BookshelfView';
import DiaryReader from './components/reader/DiaryReader';
import CalendarSearchView from './components/calendar/CalendarSearchView';
import GoalsReflectionsView from './components/goals/GoalsReflectionsView';
import AICompanionDrawer from './components/companion/AICompanionDrawer';
import SettingsModal from './components/settings/SettingsModal';

export default function App() {
  const { user, loading } = useAuth();
  const { activeView } = useJournal();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center text-espresso">
        <div className="text-center space-y-3">
          <span className="font-serif italic text-3xl font-semibold">Dearly</span>
          <p className="text-xs font-sans text-taupe animate-pulse">Opening your personal diary...</p>
        </div>
      </div>
    );
  }

  // Not logged in: Show Landing Page
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuthModal={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
        />
        <OnboardingModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  // Logged in: Main Diary Application
  return (
    <div className="min-h-screen bg-ivory text-espresso flex flex-col font-sans selection:bg-dusty-rose selection:text-espresso">
      
      {/* Top Navbar */}
      <Navbar onOpenSettings={() => setIsSettingsModalOpen(true)} />

      {/* Main View Screen */}
      <main className="flex-1 pb-16 md:pb-8">
        {activeView === 'reader' && <DiaryReader />}
        {activeView === 'bookshelf' && <BookshelfView />}
        {activeView === 'calendar' && <CalendarSearchView />}
        {activeView === 'goals' && <GoalsReflectionsView />}
      </main>

      {/* AI Companion Slide-Out Drawer */}
      <AICompanionDrawer onOpenSettings={() => setIsSettingsModalOpen(true)} />

      {/* Settings & Privacy Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

    </div>
  );
}
