import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, BookOpen } from 'lucide-react';
import { FocusFlowLogo } from './FocusFlowLogo';

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (topic: string, minutes: number) => void;
}

const PRESET_TOPICS = [
  'Python AsyncIO & Task Queues',
  'JavaScript Promises & Event Loop',
  'React Hooks & State Architecture',
  'Data Structures: Trees & Graphs',
  'System Design: Scalability Basics',
  'SQL Performance & Indexing',
];

const PRESET_DURATIONS = [15, 20, 30, 45, 60];

export const NewPlanModal: React.FC<NewPlanModalProps> = ({
  isOpen,
  onClose,
  onCreatePlan,
}) => {
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState(45);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) return;
    onCreatePlan(trimmed, minutes);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-plan-title"
    >
      <div className="bg-navy-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-navy-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FocusFlowLogo size={32} className="w-8 h-8 shrink-0" />
            <div>
              <h3 id="new-plan-title" className="text-base font-bold text-white">Create New Study Plan</h3>
              <p className="text-xs text-slate-300">Set your topic and available time window</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Study Topic or Subject</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Python AsyncIO, React Hooks, Biology"
              className="w-full bg-navy-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />

            {/* Quick Topic Presets */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(p)}
                  className="text-xs bg-navy-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700/80 transition-colors active:scale-95"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Time Budget ({minutes} minutes)</span>
            </label>
            <div className="flex items-center gap-2">
              {PRESET_DURATIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setMinutes(dur)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                    minutes === dur
                      ? 'bg-accent border-accent text-white shadow-sm ring-1 ring-accent-light'
                      : 'bg-navy-850 border-slate-700 text-slate-300 hover:text-white hover:bg-navy-800'
                  }`}
                >
                  {dur}m
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim()}
              className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-accent/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
