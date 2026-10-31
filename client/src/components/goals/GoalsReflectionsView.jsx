import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { apiRequest } from '../../api/client';
import confetti from 'canvas-confetti';
import {
  Target,
  Trophy,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  BookOpen,
  Calendar,
  X,
  Check,
  Award
} from 'lucide-react';

export default function GoalsReflectionsView() {
  const { goals, achievements, refreshGoals, openEntryById, openCompanionWithMode } = useJournal();
  
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('personal');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Suggested achievements that require explicit user confirmation before recording
  const [suggestedMilestones, setSuggestedMilestones] = useState([
    {
      id: 'sugg-meditation-habit',
      title: 'Established 4 Consecutive Weeks of Morning Meditation',
      description: 'Documented in your June Solstice entry: morning mindfulness transitioned from a chore into a restorative daily anchor.',
      date: '2026-06-19',
      category: 'mindfulness',
      linked_entry_id: 'entry-2026-06-19'
    },
    {
      id: 'sugg-migration-wrapup',
      title: 'Delivered Q3 Cross-Platform Architecture Sprints On Schedule',
      description: 'Documented in your October Harvest entry: kept the migration rollout steady without emergency panics.',
      date: '2026-10-30',
      category: 'career',
      linked_entry_id: 'entry-2026-10-30'
    }
  ]);

  // User confirms AI suggested milestone
  const handleConfirmSuggestedAchievement = async (suggestion) => {
    try {
      await apiRequest('/goals/achievements/create', {
        method: 'POST',
        body: JSON.stringify({
          title: suggestion.title,
          description: suggestion.description,
          date: suggestion.date,
          category: suggestion.category,
          linked_entry_id: suggestion.linked_entry_id
        })
      });

      // Warm celebration confetti
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#DCE5D9', '#EEDDDC', '#F3E9B8', '#B8A99A']
      });

      // Remove from suggested list
      setSuggestedMilestones(prev => prev.filter(s => s.id !== suggestion.id));
      await refreshGoals();
    } catch (err) {
      console.error('Confirm achievement error:', err);
    }
  };

  const handleDismissSuggested = (suggId) => {
    setSuggestedMilestones(prev => prev.filter(s => s.id !== suggId));
  };

  // Mark goal as achieved with gentle celebratory confetti!
  const handleMarkAchieved = async (goalId) => {
    try {
      await apiRequest(`/goals/${goalId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'achieved',
          achieved_date: new Date().toISOString().split('T')[0]
        })
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#DCE5D9', '#EEDDDC', '#F3E9B8', '#B8A99A']
      });

      await refreshGoals();
    } catch (err) {
      console.error('Goal update error:', err);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      await apiRequest('/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          target_date: newTargetDate || null,
          reflection_notes: newNotes.trim() || null
        })
      });

      await refreshGoals();
      setNewTitle('');
      setNewNotes('');
      setNewTargetDate('');
      setIsNewGoalModalOpen(false);
    } catch (err) {
      console.error('Create goal error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const inProgressGoals = goals.filter(g => g.status === 'in_progress');
  const achievedGoals = goals.filter(g => g.status === 'achieved');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 animate-in fade-in">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-subtle-border">
        <div>
          <span className="text-xs font-sans tracking-widest text-taupe uppercase font-semibold">
            INTENTIONS & GROWTH
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-espresso font-semibold mt-1">
            Goals & Documented Milestones
          </h1>
          <p className="font-sans text-xs sm:text-sm text-charcoal/70 mt-1">
            Track your quiet ambitions and celebrate the challenges you have already overcome.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => openCompanionWithMode('monthly_reflection')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-paper text-espresso border border-subtle-border hover:bg-beige/40 rounded-xl text-xs font-sans font-medium shadow-subtle transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-dusty-rose-dark" />
            <span>Generate Monthly Reflection</span>
          </button>

          <button
            onClick={() => setIsNewGoalModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-muted-brown text-paper hover:bg-espresso rounded-xl text-xs font-sans font-medium shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Intention</span>
          </button>
        </div>
      </div>

      {/* Suggested Milestones Awaiting User Confirmation (if any) */}
      {suggestedMilestones.length > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-paper paper-texture border border-dusty-rose-dark/30 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-dusty-rose-dark" />
              <h3 className="font-serif text-lg font-semibold text-espresso">
                Suggested Milestones from Your Journal
              </h3>
            </div>
            <span className="text-[11px] font-sans text-taupe">
              Confirmation required before saving
            </span>
          </div>

          <p className="font-sans text-xs text-charcoal/75 leading-relaxed">
            The companion identified meaningful moments in your recent writing that reflect dedication or growth. Confirm them below to preserve them on your permanent achievements wall:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {suggestedMilestones.map(sugg => (
              <div
                key={sugg.id}
                className="p-4 rounded-xl bg-beige/30 border border-subtle-border flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-sans text-taupe mb-1">
                    <span className="font-mono text-espresso">{sugg.date}</span>
                    <span className="capitalize px-2 py-0.5 rounded-full bg-paper border border-subtle-border">
                      {sugg.category}
                    </span>
                  </div>
                  <h4 className="font-serif text-base font-semibold text-espresso">
                    {sugg.title}
                  </h4>
                  <p className="font-sans text-xs text-charcoal/75 mt-1 leading-relaxed">
                    {sugg.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-subtle-border/60 text-xs font-sans">
                  {sugg.linked_entry_id && (
                    <button
                      onClick={() => openEntryById(sugg.linked_entry_id)}
                      className="text-[11px] text-muted-brown hover:text-espresso font-medium inline-flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>View entry</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleDismissSuggested(sugg.id)}
                      className="px-2.5 py-1 text-taupe hover:text-charcoal text-xs"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleConfirmSuggestedAchievement(sugg)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-espresso text-paper rounded-lg font-medium text-xs hover:bg-charcoal shadow-sm transition-all"
                    >
                      <Check className="w-3 h-3" />
                      <span>Confirm & Record</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Active Intentions & Goals (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-espresso font-medium flex items-center gap-2">
                <Target className="w-5 h-5 text-muted-brown" />
                <span>Active Intentions</span>
              </h2>
              <span className="text-xs font-sans text-taupe">
                {inProgressGoals.length} in progress
              </span>
            </div>

            {inProgressGoals.length === 0 ? (
              <div className="p-8 text-center bg-paper rounded-2xl border border-subtle-border text-taupe text-xs">
                No active goals. Take a moment to set an intention for this season.
              </div>
            ) : (
              <div className="space-y-3">
                {inProgressGoals.map(goal => (
                  <div
                    key={goal.id}
                    className="p-5 rounded-2xl bg-paper border border-subtle-border shadow-subtle flex flex-col justify-between transition-all hover:border-taupe/40"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-taupe font-sans mb-1.5">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-beige/50 text-muted-brown text-[10px] font-medium">
                          {goal.category}
                        </span>
                        {goal.target_date && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3" />
                            <span>Target: {goal.target_date}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-lg font-medium text-espresso">
                        {goal.title}
                      </h3>

                      {goal.reflection_notes && (
                        <p className="font-sans text-xs text-charcoal/75 mt-1 italic">
                          "{goal.reflection_notes}"
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-subtle-border/60 flex items-center justify-between text-xs font-sans">
                      <span className="text-taupe text-[11px]">In progress</span>
                      <button
                        onClick={() => handleMarkAchieved(goal.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-sage/60 hover:bg-sage text-sage-dark rounded-lg font-medium text-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Achieved</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achieved Goals Section */}
          {achievedGoals.length > 0 && (
            <div className="pt-4">
              <h2 className="font-serif text-xl text-espresso font-medium flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-sage-dark" />
                <span>Completed Intentions</span>
              </h2>

              <div className="space-y-3">
                {achievedGoals.map(goal => (
                  <div
                    key={goal.id}
                    className="p-4 rounded-xl bg-paper/60 border border-subtle-border flex items-center justify-between text-xs font-sans"
                  >
                    <div>
                      <h4 className="font-serif text-base text-espresso line-through decoration-taupe/50">
                        {goal.title}
                      </h4>
                      <span className="text-[11px] text-taupe">
                        Completed on {goal.achieved_date || 'Earlier'}
                      </span>
                    </div>
                    <span className="text-[10px] bg-sage/50 text-sage-dark px-2 py-0.5 rounded-full font-medium">
                      Achieved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Documented Achievements Wall (5 cols) */}
        <div className="lg:col-span-5 bg-paper paper-texture rounded-2xl shadow-book border border-subtle-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-subtle-border">
              <h2 className="font-serif text-xl text-espresso font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-butter-dark" />
                <span>Documented Milestones</span>
              </h2>
              <span className="text-xs font-sans text-taupe">
                {achievements.length} recorded
              </span>
            </div>

            <p className="font-sans text-xs text-charcoal/70 mb-4 leading-relaxed">
              These are not abstract wishes—they are verified moments of growth and courage recorded in your journal.
            </p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {achievements.map(ach => (
                <div
                  key={ach.id}
                  className="p-4 rounded-xl bg-beige/30 border border-subtle-border/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-sans text-taupe">
                    <span className="font-mono text-espresso font-medium">{ach.date}</span>
                    <span className="capitalize">{ach.category}</span>
                  </div>

                  <h3 className="font-serif text-base font-semibold text-espresso">
                    {ach.title}
                  </h3>

                  {ach.description && (
                    <p className="font-sans text-xs text-charcoal/75 leading-relaxed">
                      {ach.description}
                    </p>
                  )}

                  {ach.linked_entry_id && (
                    <button
                      onClick={() => openEntryById(ach.linked_entry_id)}
                      className="text-[11px] text-muted-brown hover:text-espresso font-medium inline-flex items-center gap-1 pt-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>View supporting diary entry →</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-subtle-border text-center">
            <button
              onClick={() => openCompanionWithMode('remind_who_i_am')}
              className="text-xs text-muted-brown hover:text-espresso font-sans font-medium inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-dusty-rose-dark" />
              <span>Ask AI Companion to reflect on your milestones →</span>
            </button>
          </div>
        </div>

      </div>

      {/* New Goal Modal */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/30 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-paper rounded-2xl shadow-book border border-subtle-border p-6 paper-texture space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-espresso font-semibold">Set a Quiet Intention</h3>
              <button onClick={() => setIsNewGoalModalOpen(false)} className="text-taupe hover:text-espresso">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block font-medium text-charcoal mb-1">Intention / Goal Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Establish a morning 20-minute meditation"
                  className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-charcoal mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/50 border border-subtle-border text-xs outline-none capitalize"
                  >
                    <option value="personal">Personal</option>
                    <option value="career">Career</option>
                    <option value="health">Health & Body</option>
                    <option value="mindfulness">Mindfulness</option>
                    <option value="creative">Creative</option>
                    <option value="relationships">Relationships</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-charcoal mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-ivory/50 border border-subtle-border text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal mb-1">Why does this matter to you?</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="The emotional anchor behind this intention..."
                  className="w-full px-3 py-2 rounded-lg bg-ivory/50 border border-subtle-border text-xs outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-subtle-border text-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-espresso text-paper font-medium hover:bg-charcoal"
                >
                  {submitting ? 'Saving...' : 'Set Intention'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
