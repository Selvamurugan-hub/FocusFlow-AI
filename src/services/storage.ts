import { SavedContext, StudySession } from '../types';

const STORAGE_KEY = 'focusflow_ai_context_v1';

export const DEFAULT_CONTEXT: SavedContext = {
  currentSession: null,
  sessionHistory: [],
  recentTopics: ['Python', 'JavaScript', 'Data Structures'],
  userPreferences: {
    defaultSessionMinutes: 45,
    voiceFeedback: false,
    autoAdvanceTasks: true,
    useBackendAiIfAvailable: false,
  },
  lastActiveAt: new Date().toISOString(),
  contextSummary: 'No active study session yet. Ready to start.',
};

/**
 * Validates and sanitizes context loaded from localStorage
 */
function validateContext(data: unknown): SavedContext {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_CONTEXT, lastActiveAt: new Date().toISOString() };
  }

  const raw = data as Partial<SavedContext>;

  // Validate currentSession structure if present
  let currentSession: StudySession | null = null;
  if (raw.currentSession && typeof raw.currentSession === 'object') {
    const cs = raw.currentSession as Partial<StudySession>;
    if (cs.id && cs.goal && Array.isArray(cs.tasks)) {
      currentSession = {
        id: String(cs.id),
        goal: {
          id: String(cs.goal.id || 'goal-1'),
          title: String(cs.goal.title || 'General Study'),
          category: String(cs.goal.category || 'General'),
          targetMinutes: Number(cs.goal.targetMinutes) || 45,
          createdAt: String(cs.goal.createdAt || new Date().toISOString()),
          notes: cs.goal.notes ? String(cs.goal.notes) : undefined,
        },
        tasks: cs.tasks.map((t, idx) => ({
          id: String(t.id || `task-${idx + 1}`),
          title: String(t.title || `Task ${idx + 1}`),
          description: String(t.description || ''),
          estimatedMinutes: Math.max(1, Number(t.estimatedMinutes) || 10),
          priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
          status: ['pending', 'in_progress', 'completed', 'skipped'].includes(t.status) ? t.status : 'pending',
          order: Number(t.order) || idx + 1,
          completedAt: t.completedAt ? String(t.completedAt) : undefined,
          notes: t.notes ? String(t.notes) : undefined,
        })),
        startedAt: String(cs.startedAt || new Date().toISOString()),
        updatedAt: String(cs.updatedAt || new Date().toISOString()),
        totalPlannedMinutes: Number(cs.totalPlannedMinutes) || 45,
        totalElapsedMinutes: Number(cs.totalElapsedMinutes) || 0,
        isFinished: Boolean(cs.isFinished),
        completionSummary: cs.completionSummary ? String(cs.completionSummary) : undefined,
        activeTaskId: cs.activeTaskId ? String(cs.activeTaskId) : undefined,
      };
    }
  }

  return {
    currentSession,
    sessionHistory: Array.isArray(raw.sessionHistory) ? raw.sessionHistory : [],
    recentTopics: Array.isArray(raw.recentTopics) && raw.recentTopics.length > 0 
      ? raw.recentTopics.map(String) 
      : DEFAULT_CONTEXT.recentTopics,
    userPreferences: {
      defaultSessionMinutes: Number(raw.userPreferences?.defaultSessionMinutes) || 45,
      voiceFeedback: Boolean(raw.userPreferences?.voiceFeedback),
      autoAdvanceTasks: raw.userPreferences?.autoAdvanceTasks !== false,
      useBackendAiIfAvailable: Boolean(raw.userPreferences?.useBackendAiIfAvailable),
    },
    lastActiveAt: new Date().toISOString(),
    contextSummary: raw.contextSummary ? String(raw.contextSummary) : undefined,
  };
}

/**
 * Load context from localStorage safely
 */
export function loadSavedContext(): SavedContext {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_CONTEXT;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CONTEXT;
    }
    const parsed = JSON.parse(raw);
    return validateContext(parsed);
  } catch (error) {
    console.warn('[FocusFlow Storage] Failed to parse stored context; falling back to default', error);
    return DEFAULT_CONTEXT;
  }
}

/**
 * Save context to localStorage safely
 */
export function saveContext(context: SavedContext): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const payload: SavedContext = {
      ...context,
      lastActiveAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('[FocusFlow Storage] Failed to save context', error);
    return false;
  }
}

/**
 * Clear saved context from localStorage
 */
export function clearSavedContext(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[FocusFlow Storage] Failed to clear context', error);
  }
}

/**
 * Pre-configured demo scenario for one-click Hackathon presentation
 * Demonstrates: active session, preserved completed task, context memory
 */
export function getSampleDemoContext(): SavedContext {
  const now = new Date();
  const startedAt = new Date(now.getTime() - 25 * 60 * 1000).toISOString(); // 25 mins ago
  const completedAt = new Date(now.getTime() - 10 * 60 * 1000).toISOString(); // 10 mins ago

  const sampleSession: StudySession = {
    id: 'demo-session-python-45',
    goal: {
      id: 'goal-demo-1',
      title: 'Python FastTrack: Asynchronous Programming & AsyncIO',
      category: 'Computer Science & Python',
      targetMinutes: 45,
      createdAt: startedAt,
      notes: 'Prepare for async backend project architecture and task queues.',
    },
    tasks: [
      {
        id: 'task-demo-1',
        title: 'Core async/await syntax & event loop fundamentals',
        description: 'Understand coroutines, tasks, and how the event loop coordinates non-blocking I/O.',
        estimatedMinutes: 15,
        priority: 'high',
        status: 'completed',
        order: 1,
        completedAt: completedAt,
      },
      {
        id: 'task-demo-2',
        title: 'Hands-on: asyncio.gather() & TaskGroup error handling',
        description: 'Write concurrent HTTP fetcher with exception handling and timeouts.',
        estimatedMinutes: 20,
        priority: 'high',
        status: 'in_progress',
        order: 2,
      },
      {
        id: 'task-demo-3',
        title: 'Knowledge check: Async queues & worker patterns',
        description: 'Review common pitfalls like blocking code in coroutines and race conditions.',
        estimatedMinutes: 10,
        priority: 'medium',
        status: 'pending',
        order: 3,
      },
    ],
    startedAt,
    updatedAt: now.toISOString(),
    totalPlannedMinutes: 45,
    totalElapsedMinutes: 15,
    isFinished: false,
    activeTaskId: 'task-demo-2',
    completionSummary: undefined,
  };

  return {
    currentSession: sampleSession,
    sessionHistory: [],
    recentTopics: ['Python AsyncIO', 'JavaScript Promises', 'SQL Indexing'],
    userPreferences: {
      defaultSessionMinutes: 45,
      voiceFeedback: false,
      autoAdvanceTasks: true,
      useBackendAiIfAvailable: false,
    },
    lastActiveAt: now.toISOString(),
    contextSummary: 'Active study session: Python AsyncIO (1 of 3 tasks completed, 15m elapsed). Current focus: asyncio.gather().',
  };
}
