import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createPlan, 
  adaptPlan, 
  completeTask, 
  processUserInput, 
  generateSessionSummary 
} from '../services/workflowEngine';
import { 
  loadSavedContext, 
  saveContext, 
  DEFAULT_CONTEXT 
} from '../services/storage';

const mockStorage: Record<string, string> = {};

describe('FocusFlow AI - Critical Workflow Logic Tests', () => {
  beforeEach(() => {
    // Ensure localStorage is available even in Node/Vitest environment
    if (typeof globalThis.window === 'undefined' || !globalThis.window.localStorage) {
      (globalThis as any).window = {
        localStorage: {
          getItem: (key: string) => mockStorage[key] || null,
          setItem: (key: string, val: string) => { mockStorage[key] = val; },
          removeItem: (key: string) => { delete mockStorage[key]; },
          clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
        },
      };
    } else {
      globalThis.window.localStorage.clear();
    }
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  // 1. Creating a plan with a valid time budget
  it('1. should create a plan with a valid time budget and balanced durations', () => {
    const session = createPlan('Python AsyncIO', 45);

    expect(session).toBeDefined();
    expect(session.goal.title).toBe('Python AsyncIO');
    expect(session.goal.targetMinutes).toBe(45);
    expect(session.tasks.length).toBeGreaterThanOrEqual(3);

    // Verify task durations sum up to the target time
    const totalMinutes = session.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    expect(totalMinutes).toBe(45);

    // First task should be marked in_progress or pending, with order assigned
    expect(session.tasks[0].order).toBe(1);
    expect(session.tasks[0].status).toBe('in_progress');
    expect(session.isFinished).toBe(false);
  });

  // 2. Adapting a plan to a shorter time budget
  it('2. should adapt a plan to a shorter time budget', () => {
    const initialSession = createPlan('JavaScript Promises', 60);
    const originalCount = initialSession.tasks.length;
    expect(originalCount).toBeGreaterThanOrEqual(2);

    const { updatedSession, explanation } = adaptPlan(initialSession, 20);

    expect(updatedSession).toBeDefined();
    expect(explanation).toContain('Adapted your schedule for 20 total minutes');
    expect(updatedSession.totalPlannedMinutes).toBe(20);

    // Sum of remaining tasks should fit within 20 minutes
    const totalMins = updatedSession.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    expect(totalMins).toBeLessThanOrEqual(20);
  });

  // 3. Preserving completed tasks when adapting
  it('3. should strictly preserve completed tasks when adapting', () => {
    const session = createPlan('React Hooks', 45);
    const firstTaskId = session.tasks[0].id;

    // Complete the first task
    const completionResult = completeTask(session, firstTaskId);
    expect(completionResult).not.toBeNull();
    const sessionWithOneDone = completionResult!.updatedSession;

    expect(sessionWithOneDone.tasks[0].status).toBe('completed');
    const completedTaskId = sessionWithOneDone.tasks[0].id;
    const completedMinutes = sessionWithOneDone.tasks[0].estimatedMinutes;

    // Now adapt the remaining session to a new 25-minute budget
    const { updatedSession, explanation } = adaptPlan(sessionWithOneDone, 25);

    // Verified: First task is still completed and intact!
    const foundCompleted = updatedSession.tasks.find(t => t.id === completedTaskId);
    expect(foundCompleted).toBeDefined();
    expect(foundCompleted?.status).toBe('completed');
    expect(foundCompleted?.estimatedMinutes).toBe(completedMinutes);
    expect(explanation).toContain('Kept your 1 completed task(s) intact');
  });

  // 4. Updating progress correctly after task completion
  it('4. should update progress and avoid duplicate counting or over-completion', () => {
    const session = createPlan('System Design', 30);
    const task1 = session.tasks[0];

    // Complete task 1
    const res1 = completeTask(session, task1.id);
    expect(res1).not.toBeNull();
    expect(res1!.updatedSession.tasks.filter(t => t.status === 'completed').length).toBe(1);
    expect(res1!.updatedSession.totalElapsedMinutes).toBe(task1.estimatedMinutes);

    // Calling complete on already completed task should NOT duplicate elapsed minutes
    const duplicateRes = completeTask(res1!.updatedSession, task1.id);
    expect(duplicateRes!.updatedSession.totalElapsedMinutes).toBe(task1.estimatedMinutes);
    expect(duplicateRes!.message).toContain('is already marked as completed');
  });

  // 5. Restoring saved context after reload
  it('5. should safely persist and restore context from localStorage', () => {
    const session = createPlan('Data Structures', 40);
    const mockContext = {
      ...DEFAULT_CONTEXT,
      currentSession: session,
      contextSummary: 'Active session: Data Structures',
    };

    // Save
    const savedOk = saveContext(mockContext);
    expect(savedOk).toBe(true);

    // Restore
    const restored = loadSavedContext();
    expect(restored.currentSession).not.toBeNull();
    expect(restored.currentSession?.goal.title).toBe('Data Structures');
    expect(restored.currentSession?.tasks.length).toBe(session.tasks.length);
  });

  // 6. Handling empty input and malformed saved data
  it('6. should handle malformed localStorage data gracefully without throwing', () => {
    // Inject corrupt JSON into storage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('focusflow_ai_context_v1', '{ corrupt_json: undefined, invalid');
    }

    const fallbackContext = loadSavedContext();
    expect(fallbackContext).toBeDefined();
    expect(fallbackContext.currentSession).toBeNull();
    expect(fallbackContext.userPreferences.defaultSessionMinutes).toBe(45);

    // Test empty user input in processUserInput
    const emptyResult = processUserInput('', null, []);
    expect(emptyResult.message).toBeDefined();
    expect(emptyResult.action).toBe('none');
  });

  // 7. Working in local/demo mode without API credentials
  it('7. should operate completely offline with intelligent intent matching and plan generation', () => {
    // Workflow A via conversational input
    const inputMsg = 'Plan a 45-minute Python study session.';
    const result = processUserInput(inputMsg, null, []);

    expect(result.action).toBe('plan_created');
    expect(result.updatedSession).toBeDefined();
    expect(result.updatedSession?.goal.targetMinutes).toBe(45);
    expect(result.message.source).toBe('local-engine');

    // Workflow B: Adapting via conversational input
    const adaptMsg = 'I only have 20 minutes';
    const adaptResult = processUserInput(adaptMsg, result.updatedSession!, [result.message]);

    expect(adaptResult.action).toBe('plan_adapted');
    expect(adaptResult.updatedSession?.totalPlannedMinutes).toBe(20);

    // Workflow E: Honest summary generation
    const summary = generateSessionSummary(adaptResult.updatedSession!);
    expect(summary).toContain('Study Session Summary:');
    expect(summary).toContain('**Time Planned:** 20 minutes');
  });

  // 8. Testing the specific "I only have 15 minutes left" flow
  it('8. should adapt session when user says "I only have 15 minutes left", preserving completed tasks and fitting unfinished tasks into 15 minutes', () => {
    const session = createPlan('Python AsyncIO', 45);
    const firstTaskId = session.tasks[0].id;
    const firstTaskMinutes = session.tasks[0].estimatedMinutes;

    // Complete the first task (e.g. 15 min)
    const completionResult = completeTask(session, firstTaskId);
    expect(completionResult).not.toBeNull();
    const activeSession = completionResult!.updatedSession;

    // Process user conversational input: "I only have 15 minutes left"
    const result = processUserInput('I only have 15 minutes left', activeSession, []);

    expect(result.action).toBe('plan_adapted');
    expect(result.updatedSession).toBeDefined();

    const adapted = result.updatedSession!;
    const completedTasks = adapted.tasks.filter(t => t.status === 'completed');
    const incompleteTasks = adapted.tasks.filter(t => t.status !== 'completed');

    // 1. Completed task is preserved
    expect(completedTasks.length).toBe(1);
    expect(completedTasks[0].id).toBe(firstTaskId);
    expect(completedTasks[0].estimatedMinutes).toBe(firstTaskMinutes);

    // 2. Unfinished tasks fit into the 15-minute remaining budget
    const remainingMinutes = incompleteTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    expect(remainingMinutes).toBe(15);

    // 3. Total planned minutes is completed + remaining
    expect(adapted.totalPlannedMinutes).toBe(firstTaskMinutes + 15);
  });
});
