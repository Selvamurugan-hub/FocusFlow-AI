import React from 'react';
import { SpeechAssistantState } from '../services/speech';
import { Mic, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface VoiceIndicatorProps {
  state: SpeechAssistantState;
  isVoiceActive: boolean;
  onToggleMic: () => void;
  unsupportedMessage?: string | null;
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  state,
  isVoiceActive,
  onToggleMic,
  unsupportedMessage,
}) => {
  return (
    <div className="flex items-center gap-3 bg-navy-800/80 border border-slate-700/60 rounded-full px-3.5 py-1.5 shadow-sm backdrop-blur-sm">
      {/* Alexa+ Simulated Halo Ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulsating glow ring */}
        <div
          className={`absolute w-8 h-8 rounded-full transition-all duration-300 pointer-events-none ${
            state === 'listening'
              ? 'bg-cyan-500/30 ring-2 ring-cyan-400 animate-ping'
              : state === 'speaking'
              ? 'bg-indigo-500/30 ring-2 ring-indigo-400 animate-pulse'
              : state === 'thinking'
              ? 'bg-violet-500/30 ring-2 ring-violet-400 animate-spin'
              : state === 'error'
              ? 'bg-amber-500/30 ring-1 ring-amber-400'
              : 'bg-indigo-600/20 ring-1 ring-indigo-500/40'
          }`}
        />

        {/* Inner orb button */}
        <button
          onClick={onToggleMic}
          type="button"
          aria-label={isVoiceActive ? 'Stop listening' : 'Start voice dictation'}
          title={isVoiceActive ? 'Listening... click to stop' : 'Click to speak to Alexa+'}
          className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${
            state === 'listening'
              ? 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50 scale-105'
              : state === 'speaking'
              ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
              : state === 'thinking'
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
              : 'bg-navy-700 text-slate-300 hover:text-white hover:bg-slate-600'
          }`}
        >
          {state === 'listening' ? (
            <Mic className="w-3.5 h-3.5 animate-bounce" />
          ) : state === 'speaking' ? (
            <Volume2 className="w-3.5 h-3.5" />
          ) : state === 'thinking' ? (
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
          ) : state === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* State label & badge */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-200">
            {state === 'listening'
              ? 'Alexa+ Listening...'
              : state === 'speaking'
              ? 'Alexa+ Speaking...'
              : state === 'thinking'
              ? 'Alexa+ Thinking...'
              : 'Alexa+ Simulated'}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium rounded text-cyan-300 bg-cyan-950/80 border border-cyan-800/60">
            Voice
          </span>
        </div>
        <span className="text-[10px] text-slate-400 leading-tight">
          {unsupportedMessage
            ? 'Browser speech unsupported'
            : isVoiceActive
            ? 'Speak your request now'
            : 'Click mic or type below'}
        </span>
      </div>
    </div>
  );
};
