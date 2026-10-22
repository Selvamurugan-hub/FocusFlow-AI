export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface StudyTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: TaskPriority;
  status: TaskStatus;
  order: number;
  completedAt?: string;
  notes?: string;
}

export interface StudyGoal {
  id: string;
  title: string;
  category: string;
  targetMinutes: number;
  createdAt: string;
  notes?: string;
}

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  intent?: string;
  suggestedQuickReplies?: string[];
  isVoice?: boolean;
  source?: 'local-engine' | 'groq-ai';
  metadata?: {
    taskCount?: number;
    adaptedMinutes?: number;
    completedTaskId?: string;
    actionTaken?: string;
  };
}

export interface StudySession {
  id: string;
  goal: StudyGoal;
  tasks: StudyTask[];
  startedAt: string;
  updatedAt: string;
  totalPlannedMinutes: number;
  totalElapsedMinutes: number;
  isFinished: boolean;
  completionSummary?: string;
  activeTaskId?: string;
}

export interface SavedContext {
  currentSession: StudySession | null;
  sessionHistory: StudySession[];
  recentTopics: string[];
  userPreferences: {
    defaultSessionMinutes: number;
    voiceFeedback: boolean;
    autoAdvanceTasks: boolean;
    useBackendAiIfAvailable: boolean;
  };
  lastActiveAt: string;
  contextSummary?: string;
}

export interface EngineResult {
  message: ConversationMessage;
  updatedSession?: StudySession | null;
  action: 'none' | 'plan_created' | 'plan_adapted' | 'task_completed' | 'session_finished' | 'clarification_needed';
  speechText?: string;
}
