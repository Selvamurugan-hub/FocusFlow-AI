import React, { useState } from 'react';
import { X, Sparkles, Clock, BookOpen } from 'lucide-react';

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

const PRESET_DURATIONS = [15, 25, 30, 45, 60];

export const NewPlanModal: React.FC<NewPlanModalProps> = ({
  isOpen,
  onClose,
  onCreatePlan,
}) => {
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState(45);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onCreatePlan(topic.trim(), minutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-navy-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-navy-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Create New Study Plan</h3>
              <p className="text-[11px] text-slate-400">Configure topic & time budget</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-accent-light" />
              <span>Study Topic or Subject</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Python AsyncIO, React Hooks, Biology"
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
            />

            {/* Quick Topic Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(p)}
                  className="text-[10px] bg-navy-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent-light" />
              <span>Time Budget ({minutes} minutes)</span>
            </label>
            <div className="flex items-center gap-2">
              {PRESET_DURATIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setMinutes(dur)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    minutes === dur
                      ? 'bg-accent border-accent text-white shadow-sm'
                      : 'bg-navy-850 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {dur}m
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim()}
              className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
