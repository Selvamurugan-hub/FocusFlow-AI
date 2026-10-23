import React from 'react';
import { StudySession } from '../types';
import { SpeechAssistantState } from '../services/speech';
import { VoiceIndicator } from './VoiceIndicator';
import { FocusFlowLogo } from './FocusFlowLogo';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Trash2, 
  PlayCircle, 
  Cpu, 
  CheckCircle2, 
  Clock,
  Layers
} from 'lucide-react';

interface HeaderProps {
  currentSession: StudySession | null;
  speechState: SpeechAssistantState;
  isListening: boolean;
  onToggleMic: () => void;
  voiceFeedbackEnabled: boolean;
  onToggleVoiceFeedback: () => void;
  onNewPlan: () => void;
  onLoadDemo: () => void;
  onResetSession: () => void;
  onClearAll: () => void;
  backendAvailable: boolean;
  useBackendAi: boolean;
  onToggleBackendAi: () => void;
  unsupportedSpeechMessage?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  speechState,
  isListening,
  onToggleMic,
  voiceFeedbackEnabled,
  onToggleVoiceFeedback,
  onNewPlan,
  onLoadDemo,
  onResetSession,
  onClearAll,
  backendAvailable,
  useBackendAi,
  onToggleBackendAi,
  unsupportedSpeechMessage,
}) => {
  const completedTasks = currentSession?.tasks.filter(t => t.status === 'completed') || [];
  const remainingTasks = currentSession?.tasks.filter(t => t.status !== 'completed') || [];
  const completedCount = completedTasks.length;
  const totalTasks = currentSession?.tasks.length || 0;
  
  const completedMinutes = completedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const remainingMinutes = remainingTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalMinutes = completedMinutes + remainingMinutes;

  return (
    <header className="border-b border-slate-800 bg-navy-900/95 sticky top-0 z-30 backdrop-blur-md">
      {/* Top micro-announcement banner */}
      <div className="bg-gradient-to-r from-navy-900 via-indigo-950/70 to-navy-900 py-1.5 px-4 border-b border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">
            Hackathon prototype · Simulated Alexa+ experience
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">
            Amazon Developer Hackathon: Build, Ship, Shape
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Engine indicator pill */}
          <div
            title={
              backendAvailable
                ? `AI Engine Mode: ${useBackendAi ? 'Groq LLaMA Cloud' : 'Local Workflow Engine'}`
                : 'FocusFlow Local Workflow Engine active (100% offline, zero API keys required)'
            }
            onClick={backendAvailable ? onToggleBackendAi : undefined}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
              useBackendAi && backendAvailable
                ? 'bg-purple-950/80 text-purple-200 border-purple-700/60 cursor-pointer'
                : 'bg-navy-800/90 text-cyan-300 border-cyan-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{useBackendAi && backendAvailable ? 'Groq LLaMA Active' : 'Local Engine · Offline Ready'}</span>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Branding & Tagline */}
          <div className="flex items-center gap-3.5">
            {/* Custom Modern FocusFlow AI Logo */}
            <FocusFlowLogo size={40} className="w-10 h-10 shrink-0" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">FocusFlow AI</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/70">
                  Simulated Alexa+
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Your goals, remembered. Your next step, ready.
              </p>
            </div>
          </div>

          {/* Center: Current Goal & Session Status Badge */}
          <div className="flex items-center gap-3">
            {currentSession ? (
              <div 
                className="flex items-center gap-2.5 bg-navy-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-sm"
                title={`Current Study Plan: ${currentSession.goal.title}\nCompleted: ${completedCount}/${totalTasks} tasks (${completedMinutes}m)\nRemaining: ${remainingMinutes}m`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-100 line-clamp-1 max-w-[180px] sm:max-w-[220px]">
                      {currentSession.goal.title}
                    </span>
                    <span className="text-xs text-slate-300 font-medium flex items-center gap-0.5 bg-navy-900/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {totalMinutes}m
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {completedCount}/{totalTasks} done ({completedMinutes}m)
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      {remainingMinutes > 0 ? `${remainingMinutes}m left` : 'Completed'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-navy-800/60 border border-slate-800 rounded-xl px-3.5 py-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Ready to study. Ask Alexa+ to plan your session!</span>
              </div>
            )}

            {/* Alexa+ Voice Indicator */}
            <VoiceIndicator
              state={speechState}
              isVoiceActive={isListening}
              onToggleMic={onToggleMic}
              unsupportedMessage={unsupportedSpeechMessage}
            />
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Audio Voice Response toggle */}
            <button
              onClick={onToggleVoiceFeedback}
              title={voiceFeedbackEnabled ? 'Voice responses enabled (Click to mute)' : 'Voice responses muted (Click to unmute)'}
              aria-label={voiceFeedbackEnabled ? 'Mute voice responses' : 'Unmute voice responses'}
              className={`p-2 rounded-lg border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
                voiceFeedbackEnabled
                  ? 'bg-accent/20 border-accent/60 text-accent-light hover:bg-accent/30 shadow-sm'
                  : 'bg-navy-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-navy-700'
              }`}
            >
              {voiceFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Load Demo */}
            <button
              onClick={onLoadDemo}
              title="Preload a live demonstration study session (Python AsyncIO, 45m)"
              aria-label="Load demo session"
              className="px-3 py-2 rounded-lg border border-cyan-700/80 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 active:scale-95"
            >
              <PlayCircle className="w-4 h-4 text-cyan-400" />
              <span>Load Demo</span>
            </button>

            {/* New Plan */}
            <button
              onClick={onNewPlan}
              title="Create a new custom study plan"
              aria-label="Create new study plan"
              className="px-3 py-2 rounded-lg border border-indigo-600 bg-accent text-white hover:bg-accent-hover text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-light active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Plan</span>
            </button>

            {/* Reset Demo */}
            <button
              onClick={onResetSession}
              title="Reset current session progress to initial state"
              aria-label="Reset session progress"
              className="p-2 rounded-lg border border-slate-700 bg-navy-800 text-slate-300 hover:text-amber-400 hover:border-amber-700/60 hover:bg-navy-700 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Clear Saved Data */}
            <button
              onClick={onClearAll}
              title="Clear all saved context from browser localStorage"
              aria-label="Clear all saved data"
              className="p-2 rounded-lg border border-slate-700 bg-navy-800 text-slate-300 hover:text-red-400 hover:border-red-700/60 hover:bg-navy-700 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-red-500 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
