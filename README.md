# FocusFlow AI — Alexa+ Simulated Experience

> **"Your goals, remembered. Your next step, ready."**  
> *Built for the Amazon Developer Hackathon: Build, Ship, Shape.*  
> **Notice:** This is an independent hackathon prototype simulating an Alexa+-style conversational study experience. It is not an official Amazon product, service, or integration.

---

## 1. Project Overview & Problem Statement

Independent learners and students often struggle with study fatigue, rigid scheduling, and session fragmentation. Traditional timer apps or static to-do lists are brittle: if a session is interrupted or a concept proves more difficult than anticipated, students lose momentum or abandon the session altogether.

**FocusFlow AI** bridges the gap between passive conversational assistants and active productivity tools. It simulates an **Alexa+ contextual study companion** in a modern web interface that:
1. Translates conversational intent into structured, realistic study sprints.
2. Dynamically adapts active plans when time budgets change or when the user is struggling.
3. Preserves completed work across page refreshes and browser restarts using safe browser storage.
4. Delivers honest, grounded progress tracking with zero fabricated or hallucinated task completions.

---

## 2. Key Features & Workflows

### ⚡ End-to-End Workflows

- **Workflow A: Plan Creation**
  - Parses topics and time budgets from natural language or voice dictation (e.g., *"Plan a 45-minute Python study session."*).
  - Automatically structures realistic task allocations (Conceptual priming ~25%, Applied problem solving ~45%, Active recall & quiz ~30%).
  - Clarifies ambiguities concisely if topic or duration is missing.

- **Workflow B: Dynamic Schedule Adaptation**
  - Adapts to sudden real-world interruptions (e.g., *"I only have 20 minutes left"*).
  - Preserves already completed tasks intact.
  - Reprioritizes remaining tasks and rescales durations to fit the new budget.
  - Supports a *"I'm struggling with this"* mode that decomposes difficult tasks into lower-friction micro-steps.
  - Explains exactly what was changed and why.

- **Workflow C: Task Completion & Active Recommendation**
  - Interactive checkboxes and stopwatch timers track task execution.
  - Immediately persists progress and prevents double-counting.
  - Recommends the immediate next incomplete task to sustain focus.

- **Workflow D: Context Memory & Session Continuity**
  - Persists goals, tasks, elapsed minutes, and assistant memory in `localStorage`.
  - On page refresh, safely restores session state and provides a *"Continue Session"* indicator.
  - Includes robust error boundaries and corruption recovery for stored data.
  - Clear *"Reset Demo"* and *"Clear Saved Data"* controls for clean resets.

- **Workflow E: Grounded Session Summaries**
  - Concludes sessions with factual summaries of completed versus remaining tasks and actual time spent.
  - Never invents or assumes work was completed without explicit user confirmation.
  - Celebratory completion modal with confetti and actionable next steps.

### 🎙️ Simulated Alexa+ Voice Experience
- Real-time voice dictation powered by the browser's **Web Speech API** (`webkitSpeechRecognition`).
- Dynamic visual Alexa+ glowing halo ring illustrating assistant states: `Idle`, `Listening`, `Thinking`, and `Speaking`.
- Optional Speech Synthesis (TTS) toggle allowing Alexa+ to speak responses aloud.
- Graceful fallbacks and alerts for unsupported browsers or denied microphone permissions.

---

## 3. Technology Stack

- **Frontend Core:** React 18, TypeScript 5.7, Vite 6
- **Styling & UI:** Tailwind CSS (Navy/Charcoal theme `#080d1a`, `#0a0f1d`, indigo/cyan accents), Lucide React icons
- **State & Storage:** React state, typed workflow engine, browser `localStorage` with automated validation and corruption recovery
- **Audio & Voice:** Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Visuals:** `canvas-confetti`
- **Testing:** Vitest 2.1 (7 automated critical workflow test suites)
- **Optional Backend:** Python 3.9+ / FastAPI, Uvicorn, HTTPX, Pydantic, Dotenv (supports optional Groq LLaMA-3.3-70b-versatile with automatic local engine fallback)

---

## 4. Architecture & Workflow Engine

```
┌────────────────────────────────────────────────────────┐
│               FocusFlow AI Web Client                  │
│                                                        │
│  ┌───────────────────────┐   ┌───────────────────────┐ │
│  │   ConversationPanel   │   │   ContextPlanPanel    │ │
│  │   - Alexa+ Voice Halo │   │   - Active Stopwatch  │ │
│  │   - Suggested Prompts │   │   - Task Checklist    │ │
│  │   - Quick Replies     │   │   - Progress Bar      │ │
│  └───────────┬───────────┘   └───────────▲───────────┘ │
│              │                           │             │
│              ▼                           │             │
│  ┌───────────────────────────────────────┴───────────┐ │
│  │              Local Workflow Engine                │ │
│  │  - Intent Classifier (create, adapt, complete)    │ │
│  │  - Time & Topic Parsers (regex & heuristics)      │ │
│  │  - Syllabus Blueprints (Python, JS, DSA, Custom)  │ │
│  │  - Adaptive Re-budgeter (preserves done tasks)    │ │
│  │  - Grounded Summary Generator                     │ │
│  └───────────────────────┬───────────────────────────┘ │
│                          │                             │
│                          ▼                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │       Safe Storage Layer (localStorage)           │ │
│  │       - Schema validation & sanitization          │ │
│  │       - Corruption recovery & safe defaults       │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 5. Getting Started (Windows Setup)

### Prerequisites
- Node.js 18+ (tested on Node v24.13.0, npm 11.6.2)
- Modern web browser (Google Chrome or Microsoft Edge recommended for Web Speech API support)
- Python 3.9+ (only required if running the optional backend)

### Step 1: Install Dependencies
Open PowerShell or Command Prompt in the project root:
```powershell
npm install
```

### Step 2: Start Development Server
```powershell
npm run dev
```
Open your browser to `http://localhost:5173`.

### Step 3: Run Unit Tests
```powershell
npm test
```
Verifies all 7 critical workflow criteria via Vitest.

### Step 4: Build for Production
```powershell
npm run build
```
Generates optimized static assets in `dist/`.

To preview the production build locally:
```powershell
npm run preview
```

---

## 6. Optional FastAPI Backend Setup (Groq API)

FocusFlow AI is designed to run **100% offline in local demo mode** without any API keys or backend servers. However, if you wish to run the optional backend with Groq-compatible LLM support:

1. Navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```powershell
   copy .env.example .env
   ```
   Edit `backend/.env` and replace `GROQ_API_KEY` with your key from [Groq Cloud Console](https://console.groq.com/keys).
5. Start the backend:
   ```powershell
   python main.py
   ```
   The backend starts at `http://127.0.0.1:8000`. The frontend will automatically detect the backend and allow toggling between the Local Engine and Groq AI.

---

## 7. Demo Walkthrough Script

Follow these steps for an end-to-end evaluation:

1. **Launch the Demo Session:**
   - In the top navigation bar, click the **"Load Demo"** button.
   - An active session (*"Python FastTrack: Asynchronous Programming"*) is loaded with 1 task completed (15m) and Task 2 active.
2. **Observe Context Memory (Workflow D):**
   - Refresh the browser (`F5` or `Ctrl+R`).
   - Notice the blue banner *"Session restored from localStorage"* and the assistant resume greeting. Context is fully preserved.
3. **Test Schedule Adaptation (Workflow B):**
   - In the chat box, type or click: *"I only have 20 minutes."* (or speak it via the mic).
   - The assistant recalculates remaining time to fit within the 20-minute budget while keeping the completed task intact.
4. **Test Task Completion (Workflow C):**
   - Click the completion checkbox next to Task 2 in the plan panel.
   - The task turns emerald, progress jumps, and Alexa+ announces the completion and recommends the next task.
5. **Test Cognitive Deconstruction:**
   - Click the **"Struggling"** button under Quick Adapt (or type *"I'm struggling with this"*).
   - Alexa+ breaks down the current concept into two gentle micro-steps.
6. **Finish the Session (Workflow E):**
   - Click **"Finish Session"** in the plan header.
   - The celebratory modal appears with confetti and an honest, verified summary of completed work versus remaining tasks.

---

## 8. Honest Limitations & Prototype Disclosure

- **Independent Prototype:** FocusFlow AI is an independent project created for the Amazon Developer Hackathon. It does not use official Amazon Alexa trademarked logos, does not connect to Amazon Alexa devices, and does not invoke AWS or Alexa Smart Home APIs.
- **Web Speech Support:** Web Speech API voice recognition is natively supported in Chromium-based browsers (Chrome, Edge). On browsers without speech recognition support (such as Firefox on desktop), the app provides clear notifications and continues to function via text input.
- **Local Heuristics:** The local workflow engine employs pattern matching, regex, and structured syllabus blueprints. While it covers standard study subjects and adapts dynamically, it does not possess open-ended general world knowledge unless the optional backend LLM is connected.

---

## 9. Changes Made During the Hackathon Period

- **Core Architecture:** Built modular React 18 + TypeScript application with strict type definitions (`StudyGoal`, `StudyTask`, `ConversationMessage`, `StudySession`, `SavedContext`).
- **Workflow Engine:** Engineered local workflow state machine with intent classification, hyphenated time string parsing, topic extraction, and adaptive re-budgeting algorithms.
- **UI & Interaction:** Designed dark navy theme (`#080d1a`, `#11182c`) with subtle indigo/cyan accents, Alexa+-inspired glowing ring indicator, active task stopwatch, and interactive checklist.
- **Testing Suite:** Authored and verified 7 Vitest test suites covering plan creation, adaptation, task completion, context restoration, corruption recovery, and offline mode.
- **Optional Backend:** Implemented optional FastAPI service with Groq LLaMA integration, timeout management, CORS headers, and offline fallback.
- **Build & Polish:** Configured Vite bundling, Tailwind CSS, production optimizations, and detailed documentation.

---

## 10. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
