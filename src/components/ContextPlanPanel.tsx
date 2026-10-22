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
  Plus, 
  Minus,
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
  onUpdateTaskMinutes,
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
      <div className="h-full bg-navy-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-slate-700/80 flex items-center justify-center mb-4 text-slate-400">
          <Bookmark className="w-7 h-7 text-accent-light" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">No Active Study Session</h3>
        <p className="text-xs text-slate-400 max-w-xs mb-6">
          Ask Alexa+ in the conversation panel or click below to launch an intelligent study sprint.
        </p>
        <button
          onClick={onNewPlan}
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-accent/20 transition-all"
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

  const totalMinutes = currentSession.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completedMinutes = completedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const progressPercent = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Restored context banner if applicable */}
      {isRestoredContext && (
        <div className="bg-indigo-950/80 border-b border-indigo-800/80 px-4 py-2 text-xs text-indigo-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            <span>Session restored from localStorage.</span>
          </span>
          <span className="text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700">
            Persistent Context
          </span>
        </div>
      )}

      {/* Goal Header */}
      <div className="p-4 border-b border-slate-800 bg-navy-850/70">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/70">
                {currentSession.goal.category || 'Study Sprint'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {totalMinutes} min budget
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight leading-snug">
              {currentSession.goal.title}
            </h2>
          </div>

          <button
            onClick={onFinishSession}
            className="shrink-0 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-700/80 bg-navy-800 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Finish Session</span>
          </button>
        </div>

        {/* Progress Bar & Summary Metrics */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium text-slate-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Progress: {progressPercent}%</span>
            </span>
            <span>
              {completedTasks.length} of {currentSession.tasks.length} tasks complete ({completedMinutes}m / {totalMinutes}m)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-navy-800 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-accent to-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Task Focus Card (Stopwatch & Next Action) */}
      {activeTask && activeTask.status !== 'completed' && (
        <div className="m-3 p-3.5 rounded-lg bg-navy-800/90 border border-indigo-900/80 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                CURRENT FOCUS (TASK {activeTask.order})
              </span>
            </div>

            {/* Stopwatch controls */}
            <div className="flex items-center gap-2 bg-navy-900/80 border border-slate-700/70 rounded-md px-2 py-1 text-xs">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="font-mono text-xs font-semibold text-slate-200">
                {formatTime(timerSeconds)}
              </span>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-slate-300 hover:text-white p-0.5"
                title={isTimerRunning ? 'Pause timer' : 'Start task timer'}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(0);
                }}
                className="text-slate-400 hover:text-slate-200 p-0.5"
                title="Reset timer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-white mb-1">
            {activeTask.title}
          </h4>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            {activeTask.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              Est. {activeTask.estimatedMinutes} minutes
            </span>

            <button
              onClick={() => onToggleTask(activeTask.id)}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Task List Header */}
      <div className="px-4 py-2 bg-navy-850/40 border-y border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
        <span>Actionable Plan ({currentSession.tasks.length} Steps)</span>
        <span className="text-slate-500 text-[11px]">Click checkbox to complete</span>
      </div>

      {/* Task Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {currentSession.tasks.map((task) => {
          const isCompleted = task.status === 'completed';
          const isInProgress = task.status === 'in_progress';

          return (
            <div
              key={task.id}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                isCompleted
                  ? 'bg-navy-950/60 border-slate-800/80 text-slate-400 opacity-80'
                  : isInProgress
                  ? 'bg-navy-800 border-indigo-700/80 shadow-md shadow-indigo-950/40 text-slate-200'
                  : 'bg-navy-850 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark task complete'}
                  className="mt-0.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-accent rounded"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isInProgress ? (
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-xs font-bold leading-tight line-clamp-1 ${
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {task.order}. {task.title}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${
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
                    className={`text-xs leading-relaxed mb-2 line-clamp-2 ${
                      isCompleted ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {task.description}
                  </p>

                  {/* Task Card Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {task.estimatedMinutes}m
                      </span>

                      {/* Inline Duration Adjustment Controls */}
                      {!isCompleted && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() => onUpdateTaskMinutes(task.id, -5)}
                            disabled={task.estimatedMinutes <= 5}
                            title="Decrease 5m"
                            className="p-0.5 rounded bg-navy-900 border border-slate-700 hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateTaskMinutes(task.id, 5)}
                            title="Increase 5m"
                            className="p-0.5 rounded bg-navy-900 border border-slate-700 hover:bg-slate-700 text-slate-400"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px]">
                      {isCompleted ? (
                        <span className="text-emerald-400 font-medium">Completed</span>
                      ) : isInProgress ? (
                        <span className="text-cyan-400 font-medium">In Progress</span>
                      ) : (
                        <span className="text-slate-500">Pending</span>
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
      <div className="p-3 border-t border-slate-800 bg-navy-850/80 space-y-2">
        {/* Next recommended action notification */}
        <div className="flex items-center gap-2 text-xs bg-navy-900/90 border border-slate-700/80 rounded-lg p-2.5 text-slate-300">
          <ChevronRight className="w-4 h-4 text-accent-light shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold text-white">Next Step: </span>
            <span className="text-slate-300 truncate">
              {remainingTasks.length > 0
                ? `${remainingTasks[0].title} (${remainingTasks[0].estimatedMinutes}m)`
                : 'All tasks completed! Wrap up session.'}
            </span>
          </div>
        </div>

        {/* Quick adapt triggers */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium">Quick Adapt:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQuickAdapt(20)}
              className="px-2 py-1 rounded bg-navy-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
            >
              Fit 20m
            </button>
            <button
              onClick={() => onQuickAdapt(30)}
              className="px-2 py-1 rounded bg-navy-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
            >
              Fit 30m
            </button>
            <button
              onClick={onStruggling}
              className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-[11px] border border-indigo-800 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              <span>Struggling</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
