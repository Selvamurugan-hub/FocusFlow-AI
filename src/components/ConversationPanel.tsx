import React, { useState, useRef, useEffect } from 'react';
import { ConversationMessage } from '../types';
import { SpeechAssistantState } from '../services/speech';
import { 
  Send, 
  Mic, 
  Sparkles, 
  Cpu, 
  Bot, 
  User, 
  ArrowRight, 
  Clock, 
  Compass, 
  AlertTriangle 
} from 'lucide-react';

interface ConversationPanelProps {
  messages: ConversationMessage[];
  onSendMessage: (text: string) => void;
  speechState: SpeechAssistantState;
  isListening: boolean;
  onToggleMic: () => void;
  unsupportedSpeechMessage?: string | null;
  onClearChat?: () => void;
}

const DEFAULT_SUGGESTED_PROMPTS = [
  'Plan a 45-minute Python study session.',
  'I only have 15 minutes left.',
  'Help me revise JavaScript.',
  'Summarize my progress.',
];

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
  onSendMessage,
  speechState,
  isListening,
  onToggleMic,
  unsupportedSpeechMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, speechState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handlePromptClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex flex-col h-full bg-navy-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header of Conversation Area */}
      <div className="px-4 py-3.5 border-b border-slate-800 bg-navy-850/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></div>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Alexa+ Conversational Interface
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulated Context Engine</span>
          </span>
        </div>
      </div>

      {/* Suggested Prompts Shelf */}
      <div className="p-3 sm:p-3.5 border-b border-slate-800/80 bg-navy-850/50">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-300">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Quick Study Prompts:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              className="text-left text-xs font-medium bg-navy-800/90 hover:bg-slate-700/80 hover:text-white text-slate-200 border border-slate-700/70 px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 shadow-sm group focus:outline-none focus:ring-1 focus:ring-accent active:scale-95"
            >
              <span>{prompt}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              <div className="flex items-end gap-2.5 max-w-[92%] sm:max-w-[85%]">
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/80 text-cyan-400 flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-accent text-white rounded-br-xs font-medium'
                      : 'bg-navy-800 border border-slate-700/80 text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {/* Message body */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Message Footer metadata */}
                  <div
                    className={`mt-2 flex items-center gap-2 text-[11px] ${
                      isUser ? 'text-indigo-200 justify-end' : 'text-slate-400 justify-between'
                    }`}
                  >
                    {!isUser && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-navy-950/80 border border-slate-700/60 font-semibold text-slate-300">
                        {msg.source === 'groq-ai' ? (
                          <>
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Groq LLaMA</span>
                          </>
                        ) : (
                          <>
                            <Cpu className="w-3 h-3 text-cyan-400" />
                            <span>Local Workflow Engine</span>
                          </>
                        )}
                      </span>
                    )}

                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 opacity-70" />
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Quick Reply Suggestions for the latest assistant message */}
        {!lastMessage?.sender && (
          <div className="text-center text-xs text-slate-400 py-6 font-medium">
            Ready to plan your study session. Type a request or select a quick study prompt.
          </div>
        )}

        {lastMessage?.sender === 'assistant' && lastMessage.suggestedQuickReplies && (
          <div className="pt-2 pl-10">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-2">
              Suggested next action:
            </span>
            <div className="flex flex-wrap gap-2">
              {lastMessage.suggestedQuickReplies.map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePromptClick(reply)}
                  className="text-xs font-semibold bg-navy-800 hover:bg-indigo-950 hover:text-cyan-300 hover:border-cyan-700 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-full transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500 active:scale-95"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Listening / Thinking feedback */}
        {speechState === 'listening' && (
          <div className="flex items-center gap-2 pl-10 text-xs text-cyan-400 font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            Listening... Speak your study topic or time change now.
          </div>
        )}

        {speechState === 'thinking' && (
          <div className="flex items-center gap-2 pl-10 text-xs text-indigo-300 font-semibold">
            <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
            FocusFlow AI is formulating your plan...
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Unsupported browser speech warning if applicable */}
      {unsupportedSpeechMessage && (
        <div className="px-4 py-2 bg-amber-950/70 border-t border-amber-800/60 text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{unsupportedSpeechMessage}</span>
        </div>
      )}

      {/* Conversation Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-slate-800 bg-navy-850/90 flex items-center gap-2.5"
      >
        {/* Voice dictation mic button */}
        <button
          type="button"
          onClick={onToggleMic}
          aria-label={isListening ? 'Stop listening' : 'Start voice dictation'}
          title={isListening ? 'Listening... click to stop' : 'Click to dictate via microphone'}
          className={`p-2.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent active:scale-95 ${
            isListening
              ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/40 animate-pulse'
              : 'bg-navy-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
          }`}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-white' : ''}`} />
        </button>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Alexa+ to plan, adapt, or complete tasks..."
          className="flex-1 bg-navy-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!inputText.trim()}
          aria-label="Send message"
          title="Send message to assistant"
          className="p-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white disabled:opacity-40 disabled:hover:bg-accent transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-light active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
