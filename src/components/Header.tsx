import React from 'react';
import { StudySession } from '../types';
import { SpeechAssistantState } from '../services/speech';
import { VoiceIndicator } from './VoiceIndicator';
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
  const completedCount = currentSession?.tasks.filter(t => t.status === 'completed').length || 0;
  const totalTasks = currentSession?.tasks.length || 0;

  return (
    <header className="border-b border-slate-800 bg-navy-900/95 sticky top-0 z-30 backdrop-blur-md">
      {/* Top micro-announcement banner */}
      <div className="bg-gradient-to-r from-navy-800 via-indigo-950/60 to-navy-800 py-1 px-4 border-b border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-medium text-slate-200">
            Hackathon prototype · Simulated Alexa+ experience
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">
            Amazon Developer Hackathon: Build, Ship, Shape
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Engine indicator */}
          <button
            onClick={backendAvailable ? onToggleBackendAi : undefined}
            title={
              backendAvailable
                ? `Click to toggle AI mode (Current: ${useBackendAi ? 'Groq LLaMA' : 'Local Engine'})`
                : 'Local Workflow Engine active (100% offline ready)'
            }
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              useBackendAi && backendAvailable
                ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60'
                : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>{useBackendAi && backendAvailable ? 'Groq AI Active' : 'Local Engine (Offline Ready)'}</span>
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Branding & Tagline */}
          <div className="flex items-center gap-3.5">
            {/* Custom Modern Circular Icon */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-navy-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">FocusFlow AI</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent-light border border-accent/30">
                  Alexa+ Sim
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Your goals, remembered. Your next step, ready.
              </p>
            </div>
          </div>

          {/* Center: Current Goal & Session Status Badge */}
          <div className="flex items-center gap-3">
            {currentSession ? (
              <div className="flex items-center gap-2.5 bg-navy-800/90 border border-slate-700/70 rounded-lg px-3 py-1.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 line-clamp-1 max-w-[180px] sm:max-w-[240px]">
                      {currentSession.goal.title}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {currentSession.totalPlannedMinutes}m
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {completedCount}/{totalTasks} done
                    </span>
                    <span>•</span>
                    <span className="text-slate-300">
                      {currentSession.isFinished ? 'Completed' : 'Active Session'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-navy-800/50 border border-slate-800 rounded-lg px-3 py-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>No active study session. Ask Alexa+ to plan one!</span>
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
              className={`p-2 rounded-lg border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
                voiceFeedbackEnabled
                  ? 'bg-accent/20 border-accent/40 text-accent-light hover:bg-accent/30'
                  : 'bg-navy-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-navy-700'
              }`}
            >
              {voiceFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Load Demo */}
            <button
              onClick={onLoadDemo}
              title="Preload an active session with completed tasks and context memory"
              className="px-2.5 py-1.5 rounded-lg border border-cyan-800/80 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Demo</span>
            </button>

            {/* New Plan */}
            <button
              onClick={onNewPlan}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-700/80 bg-accent text-white hover:bg-accent-hover text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-light"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Plan</span>
            </button>

            {/* Reset Demo */}
            <button
              onClick={onResetSession}
              title="Reset current session progress"
              className="p-2 rounded-lg border border-slate-700 bg-navy-800 text-slate-400 hover:text-amber-400 hover:border-amber-700/60 hover:bg-navy-700 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Clear Saved Data */}
            <button
              onClick={onClearAll}
              title="Clear all saved context from browser localStorage"
              className="p-2 rounded-lg border border-slate-700 bg-navy-800 text-slate-400 hover:text-red-400 hover:border-red-700/60 hover:bg-navy-700 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
