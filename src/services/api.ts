import { ConversationMessage, EngineResult, StudySession } from '../types';

const BACKEND_URL = 'http://localhost:8000';

export interface BackendHealth {
  available: boolean;
  hasApiKey: boolean;
  model: string;
}

/**
 * Check if the optional FastAPI backend is running and configured
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        hasApiKey: Boolean(data.has_groq_key),
        model: data.model || 'llama-3.3-70b-versatile',
      };
    }
  } catch (e) {
    // Backend is not running or unreachable; this is expected for offline demo mode
  }

  return {
    available: false,
    hasApiKey: false,
    model: 'None (Local Engine Active)',
  };
}

/**
 * Query optional backend AI endpoint. Returns null on failure to allow local fallback.
 */
export async function queryBackendAi(
  userInput: string,
  currentSession: StudySession | null,
  recentMessages: ConversationMessage[]
): Promise<EngineResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        message: userInput,
        current_session: currentSession,
        history: recentMessages.slice(-6).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[FocusFlow API] Backend returned non-200 status, falling back to local engine');
      return null;
    }

    const data = await response.json();
    return {
      action: data.action || 'none',
      updatedSession: data.updated_session || undefined,
      speechText: data.speech_text || data.reply,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: data.reply,
        intent: data.intent || 'backend_ai_response',
        source: 'groq-ai',
        suggestedQuickReplies: data.suggested_replies || [
          'Mark first task done',
          'I only have 20 minutes',
          'Summarize my progress',
        ],
      },
    };
  } catch (err) {
    console.info('[FocusFlow API] FastAPI backend offline or timed out; falling back to local workflow engine');
    return null;
  }
}
