import React, { useState, useEffect } from 'react';
import { StudySession } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ChevronRight, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Bookmark
} from 'lucide-react';

interface ContextPlanPanelProps {
  currentSession: StudySession | null;
  onToggleTask: (taskId: string) => void;
  onUpdateTaskMinutes: (taskId: string, delta: number) => void;
  onQuickAdapt: (minutes: number) => void;
  onStruggling: () => void;
  onFinishSession: () => void;
  onNewPlan: () => void;
  isRestoredContext?: boolean;
}

export const ContextPlanPanel: React.FC<ContextPlanPanelProps> = ({
  currentSession,
  onToggleTask,
  onQuickAdapt,
  onStruggling,
  onFinishSession,
  onNewPlan,
  isRestoredContext,
}) => {
  // Active task stopwatch timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Reset or run timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!currentSession) {
    return (
      <div className="h-full bg-navy-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-slate-700/80 flex items-center justify-center mb-4 text-slate-400 shadow-inner">
          <Bookmark className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Active Study Session</h3>
        <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
          Ask Alexa+ in the conversation panel or click below to launch an intelligent, adaptive study sprint.
        </p>
        <button
          onClick={onNewPlan}
          className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-accent/20 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate A Study Plan</span>
        </button>
      </div>
    );
  }

  const completedTasks = currentSession.tasks.filter(t => t.status === 'completed');
  const remainingTasks = currentSession.tasks.filter(t => t.status !== 'completed');
  const activeTask = currentSession.tasks.find(t => t.id === currentSession.activeTaskId) || remainingTasks[0];

  const completedMinutes = completedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const remainingMinutes = remainingTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalMinutes = completedMinutes + remainingMinutes;
  const progressPercent = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

  // Format timer (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Restored context notification banner if session was loaded from localStorage */}
      {isRestoredContext && (
        <div className="bg-indigo-950/90 border-b border-indigo-800/80 px-4 py-2 text-xs text-indigo-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            <span>Session remembered from browser storage.</span>
          </span>
          <span className="text-[11px] font-semibold bg-indigo-900/90 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/60">
            Persistent Context
          </span>
        </div>
      )}

      {/* Goal Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-navy-850/80">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/70">
                {currentSession.goal.category || 'Study Sprint'}
              </span>
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1 bg-navy-900/80 px-2 py-0.5 rounded border border-slate-700/60">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {totalMinutes} min planned
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              {currentSession.goal.title}
            </h2>
          </div>

          <button
            onClick={onFinishSession}
            title="Conclude study session and generate verified completion summary"
            className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-600 bg-navy-800 hover:bg-emerald-950/50 text-slate-200 hover:text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-95"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Finish Session</span>
          </button>
        </div>

        {/* Progress Bar & Summary Metrics */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Progress: {progressPercent}%</span>
            </span>
            <span className="font-medium text-slate-300">
              {completedTasks.length} of {currentSession.tasks.length} tasks done • {completedMinutes}m completed ({remainingMinutes}m remaining)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-navy-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-accent to-cyan-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Task Focus Card (Stopwatch & Immediate Action) */}
      {activeTask && activeTask.status !== 'completed' && (
        <div className="m-3 p-4 rounded-xl bg-gradient-to-b from-navy-800 to-navy-850 border border-indigo-900/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                CURRENT FOCUS (STEP {activeTask.order})
              </span>
            </div>

            {/* Stopwatch controls */}
            <div className="flex items-center gap-2 bg-navy-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-xs font-bold text-white tracking-wider">
                {formatTime(timerSeconds)}
              </span>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-slate-300 hover:text-white p-0.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
                title={isTimerRunning ? 'Pause active timer' : 'Start active timer'}
                aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(0);
                }}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
                title="Reset timer"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
            {activeTask.title}
          </h4>
          <p className="text-xs text-slate-300 mb-3.5 leading-relaxed">
            {activeTask.description}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
            <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Allocated: <strong className="text-white">{activeTask.estimatedMinutes} minutes</strong>
            </span>

            <button
              onClick={() => onToggleTask(activeTask.id)}
              title="Mark this task complete and advance to next"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Task List Header */}
      <div className="px-4 py-2 bg-navy-850/60 border-y border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
        <span>Actionable Plan ({currentSession.tasks.length} Steps)</span>
        <span className="text-slate-400 text-xs">Click checkbox to complete</span>
      </div>

      {/* Task Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {currentSession.tasks.map((task) => {
          const isCompleted = task.status === 'completed';
          const isInProgress = task.status === 'in_progress';

          return (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border transition-all duration-200 ${
                isCompleted
                  ? 'bg-navy-950/60 border-slate-800 text-slate-400 opacity-80'
                  : isInProgress
                  ? 'bg-navy-800/90 border-indigo-600/80 shadow-md shadow-indigo-950/50 text-slate-100 ring-1 ring-indigo-500/30'
                  : 'bg-navy-850/90 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox button */}
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-label={isCompleted ? `Mark task ${task.order} incomplete` : `Mark task ${task.order} complete`}
                  title={isCompleted ? 'Mark incomplete' : 'Mark task complete'}
                  className="mt-0.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-accent rounded-full transition-transform active:scale-90"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isInProgress ? (
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300 transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-sm font-bold leading-tight ${
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {task.order}. {task.title}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                        task.priority === 'high'
                          ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                          : task.priority === 'medium'
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <p
                    className={`text-xs leading-relaxed mb-2.5 ${
                      isCompleted ? 'text-slate-400 line-through' : 'text-slate-300'
                    }`}
                  >
                    {task.description}
                  </p>

                  {/* Task Card Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/70">
                    <span className="flex items-center gap-1 font-mono text-slate-200 font-semibold bg-navy-900/60 px-2 py-0.5 rounded border border-slate-700/50">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {task.estimatedMinutes}m
                    </span>

                    <span>
                      {isCompleted ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </span>
                      ) : isInProgress ? (
                        <span className="text-cyan-400 font-semibold">In Progress</span>
                      ) : (
                        <span className="text-slate-400 font-medium">Pending</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adaptive Planning Quick Controls & Recommended Action */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-navy-850/90 space-y-2.5">
        {/* Next recommended action notification */}
        <div className="flex items-center gap-2.5 text-xs bg-navy-900 border border-slate-700/80 rounded-xl p-3 text-slate-200 shadow-sm">
          <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-white">Next Step: </span>
            <span className="text-slate-300 font-medium truncate">
              {remainingTasks.length > 0
                ? `${remainingTasks[0].title} (${remainingTasks[0].estimatedMinutes}m)`
                : 'All tasks completed! Click Finish Session to generate your summary.'}
            </span>
          </div>
        </div>

        {/* Quick adapt triggers */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <span className="text-xs text-slate-300 font-semibold">Adapt Schedule:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQuickAdapt(15)}
              title="Rescale unfinished tasks into a 15-minute window"
              className="px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all focus:outline-none focus:ring-1 focus:ring-accent active:scale-95"
            >
              Fit 15m
            </button>
            <button
              onClick={() => onQuickAdapt(20)}
              title="Rescale unfinished tasks into a 20-minute window"
              className="px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all focus:outline-none focus:ring-1 focus:ring-accent active:scale-95"
            >
              Fit 20m
            </button>
            <button
              onClick={() => onQuickAdapt(30)}
              title="Rescale unfinished tasks into a 30-minute window"
              className="px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all focus:outline-none focus:ring-1 focus:ring-accent active:scale-95"
            >
              Fit 30m
            </button>
            <button
              onClick={onStruggling}
              title="Break down active task into simplified micro-steps"
              className="px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 text-xs font-semibold border border-indigo-800 transition-all flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Struggling</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
