import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ConversationMessage, 
  EngineResult, 
  SavedContext, 
  StudySession, 
  StudyTask 
} from './types';
import { 
  loadSavedContext, 
  saveContext, 
  clearSavedContext, 
  getSampleDemoContext, 
  DEFAULT_CONTEXT 
} from './services/storage';
import { 
  processUserInput, 
  createPlan, 
  adaptPlan, 
  completeTask, 
  generateSessionSummary 
} from './services/workflowEngine';
import { 
  SpeechManager, 
  SpeechAssistantState, 
  isSpeechRecognitionSupported 
} from './services/speech';
import { checkBackendHealth, queryBackendAi } from './services/api';
import { Header } from './components/Header';
import { ConversationPanel } from './components/ConversationPanel';
import { ContextPlanPanel } from './components/ContextPlanPanel';
import { CompletionModal } from './components/CompletionModal';
import { NewPlanModal } from './components/NewPlanModal';

export const App: React.FC = () => {
  // Context state (persisted to localStorage)
  const [context, setContext] = useState<SavedContext>(() => loadSavedContext());
  const [currentSession, setCurrentSession] = useState<StudySession | null>(context.currentSession);
  const [isRestoredContext, setIsRestoredContext] = useState<boolean>(Boolean(context.currentSession));

  // Chat conversation state
  const [messages, setMessages] = useState<ConversationMessage[]>(() => {
    const initialGreeting: ConversationMessage = {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `👋 **Welcome to FocusFlow AI!** I am your simulated Alexa+ study companion.\n\n*Your goals, remembered. Your next step, ready.*\n\nI can build structured study sprints, adapt your tasks dynamically when time runs short, and remember your session context.\n\nTry clicking a suggested prompt or dictating via the microphone!`,
      intent: 'welcome',
      source: 'local-engine',
      suggestedQuickReplies: [
        'Plan a 45-minute Python study session.',
        'I only have 20 minutes.',
        'Help me revise JavaScript.',
        'Summarize my progress.',
      ],
    };

    if (context.currentSession) {
      const resumeNotice: ConversationMessage = {
        id: 'msg-resume',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: `📌 **Active session restored:** "${context.currentSession.goal.title}" (${context.currentSession.totalPlannedMinutes}m).\n\nCompleted: ${context.currentSession.tasks.filter(t => t.status === 'completed').length} of ${context.currentSession.tasks.length} tasks.\n\nReady to continue where you left off, or adapt your plan?`,
        intent: 'session_resumed',
        source: 'local-engine',
        suggestedQuickReplies: [
          'Mark next task complete',
          'I only have 20 minutes',
          'Summarize my progress',
        ],
      };
      return [initialGreeting, resumeNotice];
    }

    return [initialGreeting];
  });

  // Speech Recognition & Synthesis states
  const [speechState, setSpeechState] = useState<SpeechAssistantState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(context.userPreferences.voiceFeedback);
  const [unsupportedSpeechMessage, setUnsupportedSpeechMessage] = useState<string | null>(null);

  // Modals & dialogues
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionSummaryText, setCompletionSummaryText] = useState('');
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);

  // Backend AI status
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [useBackendAi, setUseBackendAi] = useState(context.userPreferences.useBackendAiIfAvailable);

  const speechManagerRef = useRef<SpeechManager | null>(null);

  // Synchronize state changes to localStorage
  useEffect(() => {
    const updatedContext: SavedContext = {
      ...context,
      currentSession,
      userPreferences: {
        ...context.userPreferences,
        voiceFeedback: voiceFeedbackEnabled,
        useBackendAiIfAvailable: useBackendAi,
      },
      lastActiveAt: new Date().toISOString(),
      contextSummary: currentSession
        ? `Session: ${currentSession.goal.title} (${currentSession.tasks.filter(t => t.status === 'completed').length}/${currentSession.tasks.length} done).`
        : 'No active session.',
    };
    saveContext(updatedContext);
  }, [currentSession, voiceFeedbackEnabled, useBackendAi]);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then((health) => {
      setBackendAvailable(health.available && health.hasApiKey);
    });
  }, []);

  // Handle incoming user request (text or voice)
  const handleUserMessage = useCallback(
    async (text: string, isVoice = false) => {
      // 1. Append user message to conversation
      const userMsg: ConversationMessage = {
        id: `msg-user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toISOString(),
        isVoice,
      };

      setMessages(prev => [...prev, userMsg]);
      setSpeechState('thinking');

      let result: EngineResult | null = null;

      // 2. Try optional backend AI if enabled and reachable
      if (useBackendAi && backendAvailable) {
        result = await queryBackendAi(text, currentSession, [...messages, userMsg]);
      }

      // 3. Fallback to local workflow engine (baseline demo guaranteed)
      if (!result) {
        result = processUserInput(text, currentSession, [...messages, userMsg]);
      }

      // 4. Update session state if workflow engine altered it
      if (result.updatedSession !== undefined) {
        setCurrentSession(result.updatedSession);
        setIsRestoredContext(false);
      }

      // 5. Append assistant reply to conversation
      setMessages(prev => [...prev, result!.message]);
      setSpeechState('idle');

      // 6. If session finished, open completion modal
      if (result.action === 'session_finished' && result.updatedSession) {
        setCompletionSummaryText(result.message.text);
        setShowCompletionModal(true);
      }

      // 7. Voice response (speak aloud if voice feedback enabled)
      if (voiceFeedbackEnabled && result.speechText && speechManagerRef.current) {
        speechManagerRef.current.speak(result.speechText);
      }
    },
    [currentSession, messages, useBackendAi, backendAvailable, voiceFeedbackEnabled]
  );

  // Initialize SpeechManager
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setUnsupportedSpeechMessage('Web Speech API is not supported in this browser. Text input is fully functional!');
    }

    speechManagerRef.current = new SpeechManager({
      onResult: (transcript) => {
        handleUserMessage(transcript, true);
      },
      onError: (errMsg) => {
        setUnsupportedSpeechMessage(errMsg);
        setIsListening(false);
      },
      onStateChange: (state) => {
        setSpeechState(state);
        setIsListening(state === 'listening');
      },
    });

    speechManagerRef.current.setVoiceEnabled(voiceFeedbackEnabled);

    return () => {
      speechManagerRef.current?.stopListening();
    };
  }, [handleUserMessage, voiceFeedbackEnabled]);

  // Toggle voice dictation
  const handleToggleMic = () => {
    if (!speechManagerRef.current) return;
    setUnsupportedSpeechMessage(null);
    speechManagerRef.current.startListening();
  };

  // Toggle voice audio output feedback
  const handleToggleVoiceFeedback = () => {
    const nextVal = !voiceFeedbackEnabled;
    setVoiceFeedbackEnabled(nextVal);
    speechManagerRef.current?.setVoiceEnabled(nextVal);
  };

  // Workflow C: Toggle task complete / in-progress
  const handleToggleTask = (taskId: string) => {
    if (!currentSession) return;

    const task = currentSession.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'completed') {
      // Revert to pending
      const updatedTasks: StudyTask[] = currentSession.tasks.map(t =>
        t.id === taskId ? { ...t, status: 'pending', completedAt: undefined } : t
      );
      const updatedSession: StudySession = {
        ...currentSession,
        tasks: updatedTasks,
        updatedAt: new Date().toISOString(),
        totalElapsedMinutes: Math.max(0, currentSession.totalElapsedMinutes - task.estimatedMinutes),
        isFinished: false,
      };
      setCurrentSession(updatedSession);
      return;
    }

    // Mark task complete via Workflow Engine
    const completion = completeTask(currentSession, taskId);
    if (completion) {
      setCurrentSession(completion.updatedSession);

      const msg: ConversationMessage = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: completion.message,
        intent: 'task_completed',
        source: 'local-engine',
        suggestedQuickReplies: completion.updatedSession.isFinished
          ? ['Finish session', 'Start a new plan']
          : ['I only have 15 minutes left', 'Summarize my progress'],
      };

      setMessages(prev => [...prev, msg]);

      if (voiceFeedbackEnabled && speechManagerRef.current) {
        speechManagerRef.current.speak(completion.message);
      }

      if (completion.updatedSession.isFinished) {
        const summary = generateSessionSummary(completion.updatedSession);
        setCompletionSummaryText(summary);
        setShowCompletionModal(true);
      }
    }
  };

  // Inline duration adjustment (+/- minutes on task card)
  const handleUpdateTaskMinutes = (taskId: string, delta: number) => {
    if (!currentSession) return;
    const updatedTasks = currentSession.tasks.map(t => {
      if (t.id === taskId) {
        const newMins = Math.max(5, t.estimatedMinutes + delta);
        return { ...t, estimatedMinutes: newMins };
      }
      return t;
    });

    const newTotal = updatedTasks.reduce((s, t) => s + t.estimatedMinutes, 0);
    setCurrentSession({
      ...currentSession,
      tasks: updatedTasks,
      totalPlannedMinutes: newTotal,
      updatedAt: new Date().toISOString(),
    });
  };

  // Quick Adapt (e.g. Fit 20m, 30m)
  const handleQuickAdapt = (minutes: number) => {
    if (!currentSession) return;
    const { updatedSession, explanation } = adaptPlan(currentSession, minutes);
    setCurrentSession(updatedSession);

    const msg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: explanation,
      intent: 'plan_adapted',
      source: 'local-engine',
      suggestedQuickReplies: ['Mark current task complete', 'Summarize my progress'],
    };

    setMessages(prev => [...prev, msg]);
    if (voiceFeedbackEnabled && speechManagerRef.current) {
      speechManagerRef.current.speak(explanation);
    }
  };

  // Struggling trigger
  const handleStruggling = () => {
    if (!currentSession) return;
    const { updatedSession, explanation } = adaptPlan(currentSession, undefined, true);
    setCurrentSession(updatedSession);

    const msg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: explanation,
      intent: 'plan_adapted_struggling',
      source: 'local-engine',
      suggestedQuickReplies: ['Mark first micro-step complete', 'Summarize my progress'],
    };

    setMessages(prev => [...prev, msg]);
    if (voiceFeedbackEnabled && speechManagerRef.current) {
      speechManagerRef.current.speak(explanation);
    }
  };

  // Workflow E: Finish Session
  const handleFinishSession = () => {
    if (!currentSession) return;
    const summary = generateSessionSummary(currentSession);
    const finishedSession: StudySession = {
      ...currentSession,
      isFinished: true,
      completionSummary: summary,
      updatedAt: new Date().toISOString(),
    };

    setCurrentSession(finishedSession);
    setCompletionSummaryText(summary);
    setShowCompletionModal(true);

    const msg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: summary,
      intent: 'session_finished',
      source: 'local-engine',
      suggestedQuickReplies: ['Start a new plan', 'Clear saved data'],
    };

    setMessages(prev => [...prev, msg]);
    if (voiceFeedbackEnabled && speechManagerRef.current) {
      speechManagerRef.current.speak('Session finished. Here is your summary.');
    }
  };

  // Workflow A: Create plan from modal
  const handleCreatePlanFromModal = (topic: string, minutes: number) => {
    const session = createPlan(topic, minutes);
    setCurrentSession(session);
    setIsRestoredContext(false);

    const msg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `Created a **${minutes}-minute** study plan for **${topic}**.\n\nFirst focus: **${session.tasks[0]?.title}** (${session.tasks[0]?.estimatedMinutes}m).`,
      intent: 'plan_created',
      source: 'local-engine',
      suggestedQuickReplies: ['Mark first task done', 'I only have 20 minutes', 'Summarize my progress'],
    };

    setMessages(prev => [...prev, msg]);
    if (voiceFeedbackEnabled && speechManagerRef.current) {
      speechManagerRef.current.speak(`Created a ${minutes}-minute plan for ${topic}.`);
    }
  };

  // Load Demo scenario
  const handleLoadDemo = () => {
    const demoCtx = getSampleDemoContext();
    setContext(demoCtx);
    setCurrentSession(demoCtx.currentSession);
    setIsRestoredContext(true);

    const demoMsg: ConversationMessage = {
      id: `msg-demo-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `🚀 **Demo Session Loaded:** Python AsyncIO (45m Sprint).\n- Task 1 was previously completed.\n- Task 2 is active.\n- Context is preserved in localStorage.\n\nTry saying: *"I only have 20 minutes"* to observe adaptive re-budgeting while preserving completed work!`,
      intent: 'demo_loaded',
      source: 'local-engine',
      suggestedQuickReplies: [
        'I only have 20 minutes.',
        "I'm struggling with this concept.",
        'Mark next task complete',
        'Summarize my progress.',
      ],
    };

    setMessages(prev => [...prev, demoMsg]);
  };

  // Reset Session
  const handleResetSession = () => {
    if (!currentSession) return;
    const resetTasks: StudyTask[] = currentSession.tasks.map((t, idx) => ({
      ...t,
      status: idx === 0 ? 'in_progress' : 'pending',
      completedAt: undefined,
    }));
    setCurrentSession({
      ...currentSession,
      tasks: resetTasks,
      totalElapsedMinutes: 0,
      isFinished: false,
      activeTaskId: resetTasks[0]?.id,
      updatedAt: new Date().toISOString(),
    });

    const msg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `Session progress reset for "${currentSession.goal.title}". All tasks are pending. Ready to start again!`,
      intent: 'session_reset',
      source: 'local-engine',
      suggestedQuickReplies: ['Mark first task done', 'Summarize my progress'],
    };
    setMessages(prev => [...prev, msg]);
  };

  // Clear all saved data
  const handleClearAll = () => {
    clearSavedContext();
    setContext(DEFAULT_CONTEXT);
    setCurrentSession(null);
    setIsRestoredContext(false);

    const msg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `🧹 **Storage Cleared:** All active sessions and saved memory have been reset to a clean slate.`,
      intent: 'cleared_all',
      source: 'local-engine',
      suggestedQuickReplies: [
        'Plan a 45-minute Python study session.',
        'Help me revise JavaScript.',
      ],
    };
    setMessages([msg]);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
      {/* Global Application Header */}
      <Header
        currentSession={currentSession}
        speechState={speechState}
        isListening={isListening}
        onToggleMic={handleToggleMic}
        voiceFeedbackEnabled={voiceFeedbackEnabled}
        onToggleVoiceFeedback={handleToggleVoiceFeedback}
        onNewPlan={() => setShowNewPlanModal(true)}
        onLoadDemo={handleLoadDemo}
        onResetSession={handleResetSession}
        onClearAll={handleClearAll}
        backendAvailable={backendAvailable}
        useBackendAi={useBackendAi}
        onToggleBackendAi={() => setUseBackendAi(!useBackendAi)}
        unsupportedSpeechMessage={unsupportedSpeechMessage}
      />

      {/* Main Content Area: Responsive Split Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Left Column: Conversational Area (7 cols on desktop) */}
        <section className="lg:col-span-7 h-[680px] lg:h-[calc(100vh-140px)] flex flex-col min-h-0">
          <ConversationPanel
            messages={messages}
            onSendMessage={(txt) => handleUserMessage(txt, false)}
            speechState={speechState}
            isListening={isListening}
            onToggleMic={handleToggleMic}
            unsupportedSpeechMessage={unsupportedSpeechMessage}
          />
        </section>

        {/* Right Column: Contextual Plan & Action Area (5 cols on desktop) */}
        <section className="lg:col-span-5 h-[680px] lg:h-[calc(100vh-140px)] flex flex-col min-h-0">
          <ContextPlanPanel
            currentSession={currentSession}
            onToggleTask={handleToggleTask}
            onUpdateTaskMinutes={handleUpdateTaskMinutes}
            onQuickAdapt={handleQuickAdapt}
            onStruggling={handleStruggling}
            onFinishSession={handleFinishSession}
            onNewPlan={() => setShowNewPlanModal(true)}
            isRestoredContext={isRestoredContext}
          />
        </section>
      </main>

      {/* Completion Modal */}
      {showCompletionModal && currentSession && (
        <CompletionModal
          session={currentSession}
          summaryText={completionSummaryText}
          onClose={() => setShowCompletionModal(false)}
          onNewSession={() => {
            setShowCompletionModal(false);
            setShowNewPlanModal(true);
          }}
        />
      )}

      {/* New Plan Setup Modal */}
      <NewPlanModal
        isOpen={showNewPlanModal}
        onClose={() => setShowNewPlanModal(false)}
        onCreatePlan={handleCreatePlanFromModal}
      />
    </div>
  );
};

export default App;
