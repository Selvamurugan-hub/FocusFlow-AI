import os
import json
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv

# Load optional .env variables safely
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("focusflow_backend")

app = FastAPI(
    title="FocusFlow AI Backend",
    description="Optional Groq-compatible LLM service for FocusFlow AI (Simulated Alexa+ experience)",
    version="1.0.0",
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile").strip()
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

# Data models
class HistoryItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1000, description="User input message")
    current_session: Optional[Dict[str, Any]] = None
    history: Optional[List[HistoryItem]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str
    action: str = "none"
    speech_text: Optional[str] = None
    suggested_replies: Optional[List[str]] = None
    updated_session: Optional[Dict[str, Any]] = None
    intent: Optional[str] = "groq_ai"

@app.get("/api/health")
async def health_check():
    """
    Returns service health and whether a valid-format Groq API key is configured.
    Never returns the actual key.
    """
    has_key = bool(GROQ_API_KEY and len(GROQ_API_KEY) > 10 and not GROQ_API_KEY.startswith("gsk_your_groq"))
    return {
        "status": "healthy",
        "has_groq_key": has_key,
        "model": MODEL_NAME,
        "mode": "groq_cloud" if has_key else "offline_demo",
    }

SYSTEM_PROMPT = """You are FocusFlow AI, a context-aware personal study companion simulating an Alexa+ conversational experience.
Tagline: "Your goals, remembered. Your next step, ready."
Always be encouraging, structured, concise, and focused on actionable learning steps.
When planning or adapting, provide structured time allocations (e.g., 45m divided into 15m foundations, 20m practice, 10m review).
Never claim you are official Amazon Alexa or connected to AWS infrastructure. You are an independent simulated prototype.
Return your response formatted cleanly with Markdown bolding where appropriate.
Keep responses concise enough to be spoken aloud easily."""

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    """
    Optional LLM generation endpoint using Groq Cloud API.
    Gracefully falls back if no key is configured or on upstream timeout.
    """
    has_key = bool(GROQ_API_KEY and len(GROQ_API_KEY) > 10 and not GROQ_API_KEY.startswith("gsk_your_groq"))

    # If no key configured, return informative message pointing to local engine
    if not has_key:
        return ChatResponse(
            reply="Backend server is running in local mode (no external Groq API key configured). The client-side local workflow engine handles all study workflows with 100% functionality.",
            action="none",
            suggested_replies=["Plan a 45-minute Python study session.", "I only have 20 minutes.", "Summarize my progress."],
            speech_text="Local workflow engine active. Ready to plan your study session.",
            intent="local_fallback_notice"
        )

    # Build prompt messages
    session_context = ""
    if payload.current_session:
        session_context = f"\nActive Session Context: Goal is '{payload.current_session.get('goal', {}).get('title', 'Unknown')}', planned for {payload.current_session.get('totalPlannedMinutes', 45)} minutes."

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + session_context}
    ]

    for item in (payload.history or [])[-4:]:
        messages.append({"role": item.role, "content": item.content[:400]})

    messages.append({"role": "user", "content": payload.message})

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(
                GROQ_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL_NAME,
                    "messages": messages,
                    "max_tokens": 400,
                    "temperature": 0.4,
                },
            )

            if res.status_code != 200:
                logger.error("Groq API returned error status: %s", res.status_code)
                raise HTTPException(status_code=502, detail="Upstream AI provider error")

            data = res.json()
            reply_text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

            if not reply_text:
                raise HTTPException(status_code=502, detail="Empty response from AI provider")

            return ChatResponse(
                reply=reply_text,
                action="none",
                speech_text=reply_text[:200],
                suggested_replies=["Mark current task complete", "I only have 15 minutes left", "Summarize my progress"],
                intent="groq_ai"
            )

    except httpx.TimeoutException:
        logger.warning("Groq API timeout after 8 seconds")
        raise HTTPException(status_code=504, detail="AI request timed out")
    except Exception as e:
        logger.error("Failed to query Groq API: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal AI error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
