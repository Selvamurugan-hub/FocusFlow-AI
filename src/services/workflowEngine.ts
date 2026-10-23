import {
  ConversationMessage,
  EngineResult,
  StudyGoal,
  StudySession,
  StudyTask,
  TaskPriority,
} from '../types';

/**
 * Extract time budget in minutes from user message
 * Supports: "45 mins", "45 minutes", "45m", "1 hour", "1.5 hours", "half an hour", etc.
 */
export function extractMinutes(text: string): number | null {
  const lower = text.toLowerCase();

  // "half an hour"
  if (lower.includes('half an hour') || lower.includes('half hour')) {
    return 30;
  }
  // "quarter of an hour"
  if (lower.includes('quarter of an hour') || lower.includes('quarter hour')) {
    return 15;
  }
  // "an hour"
  if (/\b(an|one)\s+hour\b/.test(lower)) {
    return 60;
  }

  // Hours: e.g. "1.5 hours", "2 hrs", "2.5 hr", "1-hour"
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)[\s-]*(?:hours|hour|hrs|hr)\b/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    if (!isNaN(hours) && hours > 0) {
      return Math.round(hours * 60);
    }
  }

  // Minutes: e.g. "45 minutes", "45-minute", "20 mins", "15 min", "30m"
  const minuteMatch = lower.match(/(\d+)[\s-]*(?:minutes|minute|mins|min|m)\b/);
  if (minuteMatch) {
    const mins = parseInt(minuteMatch[1], 10);
    if (!isNaN(mins) && mins > 0) {
      return mins;
    }
  }

  // Bare number when context is clearly time, e.g. "just 20" or "make it 30"
  const bareMatch = lower.match(/\b(?:just|only|make it|set to|have|got)\s+(\d+)\b/);
  if (bareMatch) {
    const num = parseInt(bareMatch[1], 10);
    if (!isNaN(num) && num >= 5 && num <= 300) {
      return num;
    }
  }

  return null;
}

/**
 * Extract topic from user message
 */
export function extractTopic(text: string): string | null {
  let cleaned = text
    .replace(/(?:plan|create|build|start|set up|give me|make)\s+(?:a|an)?/gi, '')
    .replace(/\b\d+[\s-]*(?:minutes|minute|mins|min|m|hours|hour|hrs|hr)\b/gi, '')
    .replace(/\b(?:half an hour|one hour|an hour)\b/gi, '')
    .replace(/\b(?:study session|session|study plan|plan|schedule)\b/gi, '')
    .replace(/\b(?:for|in|about|on|with)\b/gi, '')
    .replace(/\b(?:i have|i only have|i got|can we do|help me with|help me revise|revise|learn|study)\b/gi, '')
    .replace(/\b(?:please|today|now)\b/gi, '')
    .trim();

  // Strip punctuation
  cleaned = cleaned.replace(/[.?!,]/g, '').trim();

  if (cleaned.length >= 2) {
    // Capitalize words nicely
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return null;
}

/**
 * Detect user intent based on text and current context
 */
export type DetectedIntent = 
  | 'create_plan'
  | 'adapt_time'
  | 'help_struggling'
  | 'complete_task'
  | 'finish_session'
  | 'summarize_progress'
  | 'clarification_time'
  | 'clarification_topic'
  | 'greeting'
  | 'unknown';

export function detectIntent(text: string, currentSession: StudySession | null, lastAssistantMessage?: ConversationMessage): DetectedIntent {
  const lower = text.toLowerCase();

  // Check if replying to a clarification request
  if (lastAssistantMessage?.intent === 'ask_time_clarification') {
    const mins = extractMinutes(text);
    if (mins) return 'clarification_time';
  }
  if (lastAssistantMessage?.intent === 'ask_topic_clarification') {
    const topic = extractTopic(text);
    if (topic) return 'clarification_topic';
  }

  // Task completion intent
  if (
    lower.includes('mark task') ||
    lower.includes('task complete') ||
    lower.includes('finished task') ||
    lower.includes('done with task') ||
    lower.includes('i finished') ||
    lower.includes('completed the task') ||
    lower.match(/\b(done|finished|complete)\b/) && currentSession
  ) {
    return 'complete_task';
  }

  // Session finish intent
  if (
    lower.includes('finish session') ||
    lower.includes('end session') ||
    lower.includes('wrap up') ||
    lower.includes('i am done for today') ||
    lower.includes('stop session') ||
    lower.includes('close session')
  ) {
    return 'finish_session';
  }

  // Progress summary intent
  if (
    lower.includes('summarize') ||
    lower.includes('my progress') ||
    lower.includes('how am i doing') ||
    lower.includes('where was i') ||
    lower.includes('what is next') ||
    lower.includes('status update')
  ) {
    return 'summarize_progress';
  }

  // Struggling / cognitive load adaptation
  if (
    lower.includes('struggling') ||
    lower.includes('too hard') ||
    lower.includes('confused') ||
    lower.includes('stuck on') ||
    lower.includes('slow down') ||
    lower.includes('simpler') ||
    lower.includes('break it down') ||
    lower.includes("don't understand") ||
    lower.includes('dont understand')
  ) {
    return 'help_struggling';
  }

  // Adapt time budget (if session already exists and user expresses time constraint)
  const timeMention = extractMinutes(text);
  if (
    currentSession &&
    timeMention &&
    (lower.includes('only have') ||
     lower.includes('shorten') ||
     lower.includes('cut') ||
     lower.includes('reduce') ||
     lower.includes('more minutes') ||
     lower.includes('change time') ||
     lower.includes('instead') ||
     lower.startsWith('i have') ||
     lower.includes('running out of time'))
  ) {
    return 'adapt_time';
  }

  // If user says "I only have 20 minutes" even without active session, or with active session
  if (lower.includes('only have') || lower.includes('just have')) {
    if (currentSession) return 'adapt_time';
  }

  // Plan creation intent
  if (
    lower.includes('plan') ||
    lower.includes('study') ||
    lower.includes('learn') ||
    lower.includes('revise') ||
    lower.includes('prepare') ||
    lower.includes('session')
  ) {
    return 'create_plan';
  }

  // Greetings
  if (
    lower.startsWith('hi') ||
    lower.startsWith('hello') ||
    lower.startsWith('hey') ||
    lower.includes('who are you') ||
    lower.includes('what can you do')
  ) {
    return 'greeting';
  }

  // If time and topic both present in raw input
  if (extractMinutes(text) && extractTopic(text)) {
    return 'create_plan';
  }

  return 'unknown';
}

/**
 * Curated syllabus blueprints tailored for popular topics
 */
interface SyllabusBlueprint {
  keywords: string[];
  tasks: Array<{
    titleRatio: string;
    description: string;
    weight: number; // Ratio of total time
    priority: TaskPriority;
    minMinutes: number;
  }>;
}

const SYLLABUS_BLUEPRINTS: SyllabusBlueprint[] = [
  {
    keywords: ['python', 'asyncio', 'django', 'fastapi'],
    tasks: [
      {
        titleRatio: 'Core Syntax & Key Mental Models',
        description: 'Review foundational constructs, scoping, type annotations, and common idiomatic patterns.',
        weight: 0.25,
        priority: 'high',
        minMinutes: 5,
      },
      {
        titleRatio: 'Applied Problem Solving & Code Construction',
        description: 'Implement core functionality hands-on with live code snippets, testing edge cases.',
        weight: 0.45,
        priority: 'high',
        minMinutes: 10,
      },
      {
        titleRatio: 'Active Recall & Pitfall Review',
        description: 'Test yourself on memory management, common bugs, and performance trade-offs.',
        weight: 0.30,
        priority: 'medium',
        minMinutes: 5,
      },
    ],
  },
  {
    keywords: ['javascript', 'js', 'typescript', 'ts', 'react'],
    tasks: [
      {
        titleRatio: 'Architecture & Mental Models',
        description: 'Deconstruct closures, execution context, reactive state flows, and component lifecycle.',
        weight: 0.25,
        priority: 'high',
        minMinutes: 5,
      },
      {
        titleRatio: 'Hands-on Implementation Sprint',
        description: 'Build functional components/modules with clean props, async data handling, and custom hooks.',
        weight: 0.45,
        priority: 'high',
        minMinutes: 10,
      },
      {
        titleRatio: 'Quiz & Debugging Checklist',
        description: 'Walk through re-rendering pitfalls, dependency arrays, and key interview edge cases.',
        weight: 0.30,
        priority: 'medium',
        minMinutes: 5,
      },
    ],
  },
  {
    keywords: ['data structures', 'algorithms', 'dsa', 'leetcode'],
    tasks: [
      {
        titleRatio: 'Pattern Recognition & Invariant Analysis',
        description: 'Identify time/space complexities, pointer mechanics, and structural constraints.',
        weight: 0.25,
        priority: 'high',
        minMinutes: 5,
      },
      {
        titleRatio: 'Targeted Problem Solving',
        description: 'Solve 1-2 curated representative problems from scratch without peeking at answers.',
        weight: 0.50,
        priority: 'high',
        minMinutes: 10,
      },
      {
        titleRatio: 'Optimization & Reflection',
        description: 'Analyze bottleneck steps, verify edge conditions (empty inputs, boundaries), and summarize learnings.',
        weight: 0.25,
        priority: 'medium',
        minMinutes: 5,
      },
    ],
  },
  {
    keywords: ['sql', 'database', 'postgres', 'query'],
    tasks: [
      {
        titleRatio: 'Schema Design & Joins Primer',
        description: 'Examine entity relationships, indexing strategies, and normalization guidelines.',
        weight: 0.30,
        priority: 'high',
        minMinutes: 5,
      },
      {
        titleRatio: 'Complex Query Construction & Aggregations',
        description: 'Write CTEs, window functions, and multi-table joins to solve analytical scenarios.',
        weight: 0.45,
        priority: 'high',
        minMinutes: 10,
      },
      {
        titleRatio: 'Query Plan & Index Inspection',
        description: 'Review EXPLAIN output, identify table scans, and optimize execution bottlenecks.',
        weight: 0.25,
        priority: 'medium',
        minMinutes: 5,
      },
    ],
  },
];

/**
 * Generic blueprint generator for any custom topic
 */
function getGenericBlueprint(topic: string) {
  return [
    {
      titleRatio: `Concept Priming: ${topic} Fundamentals`,
      description: `Grasp core definitions, high-yield principles, and structural overview of ${topic}.`,
      weight: 0.30,
      priority: 'high' as TaskPriority,
      minMinutes: 5,
    },
    {
      titleRatio: `Deep Application: Hands-on Practice with ${topic}`,
      description: `Actively solve exercises, write notes, or build a mini-spec applying ${topic}.`,
      weight: 0.45,
      priority: 'high' as TaskPriority,
      minMinutes: 10,
    },
    {
      titleRatio: `Active Recall & Synthesis: ${topic} Knowledge Check`,
      description: `Summarize key insights from memory and identify remaining knowledge gaps.`,
      weight: 0.25,
      priority: 'medium' as TaskPriority,
      minMinutes: 5,
    },
  ];
}

/**
 * Generate balanced task durations that exactly sum to targetMinutes
 */
export function balanceTaskDurations(
  tasks: Array<{ title: string; description: string; priority: TaskPriority; weight: number; minMinutes: number }>,
  targetMinutes: number
): StudyTask[] {
  const count = tasks.length;
  if (count === 0) return [];

  // If time is very short (e.g. <= 15m), limit to 2 high-priority tasks
  let activeTasks = tasks;
  if (targetMinutes <= 20 && count > 2) {
    activeTasks = tasks.slice(0, 2);
  }

  // Distribute based on weight
  const totalWeight = activeTasks.reduce((sum, t) => sum + t.weight, 0);
  let allocated = 0;
  const result: StudyTask[] = [];

  activeTasks.forEach((t, i) => {
    let mins: number;
    if (i === activeTasks.length - 1) {
      // Last task gets exact remaining to guarantee total sum equals targetMinutes
      mins = Math.max(t.minMinutes, targetMinutes - allocated);
    } else {
      mins = Math.max(t.minMinutes, Math.round((t.weight / totalWeight) * targetMinutes));
      allocated += mins;
    }

    result.push({
      id: `task-${Date.now()}-${i + 1}`,
      title: t.title,
      description: t.description,
      estimatedMinutes: mins,
      priority: t.priority,
      status: i === 0 ? 'in_progress' : 'pending',
      order: i + 1,
    });
  });

  return result;
}

/**
 * Workflow A: Create a study plan
 */
export function createPlan(topic: string, targetMinutes: number): StudySession {
  const lowerTopic = topic.toLowerCase();
  const matchedBlueprint = SYLLABUS_BLUEPRINTS.find(b =>
    b.keywords.some(k => lowerTopic.includes(k))
  );

  const rawTasks = matchedBlueprint
    ? matchedBlueprint.tasks.map(t => ({
        title: `${topic}: ${t.titleRatio}`,
        description: t.description,
        priority: t.priority,
        weight: t.weight,
        minMinutes: t.minMinutes,
      }))
    : getGenericBlueprint(topic).map(t => ({
        title: t.titleRatio,
        description: t.description,
        priority: t.priority,
        weight: t.weight,
        minMinutes: t.minMinutes,
      }));

  const tasks = balanceTaskDurations(rawTasks, targetMinutes);

  const goal: StudyGoal = {
    id: `goal-${Date.now()}`,
    title: topic,
    category: 'Study Sprint',
    targetMinutes,
    createdAt: new Date().toISOString(),
  };

  return {
    id: `session-${Date.now()}`,
    goal,
    tasks,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalPlannedMinutes: targetMinutes,
    totalElapsedMinutes: 0,
    isFinished: false,
    activeTaskId: tasks[0]?.id,
  };
}

/**
 * Workflow B: Adapt an existing study plan
 * - Preserves completed tasks
 * - Recalculates durations to fit new budget or resolves struggle
 * - Updates existing session in place
 */
export function adaptPlan(
  currentSession: StudySession,
  newBudgetMinutes?: number,
  isStruggling?: boolean,
  strugglingConcept?: string,
  isRemainingBudget?: boolean
): { updatedSession: StudySession; explanation: string } {
  const completedTasks = currentSession.tasks.filter(t => t.status === 'completed');
  const incompleteTasks = currentSession.tasks.filter(t => t.status !== 'completed');

  const completedMinutes = completedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  let updatedTasks: StudyTask[] = [...completedTasks];
  let explanation = '';

  if (isStruggling) {
    // Cognitive breakdown: split the current or next task into 2 gentler micro-steps
    const targetTask = incompleteTasks.find(t => t.status === 'in_progress') || incompleteTasks[0];
    const conceptName = strugglingConcept || targetTask?.title || currentSession.goal.title;
    const remainingTime = Math.max(10, currentSession.totalPlannedMinutes - completedMinutes);

    const step1Mins = Math.max(5, Math.round(remainingTime * 0.45));
    const step2Mins = Math.max(5, remainingTime - step1Mins);

    const microStep1: StudyTask = {
      id: `task-micro-${Date.now()}-1`,
      title: `Guided Deconstruction: ${conceptName}`,
      description: `Break down ${conceptName} into visual analogies and 1 simplified example with zero edge cases.`,
      estimatedMinutes: step1Mins,
      priority: 'high',
      status: 'in_progress',
      order: completedTasks.length + 1,
    };

    const microStep2: StudyTask = {
      id: `task-micro-${Date.now()}-2`,
      title: `Micro-Practice: Verify ${conceptName}`,
      description: `Solve one single bite-sized validation exercise to lock in the foundational concept.`,
      estimatedMinutes: step2Mins,
      priority: 'high',
      status: 'pending',
      order: completedTasks.length + 2,
    };

    updatedTasks = [...completedTasks, microStep1, microStep2];
    explanation = `I understand! Let's lower the friction. Kept your ${completedTasks.length} completed task(s) intact and restructured the remainder into two focused micro-steps for "${conceptName}". You have ${step1Mins + step2Mins} minutes remaining.`;
  } else if (newBudgetMinutes !== undefined) {
    // Re-budgeting
    if (incompleteTasks.length === 0) {
      explanation = `All tasks in this session are already completed! You can start a new plan or review your accomplishments.`;
      return { updatedSession: currentSession, explanation };
    }

    // Determine available remaining minutes for unfinished tasks
    let availableRemainingMinutes: number;
    if (isRemainingBudget || newBudgetMinutes <= completedMinutes) {
      availableRemainingMinutes = Math.max(5, newBudgetMinutes);
    } else {
      availableRemainingMinutes = Math.max(5, newBudgetMinutes - completedMinutes);
    }

    // Sort incomplete tasks by priority (high first)
    const sortedIncomplete = [...incompleteTasks].sort((a, b) => {
      const pMap = { high: 1, medium: 2, low: 3 };
      return pMap[a.priority] - pMap[b.priority];
    });

    let tasksToKeep: StudyTask[];
    if (availableRemainingMinutes <= 10 && sortedIncomplete.length > 1) {
      tasksToKeep = sortedIncomplete.slice(0, 1);
    } else if (availableRemainingMinutes <= 20 && sortedIncomplete.length > 2) {
      tasksToKeep = sortedIncomplete.slice(0, 2);
    } else {
      tasksToKeep = sortedIncomplete;
    }

    // Allocate remaining minutes proportionally
    const initialTotal = tasksToKeep.reduce((sum, t) => sum + t.estimatedMinutes, 0) || 1;
    let allocated = 0;

    const rebalancedIncomplete: StudyTask[] = tasksToKeep.map((t, idx) => {
      let mins: number;
      if (idx === tasksToKeep.length - 1) {
        mins = Math.max(5, availableRemainingMinutes - allocated);
      } else {
        mins = Math.max(5, Math.round((t.estimatedMinutes / initialTotal) * availableRemainingMinutes));
        allocated += mins;
      }

      return {
        ...t,
        estimatedMinutes: mins,
        order: completedTasks.length + idx + 1,
        status: idx === 0 ? 'in_progress' : 'pending',
      };
    });

    updatedTasks = [...completedTasks, ...rebalancedIncomplete];
    const totalPlanned = completedMinutes + availableRemainingMinutes;

    if (completedTasks.length > 0) {
      explanation = `Adapted your schedule for ${availableRemainingMinutes} remaining minutes (${totalPlanned}m total). Kept your ${completedTasks.length} completed task(s) intact and reallocated the remaining ${availableRemainingMinutes} minutes across ${rebalancedIncomplete.length} priority task(s).`;
    } else {
      explanation = `Adapted your schedule for ${totalPlanned} total minutes. Kept your 0 completed task(s) intact and reallocated the remaining ${availableRemainingMinutes} minutes across ${rebalancedIncomplete.length} priority task(s).`;
    }
  }

  const updatedTotalPlanned = updatedTasks.reduce((s, t) => s + t.estimatedMinutes, 0);
  const updatedSession: StudySession = {
    ...currentSession,
    tasks: updatedTasks,
    updatedAt: new Date().toISOString(),
    totalPlannedMinutes: updatedTotalPlanned,
    activeTaskId: updatedTasks.find(t => t.status === 'in_progress')?.id || updatedTasks.find(t => t.status === 'pending')?.id,
  };

  return { updatedSession, explanation };
}

/**
 * Workflow C: Complete a task
 * - Avoids double counting
 * - Recommends next task
 */
export function completeTask(
  currentSession: StudySession,
  taskId?: string
): { updatedSession: StudySession; message: string; completedTask: StudyTask } | null {
  const targetId = taskId || currentSession.activeTaskId || currentSession.tasks.find(t => t.status !== 'completed')?.id;
  if (!targetId) return null;

  const taskIndex = currentSession.tasks.findIndex(t => t.id === targetId);
  if (taskIndex === -1) return null;

  const targetTask = currentSession.tasks[taskIndex];
  if (targetTask.status === 'completed') {
    return {
      updatedSession: currentSession,
      message: `"${targetTask.title}" is already marked as completed.`,
      completedTask: targetTask,
    };
  }

  const updatedTargetTask: StudyTask = {
    ...targetTask,
    status: 'completed',
    completedAt: new Date().toISOString(),
  };

  const updatedTasks = [...currentSession.tasks];
  updatedTasks[taskIndex] = updatedTargetTask;

  // Find next incomplete task
  const nextTaskIndex = updatedTasks.findIndex(t => t.status === 'pending');
  let nextTask: StudyTask | undefined = undefined;

  if (nextTaskIndex !== -1) {
    updatedTasks[nextTaskIndex] = {
      ...updatedTasks[nextTaskIndex],
      status: 'in_progress',
    };
    nextTask = updatedTasks[nextTaskIndex];
  }

  const completedCount = updatedTasks.filter(t => t.status === 'completed').length;
  const totalTasks = updatedTasks.length;
  const isAllDone = completedCount === totalTasks;

  const updatedSession: StudySession = {
    ...currentSession,
    tasks: updatedTasks,
    updatedAt: new Date().toISOString(),
    totalElapsedMinutes: currentSession.totalElapsedMinutes + targetTask.estimatedMinutes,
    activeTaskId: nextTask?.id,
    isFinished: isAllDone,
  };

  let message = `Great work! Marked "${targetTask.title}" (${targetTask.estimatedMinutes}m) complete.`;
  if (nextTask) {
    message += ` Next up: "${nextTask.title}" (${nextTask.estimatedMinutes}m). Ready to dive in?`;
  } else {
    message += ` Fantastic job! You have completed all ${totalTasks} tasks in this study sprint.`;
  }

  return {
    updatedSession,
    message,
    completedTask: updatedTargetTask,
  };
}

/**
 * Workflow E: Generate honest completion summary
 * Never invents work.
 */
export function generateSessionSummary(session: StudySession): string {
  const completed = session.tasks.filter(t => t.status === 'completed');
  const remaining = session.tasks.filter(t => t.status !== 'completed');

  const completedMinutes = completed.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const remainingMinutes = remaining.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  const parts: string[] = [];
  parts.push(`### Study Session Summary: ${session.goal.title}`);
  parts.push(`- **Status:** ${session.isFinished || remaining.length === 0 ? 'Completed' : 'In Progress'}`);
  parts.push(`- **Time Planned:** ${session.totalPlannedMinutes} minutes`);
  parts.push(`- **Completed Work:** ${completed.length} task(s) (~${completedMinutes} min)`);

  if (completed.length > 0) {
    parts.push(`\n**Accomplished Tasks:**`);
    completed.forEach(t => {
      parts.push(`- [x] ${t.title} (${t.estimatedMinutes}m)`);
    });
  }

  if (remaining.length > 0) {
    parts.push(`\n**Remaining Tasks (${remainingMinutes}m):**`);
    remaining.forEach(t => {
      parts.push(`- [ ] ${t.title} (${t.estimatedMinutes}m) - *${t.priority} priority*`);
    });
    parts.push(`\n**Next Recommended Action:** Resume with "${remaining[0].title}".`);
  } else {
    parts.push(`\n**Outstanding!** All tasks finished. Goals achieved.`);
  }

  return parts.join('\n');
}

/**
 * Main local conversational workflow engine processing
 */
export function processUserInput(
  text: string,
  currentSession: StudySession | null,
  recentMessages: ConversationMessage[]
): EngineResult {
  const lower = text.toLowerCase();
  const lastAssistantMsg = [...recentMessages].reverse().find(m => m.sender === 'assistant');
  const intent = detectIntent(text, currentSession, lastAssistantMsg);

  // 1. Reply to clarification
  if (intent === 'clarification_time' && lastAssistantMsg?.metadata?.actionTaken === 'need_time') {
    const topic = lastAssistantMsg.metadata.actionTaken === 'need_time' && currentSession?.goal.title
      ? currentSession.goal.title
      : (extractTopic(lastAssistantMsg.text) || 'Study Session');
    const minutes = extractMinutes(text) || 45;
    const newSession = createPlan(topic, minutes);

    return {
      action: 'plan_created',
      updatedSession: newSession,
      speechText: `Got it. Created a ${minutes}-minute plan for ${topic} with ${newSession.tasks.length} actionable steps.`,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: `Got it! I've prepared a **${minutes}-minute** study plan for **${topic}** with **${newSession.tasks.length}** focused steps. Let's start with: "${newSession.tasks[0]?.title}".`,
        intent: 'plan_created',
        source: 'local-engine',
        suggestedQuickReplies: [
          'Mark first task done',
          'I only have 20 minutes',
          'Summarize my progress',
        ],
      },
    };
  }

  // 2. Complete task
  if (intent === 'complete_task') {
    if (!currentSession || currentSession.tasks.length === 0) {
      return {
        action: 'none',
        message: {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: `You don't have an active study session right now. Would you like to create one? For example: *"Plan a 45-minute Python study session."*`,
          intent: 'no_session',
          source: 'local-engine',
          suggestedQuickReplies: [
            'Plan a 45-minute Python study session.',
            'Help me revise JavaScript.',
          ],
        },
      };
    }

    const completion = completeTask(currentSession);
    if (!completion) {
      return {
        action: 'none',
        message: {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: `All tasks in your current session appear to be finished already! Ready to wrap up?`,
          intent: 'all_done',
          source: 'local-engine',
          suggestedQuickReplies: ['Summarize my progress', 'Start a new plan'],
        },
      };
    }

    return {
      action: 'task_completed',
      updatedSession: completion.updatedSession,
      speechText: completion.message,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: completion.message,
        intent: 'task_completed',
        source: 'local-engine',
        metadata: {
          completedTaskId: completion.completedTask.id,
        },
        suggestedQuickReplies: completion.updatedSession.isFinished
          ? ['Summarize my progress', 'Start a new plan']
          : ['Mark next task complete', 'I only have 15 minutes left', 'Summarize my progress'],
      },
    };
  }

  // 3. Adapt time
  if (intent === 'adapt_time') {
    if (!currentSession) {
      const minutes = extractMinutes(text) || 30;
      const topic = extractTopic(text) || 'Study Session';
      const newSession = createPlan(topic, minutes);
      return {
        action: 'plan_created',
        updatedSession: newSession,
        speechText: `Started a ${minutes}-minute plan for ${topic}.`,
        message: {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: `I noticed you have ${minutes} minutes. I set up a new focused sprint for **${topic}**.`,
          intent: 'plan_created',
          source: 'local-engine',
          suggestedQuickReplies: ['Mark first task done', 'Summarize my progress'],
        },
      };
    }

    const isRemaining = lower.includes('left') || lower.includes('remaining') || lower.includes('more') || lower.includes('from now');
    const newMinutes = extractMinutes(text) || Math.max(10, Math.round(currentSession.totalPlannedMinutes / 2));
    const { updatedSession, explanation } = adaptPlan(currentSession, newMinutes, false, undefined, isRemaining);

    return {
      action: 'plan_adapted',
      updatedSession,
      speechText: explanation,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: explanation,
        intent: 'plan_adapted',
        source: 'local-engine',
        metadata: { adaptedMinutes: newMinutes },
        suggestedQuickReplies: [
          'Mark current task complete',
          "I'm struggling with this concept",
          'Summarize my progress',
        ],
      },
    };
  }

  // 4. Struggling / Cognitive load adaptation
  if (intent === 'help_struggling') {
    if (!currentSession) {
      return {
        action: 'none',
        message: {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: `I'm here to help you break down any challenging topic into simple, manageable steps. What topic are you working on?`,
          intent: 'struggling_no_session',
          source: 'local-engine',
        },
      };
    }

    const { updatedSession, explanation } = adaptPlan(currentSession, undefined, true);

    return {
      action: 'plan_adapted',
      updatedSession,
      speechText: explanation,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: explanation,
        intent: 'plan_adapted_struggling',
        source: 'local-engine',
        suggestedQuickReplies: [
          'Mark first micro-step complete',
          'I need 10 more minutes',
          'Summarize my progress',
        ],
      },
    };
  }

  // 5. Summarize progress / Status
  if (intent === 'summarize_progress' || intent === 'finish_session') {
    if (!currentSession) {
      return {
        action: 'none',
        message: {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: `You have no active study session recorded. When you're ready, say *"Plan a 30-minute session for React"* and I'll build your workflow.`,
          intent: 'summary_no_session',
          source: 'local-engine',
          suggestedQuickReplies: ['Plan a 45-minute Python study session.'],
        },
      };
    }

    const summary = generateSessionSummary(currentSession);
    const isFinishing = intent === 'finish_session';
    const updatedSession: StudySession = isFinishing
      ? { ...currentSession, isFinished: true, completionSummary: summary }
      : currentSession;

    const speechText = isFinishing
      ? `Session finished. You completed ${currentSession.tasks.filter(t => t.status === 'completed').length} of ${currentSession.tasks.length} tasks.`
      : `Here is your current progress summary.`;

    return {
      action: isFinishing ? 'session_finished' : 'none',
      updatedSession: isFinishing ? updatedSession : undefined,
      speechText,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: summary,
        intent: isFinishing ? 'session_finished' : 'progress_summary',
        source: 'local-engine',
        suggestedQuickReplies: isFinishing
          ? ['Start a new plan', 'Review saved data']
          : ['Mark next task complete', 'I only have 15 minutes', 'Finish session'],
      },
    };
  }

  // 6. Create plan
  if (intent === 'create_plan') {
    const minutes = extractMinutes(text);
    const topic = extractTopic(text);

    // If both topic and minutes are present -> generate plan directly!
    if (minutes && topic && topic.length >= 2) {
      const newSession = createPlan(topic, minutes);
      return {
        action: 'plan_created',
        updatedSession: newSession,
        speechText: `Created a ${minutes}-minute plan for ${topic} with ${newSession.tasks.length} actionable steps.`,
        message: {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: `I've mapped out a **${minutes}-minute** focused plan for **${topic}**.\n\nYour first step is: **${newSession.tasks[0]?.title}** (${newSession.tasks[0]?.estimatedMinutes}m).`,
          intent: 'plan_created',
          source: 'local-engine',
          suggestedQuickReplies: [
            'Mark first task done',
            'I only have 20 minutes',
            'Summarize my progress',
          ],
        },
      };
    }

    // Clarification A: Have topic, but missing time
    if (topic && topic.length >= 2 && !minutes) {
      return {
        action: 'clarification_needed',
        speechText: `How much time do you have to study ${topic}?`,
        message: {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: `I'd love to help you study **${topic}**! How much time do you have available for this session?`,
          intent: 'ask_time_clarification',
          source: 'local-engine',
          metadata: { actionTaken: 'need_time' },
          suggestedQuickReplies: [
            '20 minutes',
            '30 minutes',
            '45 minutes',
            '1 hour',
          ],
        },
      };
    }

    // Clarification B: Have minutes, but missing topic
    if (minutes && (!topic || topic.length < 2)) {
      return {
        action: 'clarification_needed',
        speechText: `What topic would you like to focus on for ${minutes} minutes?`,
        message: {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: `Got your **${minutes}-minute** window! What subject or topic would you like to focus on?`,
          intent: 'ask_topic_clarification',
          source: 'local-engine',
          metadata: { actionTaken: 'need_topic' },
          suggestedQuickReplies: [
            'Python',
            'JavaScript',
            'Data Structures & Algorithms',
            'System Design',
          ],
        },
      };
    }

    // Default clarification
    return {
      action: 'clarification_needed',
      speechText: `What would you like to study, and how much time do you have?`,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: `Tell me what you'd like to study and how much time you have. For example:\n- *"Plan a 45-minute Python study session."*\n- *"Help me revise JavaScript in 30 minutes."*`,
        intent: 'ask_full_clarification',
        source: 'local-engine',
        suggestedQuickReplies: [
          'Plan a 45-minute Python study session.',
          'Help me revise JavaScript in 30 minutes.',
          'Review Data Structures for 20 minutes.',
        ],
      },
    };
  }

  // 7. Greeting / Help
  if (intent === 'greeting') {
    return {
      action: 'none',
      speechText: `Hello! I'm your FocusFlow study companion. What are we learning today?`,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: `👋 **Hello! I'm FocusFlow AI**, your simulated Alexa+ study companion.\n\n*Your goals, remembered. Your next step, ready.*\n\nHow can I help you today? You can dictate or type:`,
        intent: 'greeting',
        source: 'local-engine',
        suggestedQuickReplies: [
          'Plan a 45-minute Python study session.',
          'Help me revise JavaScript.',
          'Summarize my progress.',
        ],
      },
    };
  }

  // 8. Fallback / conversational guidance
  return {
    action: 'none',
    speechText: `I can help plan study sessions, adapt your schedule, or track tasks.`,
    message: {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: `I'm tuned to help you plan, adapt, and complete structured study sprints.\n\nTry saying or typing:\n- **"Plan a 45-minute Python study session."**\n- **"I only have 20 minutes."** (to adapt an active plan)\n- **"I'm struggling with this concept."** (to break tasks down)\n- **"Summarize my progress."**`,
      intent: 'fallback_help',
      source: 'local-engine',
      suggestedQuickReplies: [
        'Plan a 45-minute Python study session.',
        'I only have 20 minutes.',
        'Help me revise JavaScript.',
        'Summarize my progress.',
      ],
    },
  };
}
