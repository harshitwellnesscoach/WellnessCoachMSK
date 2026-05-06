# Wellness Coach MSK — Working Development Plan

**Stack:** Python FastAPI (backend) + React/Vite with TypeScript (frontend)
**Who writes what:** User writes all Python. Claude Code writes JS/TS boilerplate.
**Rule:** Build plumbing before intelligence. Never skip phases.

---

# PART 1: PHASE PLAN

---

## Phase 0 — Project Setup

**Goal:** Two folders running (backend + frontend), connected to Supabase, backend deployable to Railway/Render, frontend deployable to Vercel.

### Steps

**0.1** Create project structure:
```
wellness-coach-msk/
  backend/
  frontend/
```

**0.2** Backend virtualenv and dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn[standard] anthropic supabase python-jose[cryptography] pydantic python-dotenv httpx
```

**0.3** Create `backend/requirements.txt` (see Part 2 for exact pinned versions).

**0.4** Create `backend/.env` — copy template from Part 2.

**0.5** Frontend scaffold:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install @supabase/supabase-js @mediapipe/tasks-vision tailwindcss @tailwindcss/vite shadcn-ui react-router-dom
```

**0.6** Create `frontend/.env.local` — copy template from Part 2.

**0.7** Create a Supabase project at https://supabase.com, copy the Project URL, `anon` key, `service_role` key, and JWT Secret into both `.env` files.

**0.8** Write `backend/main.py` — FastAPI app with CORS middleware and `/health` endpoint (see Part 2).

**0.9** Test both servers:
```bash
# terminal 1
cd backend && uvicorn main:app --reload
# terminal 2
cd frontend && npm run dev
```

### Done When
- [ ] FastAPI running on `:8000`, `GET /health` returns `{"status": "ok"}`
- [ ] React app running on `:5173` without console errors
- [ ] Both processes can read their respective `.env` / `.env.local` variables

---

## Phase 1 — Authentication

**Goal:** User can sign up and sign in. Frontend stores JWT. Every FastAPI call includes the JWT in the `Authorization` header.

### Steps

**1.1** Write `backend/db/supabase.py` — singleton supabase-py client using service role key.

**1.2** Write `backend/routers/auth.py` — `get_current_user` FastAPI dependency that verifies the Supabase JWT and returns the `user_id` string.

**1.3** Write `frontend/src/lib/supabase.ts` — Supabase JS client singleton.

**1.4** Write `frontend/src/api/client.ts` — typed `apiCall<T>` fetch wrapper that reads the session token from Supabase and adds the `Authorization: Bearer <token>` header to every request.

**1.5** Write `frontend/src/pages/SignUp.tsx` — calls `supabase.auth.signUp()`, redirects to `/dashboard` on success.

**1.6** Write `frontend/src/pages/SignIn.tsx` — calls `supabase.auth.signInWithPassword()`, redirects to `/dashboard` on success.

**1.7** Write `frontend/src/App.tsx` — React Router v6 setup with a `<ProtectedRoute>` wrapper (redirect to `/signin` when no active session).

### Done When
- [ ] Can create account via `/signup`, email confirms in Supabase Auth
- [ ] Can sign in via `/signin`, JWT stored in browser session
- [ ] Protected routes (`/dashboard`, `/session/*`, `/odi`) redirect to `/signin` when not authenticated
- [ ] Network tab shows every API call to FastAPI with `Authorization: Bearer ...` header

---

## Phase 2 — Database Schema

**Goal:** All tables exist in Supabase with Row Level Security (RLS) enabled and policies in place.

### Steps

**2.1** Open Supabase dashboard → SQL Editor, paste and run `0001_initial.sql` (see Part 2). Creates: `member_profiles`, `program_weeks`, `sessions`, `session_reps`.

**2.2** Run `0002_outcomes.sql` (see Part 2). Creates: `pain_logs`, `odi_submissions`, `coach_checkins`, `safety_rescreens`.

**2.3** Run `0003_odi_responses.sql` (see Part 2). Adds the `odi_responses` JSONB column fix.

**2.4** In Table Editor, verify every table shows a green shield icon (RLS enabled).

### Done When
- [ ] All 8 tables visible in Table Editor
- [ ] RLS enabled on all 8 tables
- [ ] Can insert a test row from SQL editor and retrieve it
- [ ] Attempting to insert without a valid JWT returns a Postgres RLS error

---

## Phase 3 — Onboarding Flow

**Goal:** User completes red-flag screen and intake form. Python evaluates safety. Program generation triggered.

**Who writes it:** Python — user. React forms — Claude Code.

### Steps

**3.1** Write `backend/services/safety/red_flags.py` — `RED_FLAG_QUESTIONS` list and `evaluate_red_flags()` function returning `'safe' | 'warn' | 'block'`.

**3.2** Write `backend/models/intake.py` — Pydantic v2 models: `RedFlagAnswers`, `IntakeData`.

**3.3** Write `backend/routers/intake.py` — `POST /intake/red-flag` and `POST /intake/profile` endpoints.

**3.4** Write `frontend/src/pages/Onboarding/RedFlag.tsx` — 6 yes/no question cards, calls `POST /intake/red-flag`, routes on result.

**3.5** Write `frontend/src/pages/Onboarding/Intake.tsx` — pain location picker, NPRS slider (0–10), duration dropdown, prior care checkbox, calls `POST /intake/profile`.

**3.6** Write `frontend/src/pages/Onboarding/BlockedScreen.tsx` — shown when result is `'block'`, displays emergency message, no navigation back to app.

**3.7** Add `/onboarding/red-flag` and `/onboarding/intake` routes to `App.tsx`. After successful intake POST, redirect to `/dashboard`.

### Done When
- [ ] Answering "yes" to a block-level red flag question shows `BlockedScreen`
- [ ] Completing intake saves a row to `member_profiles` (verify in Supabase)
- [ ] After intake, browser navigates to `/dashboard`

---

## Phase 4 — Dashboard (Static First)

**Goal:** Dashboard page loads with stat cards. Pain log saves to DB.

### Steps

**4.1** Write `backend/routers/dashboard.py` — `GET /dashboard/stats` returning zeroed-out stats shape (total sessions, streak, avg form score, latest ODI, week number).

**4.2** Write `backend/models/outcomes.py` — `PainLog` Pydantic model.

**4.3** Write `backend/routers/pain.py` — `POST /pain/log` (inserts to `pain_logs`) and `GET /pain/trend` (returns 14-element array of zeros for now).

**4.4** Write `frontend/src/pages/Dashboard.tsx` — calls `GET /dashboard/stats` on mount, renders child components.

**4.5** Write `frontend/src/components/dashboard/ProgressBlock.tsx` — 5 stat cards (sessions, streak, form score, ODI disability %, week).

**4.6** Write `frontend/src/components/dashboard/PainTrendChart.tsx` — SVG line chart, renders flat line when data is zeros.

**4.7** Write `frontend/src/components/dashboard/PainLogInline.tsx` — row of 0–10 NPRS buttons, on click calls `POST /pain/log`, shows confirmation.

### Done When
- [ ] `/dashboard` loads without JS errors
- [ ] All 5 stat cards visible (zeros acceptable)
- [ ] Clicking a pain level button inserts a row into `pain_logs` (verify in Supabase)

---

## Phase 5 — AI Program Generation

**Goal:** After intake, Claude generates a personalised 12-week exercise program and saves it to `program_weeks`.

**Who writes it:** Python — user. Dashboard exercise list — Claude Code.

### Steps

**5.1** Write `backend/data/exercise_library.json` — all 10 exercises (5 CV-scored + 5 self-paced) with full metadata (see Part 2 for schema).

**5.2** Write `backend/models/program.py` — `ProgramExercise`, `GeneratedProgram` Pydantic v2 models.

**5.3** Write `backend/services/ai/program_generator.py` — async Claude call with JSON output, fallback program on any exception (see Part 2).

**5.4** Write `backend/routers/program.py` — `POST /program/generate` and `GET /program/current`.

**5.5** In `backend/routers/intake.py` `submit_intake` handler: after saving `member_profiles`, call `await generate_program(intake_data)` and insert result into `program_weeks`.

**5.6** Add exercise list section to `frontend/src/pages/Dashboard.tsx` — calls `GET /program/current`, renders a list of exercise cards with sets and reps.

### Done When
- [ ] Completing intake creates a `program_weeks` row in Supabase with `exercises` JSONB column populated
- [ ] Dashboard exercise list shows at least 5 exercises with sets/reps/names
- [ ] Removing `ANTHROPIC_API_KEY` from `.env` still produces a valid fallback program

---

## Phase 6 — Session Shell (No CV Yet)

**Goal:** Member can start and complete sessions manually with rep tracking. All data saves to DB.

### Steps

**6.1** Write `backend/models/session.py` — `RepData`, `SessionCreate`, `CompleteSessionPayload` Pydantic models.

**6.2** Write `backend/routers/session.py` — `POST /session/start` (inserts to `sessions`, returns `session_id`) and `POST /session/{session_id}/complete` (updates `sessions`, inserts `session_reps`, inserts pre/post `pain_logs`).

**6.3** Write `frontend/src/pages/Session.tsx` — fetches current program, starts session on load, renders `SessionRunner`.

**6.4** Write `frontend/src/components/session/SessionRunner.tsx` — state machine with states: `PRE_PAIN → EXERCISES → POST_PAIN → COMPLETE`. Manual "Rep Done" button for each rep. Collects pre/post pain NPRS scores.

**6.5** Add "Start Session" button to Dashboard that navigates to `/session`.

**6.6** On `COMPLETE` state: call `POST /session/{id}/complete` with all collected rep data and pain scores.

### Done When
- [ ] Clicking Start Session navigates to `/session`
- [ ] Can step through all exercises, clicking Rep Done for each rep
- [ ] Pre-session and post-session pain NPRS captured
- [ ] After completion, a `sessions` row and `session_reps` rows exist in Supabase

---

## Phase 7 — CV Pipeline (Browser JS)

**Goal:** Camera feed with MediaPipe skeleton overlay inside the session view. No exercise scoring yet.

**Who writes it:** Claude Code writes all of this. User tests it.

### Steps

**7.1** Download `pose_landmarker_lite.task` from the MediaPipe releases page and place it at `frontend/public/models/pose_landmarker_lite.task`.

**7.2** Write `frontend/src/cv/poseTracker.ts` — MediaPipe `PoseLandmarker` init, `detectPose(videoElement)` function returning `NormalizedLandmark[]`.

**7.3** Write `frontend/src/cv/geometry.ts` — helper functions: `angleDeg`, `midpoint`, `spineAngle`, `hipSymmetryDelta`.

**7.4** Write `frontend/src/components/session/CameraView.tsx` — `getUserMedia({ video: true })`, renders `<video>` and `<canvas>` stacked.

**7.5** Write `frontend/src/components/session/SkeletonOverlay.tsx` — draws landmark dots and connecting lines on the canvas each frame.

**7.6** Wire MediaPipe into `SessionRunner.tsx` — load model on mount, `requestAnimationFrame` loop calling `detectPose` and passing result to `SkeletonOverlay`.

**7.7** Update `vite.config.ts` with the `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` response headers required for `SharedArrayBuffer` (MediaPipe WASM needs this).

### Done When
- [ ] Camera feed visible inside session with coloured skeleton overlay
- [ ] 33 landmarks rendered as dots with connecting lines
- [ ] FPS counter in corner shows 25–30 fps
- [ ] Camera permission denied shows a clear user-facing error message (not a blank screen)

---

## Phase 8 — Exercise Scorers (Browser JS)

**Goal:** All 5 CV-scored exercises count reps automatically and report form scores.

**Who writes it:** Claude Code writes all scorers. User tests each one physically.

### Steps

**8.1** Write `frontend/src/cv/scorers/base.ts` — `SetupCheck`, `CoachingHint`, `ScorerOutput`, and `ExerciseScorer` interface definitions.

**8.2** Write `frontend/src/cv/scorers/pelvicTilt.ts` — full `PelvicTiltScorer` class implementing `ExerciseScorer`. This is the template all other scorers follow. Includes: setup checks (camera distance, full body visible), rep counting via angle threshold hysteresis, form scoring per rep, coaching cue generation.

**8.3** Write remaining 4 scorers: `gluteBridge.ts`, `catCow.ts`, `birdDog.ts`, `deadBug.ts`.

**8.4** Write `frontend/src/components/session/ExerciseHUD.tsx` — displays: current rep count, target rep count, current phase (e.g. "Hold"), form score badge (colour-coded green/amber/red).

**8.5** Write `frontend/src/components/session/SetupChecklist.tsx` — shown for 3 seconds before each CV exercise; shows green/red status for each `SetupCheck` (camera distance, lighting, full body in frame).

**8.6** Write `frontend/src/components/session/CoachingCueDisplay.tsx` — receives `CoachingHint` objects and speaks them via `window.speechSynthesis`. Shows text on screen simultaneously.

**8.7** In `SessionRunner.tsx`: when exercise type is `'cv'`, instantiate the correct scorer class, call `scorer.processFrame(landmarks)` every animation frame, pass `ScorerOutput` to `ExerciseHUD`.

**8.8** Collect `ScorerOutput.repScores` and include them in the `CompleteSessionPayload` sent to FastAPI.

### Done When
- [ ] All 5 CV scorers count 9 out of 10 reps correctly on a personal test set
- [ ] Form score badge updates after each rep
- [ ] At least one coaching cue is spoken aloud during a session
- [ ] Setup checklist shows and clears before exercise starts

---

## Phase 9 — Outcomes Pipeline

**Goal:** Real pain trend chart, working ODI form, all dashboard stats populated with real data.

**Who writes it:** Python — user. React chart and form — Claude Code.

### Steps

**9.1** Write `backend/services/outcomes/pain_trend.py` — queries `pain_logs` for the last 14 days, groups by calendar day, returns array of `{date, avg_nprs}`.

**9.2** Update `GET /pain/trend` in `backend/routers/pain.py` to call this service.

**9.3** Update `frontend/src/components/dashboard/PainTrendChart.tsx` to render real `{date, avg_nprs}` data from the API.

**9.4** Write `backend/services/outcomes/odi_scorer.py` — `score_odi(responses: dict[str, int]) -> int` function implementing the standard Oswestry Disability Index scoring algorithm.

**9.5** Write `backend/routers/odi.py` — `POST /odi/submit` (scores and saves to `odi_submissions`) and `GET /odi/latest` (returns most recent score).

**9.6** Write `frontend/src/pages/ODI.tsx` — all 10 ODI sections, 6 radio options each (labelled per ODI standard), submit calls `POST /odi/submit`, shows resulting score and disability category.

**9.7** Update `backend/routers/dashboard.py` — replace zeros with real queries: session count, current streak, average form score from `session_reps`, latest ODI disability %, current week number.

### Done When
- [ ] Pain trend chart shows real NPRS data points after logging pain multiple times
- [ ] ODI form submits and the score (0–100) and disability category appear on screen
- [ ] All 5 dashboard stat cards show real numbers from DB

---

## Phase 10 — Weekly Loop

**Goal:** Weekly coach check-in, safety re-screen, and program progression all working end-to-end.

**Who writes it:** Python — user. React pages — Claude Code.

### Steps

**10.1** Write `backend/services/ai/coach_checkin.py` — `build_checkin_context()` (queries last 14 days pain, sessions this week, last 2 ODI scores) and `generate_coach_checkin()` (Claude call returning structured JSON with fields: `greeting`, `observations`, `reflectionQuestions`, `guidanceForNextWeek`, `safetyFlag`).

**10.2** Write `backend/routers/checkin.py` — `POST /checkin/generate` (triggers Claude call, saves to `coach_checkins`) and `POST /checkin/respond` (saves member's answers).

**10.3** Write `frontend/src/pages/Checkin.tsx` — displays Claude's `greeting` and `observations`, renders a textarea for each `reflectionQuestion`, submit button calls `POST /checkin/respond`.

**10.4** Write `backend/services/safety/rescreen_trigger.py` — `should_trigger_rescreen(member_id, supabase_client) -> bool`: returns `True` if it is a week boundary OR the 7-day average NPRS increased by >= 2 points.

**10.5** Write `backend/routers/rescreen.py` — `POST /rescreen/submit` — runs `evaluate_red_flags()` on new answers, saves to `safety_rescreens`, returns `{result, blocked}`.

**10.6** Write `frontend/src/pages/Rescreen.tsx` — same 6 yes/no questions as onboarding `RedFlag.tsx`, calls `POST /rescreen/submit`, shows `BlockedScreen` if result is `'block'`.

**10.7** Write `backend/services/progression/engine.py` — `evaluate_progression()`: for each exercise in the current week's program, checks (1) sessions this week >= 3, (2) rep hit-rate >= 0.75, (3) average form score >= 75 for CV exercises. Returns list of `{exercise_id, decision, reason, next_exercise_id}`.

**10.8** Write `backend/routers/progression.py` — `POST /progression/advance` — calls `evaluate_progression()`, inserts new `program_weeks` row for week N+1, returns new program.

**10.9** Add "Advance to Week N+1" button on Dashboard (visible when on last day of week). On click, calls `POST /progression/advance`, refreshes dashboard.

### Done When
- [ ] `POST /checkin/generate` returns a personalised message referencing the member's actual pain trend
- [ ] Safety re-screen showing a block-level answer navigates to `BlockedScreen`
- [ ] `POST /progression/advance` creates a new `program_weeks` row in Supabase
- [ ] Dashboard shows new week number and new exercise list after advancing

---

## Phase 11 — Hardening & Pilot Prep

**Goal:** Production-ready, error-monitored, smoke-tested.

### Steps

**11.1** Add structured logging to all FastAPI routes using Python's `logging` module (log route, user_id, duration in ms).

**11.2** Deploy backend to Railway: create project, link GitHub repo, set all env vars from `backend/.env` as Railway environment variables, enable healthcheck on `/health`.

**11.4** Deploy frontend to Vercel: import repository, set `VITE_API_URL` to the Railway URL, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**11.5** Full smoke test as a fresh member (see Done When below).

**11.6** Performance check: FastAPI p95 < 200 ms (Railway metrics), CV pipeline FPS > 25 on a 2020-era laptop.

### Done When
- [ ] Sign up as a brand-new user
- [ ] Complete red-flag screen (all "no")
- [ ] Complete intake form
- [ ] Dashboard loads with generated program
- [ ] Complete one full session (PRE_PAIN -> all exercises -> POST_PAIN -> COMPLETE)
- [ ] Log pain score from dashboard
- [ ] Submit ODI form, see score
- [ ] Generate coach check-in, submit response
- [ ] Advance to week 2
- [ ] Railway healthcheck green
- [ ] Vercel deployment live on custom or Vercel domain

---

## Phase Summary Table

| Phase | Name | Who Writes It | Rough Time |
|-------|------|--------------|------------|
| 0 | Project Setup | Both | 2-3 hours |
| 1 | Authentication | Python: user, JS: Claude | 3-4 hours |
| 2 | Database Schema | SQL: user runs it | 1 hour |
| 3 | Onboarding Flow | **Python: user**, JS: Claude | 4-5 hours |
| 4 | Dashboard Static | Python: user, JS: Claude | 3-4 hours |
| 5 | AI Program Generation | **Python: user**, JS: Claude | 4-6 hours |
| 6 | Session Shell | Python: user, JS: Claude | 4-5 hours |
| 7 | CV Pipeline | **JS: Claude Code** | 4-6 hours |
| 8 | Exercise Scorers | **JS: Claude Code** | 6-10 hours |
| 9 | Outcomes Pipeline | **Python: user**, JS: Claude | 4-5 hours |
| 10 | Weekly Loop | **Python: user**, JS: Claude | 6-8 hours |
| 11 | Hardening & Pilot Prep | Both | 3-4 hours |

**Total estimate:** ~45-60 hours of active work spread across the 90-day pilot.

---

## Build Order Rule

> Build plumbing before intelligence. Never skip phases.

- Authentication before any data writes
- Schema before any backend routes that touch the DB
- Session shell before CV pipeline (you need a working session to plug CV into)
- Outcomes pipeline before weekly loop (coach check-in needs real data)

---

---

# PART 2: BOILERPLATE & CONFIG CODE REFERENCE

---

## Phase 0 — Setup

### `backend/requirements.txt`

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
anthropic>=0.49.0
supabase>=2.10.0
python-jose[cryptography]>=3.3.0
pydantic>=2.0.0
python-dotenv>=1.0.0
httpx>=0.27.0
```

### `backend/.env` (template — never commit this file)

```
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-project-settings-api
ANTHROPIC_API_KEY=sk-ant-api03-...
ELEVENLABS_API_KEY=
```

### `frontend/.env.local` (template — never commit this file)

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:8000
```

### `backend/main.py`

```python
import logging

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("main")

app = FastAPI(title="Wellness Coach MSK API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://wellness-coach-msk.vercel.app",  # update with your real domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers (uncomment as you build each phase) ---
# from routers import auth, intake, dashboard, pain, program, session, odi, checkin, progression, rescreen
# app.include_router(auth.router)
# app.include_router(intake.router)
# app.include_router(dashboard.router)
# app.include_router(pain.router)
# app.include_router(program.router)
# app.include_router(session.router)
# app.include_router(odi.router)
# app.include_router(checkin.router)
# app.include_router(progression.router)
# app.include_router(rescreen.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    headers: {
      // Required for MediaPipe WASM (SharedArrayBuffer)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
})
```

---

## Phase 1 — Auth Boilerplate

### `backend/db/supabase.py`

```python
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client
import os

load_dotenv()


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)
```

### `backend/routers/auth.py`

```python
import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

load_dotenv()

_bearer = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> str:
    """
    FastAPI dependency. Validates the Supabase JWT and returns the user_id (sub claim).

    Usage in a route:
        @router.get("/me")
        async def me(user_id: str = Depends(get_current_user)):
            return {"user_id": user_id}
    """
    token = credentials.credentials
    jwt_secret = os.environ["SUPABASE_JWT_SECRET"]

    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase JWTs have no standard audience
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise ValueError("No sub claim in token")
        return user_id
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
```

### `frontend/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### `frontend/src/api/client.ts`

```typescript
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL as string

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function apiCall<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeader = await getAuthHeader()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new ApiError(res.status, body || res.statusText)
  }

  return res.json() as Promise<T>
}

export { ApiError }
```

### `frontend/src/App.tsx`

```typescript
import { useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

// Pages — create these files as you build each phase
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Session from './pages/Session'
import ODI from './pages/ODI'
import Checkin from './pages/Checkin'
import Rescreen from './pages/Rescreen'
import RedFlag from './pages/Onboarding/RedFlag'
import Intake from './pages/Onboarding/Intake'
import BlockedScreen from './pages/Onboarding/BlockedScreen'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    // Still loading — render nothing (or a spinner)
    return null
  }

  return session ? <>{children}</> : <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/blocked" element={<BlockedScreen />} />

        {/* Onboarding */}
        <Route
          path="/onboarding/red-flag"
          element={
            <ProtectedRoute>
              <RedFlag />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/intake"
          element={
            <ProtectedRoute>
              <Intake />
            </ProtectedRoute>
          }
        />

        {/* App */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session"
          element={
            <ProtectedRoute>
              <Session />
            </ProtectedRoute>
          }
        />
        <Route
          path="/odi"
          element={
            <ProtectedRoute>
              <ODI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute>
              <Checkin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rescreen"
          element={
            <ProtectedRoute>
              <Rescreen />
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
```

---

## Phase 2 — Database Migrations

### `0001_initial.sql`

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- member_profiles
create table if not exists public.member_profiles (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null unique,
  pain_location  text not null,
  nprs_baseline  smallint not null check (nprs_baseline between 0 and 10),
  duration_weeks int not null,
  prior_care     boolean not null default false,
  red_flag_result text not null check (red_flag_result in ('safe', 'warn', 'block')),
  created_at     timestamptz not null default now()
);
alter table public.member_profiles enable row level security;
create policy "member owns profile"
  on public.member_profiles for all
  using (auth.uid() = user_id);

-- program_weeks
create table if not exists public.program_weeks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  week_number smallint not null,
  exercises   jsonb not null default '[]'::jsonb,
  generated_by text not null default 'claude',
  created_at  timestamptz not null default now(),
  unique(user_id, week_number)
);
alter table public.program_weeks enable row level security;
create policy "member owns weeks"
  on public.program_weeks for all
  using (auth.uid() = user_id);

-- sessions
create table if not exists public.sessions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  week_number   smallint not null,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  pre_pain_nprs smallint check (pre_pain_nprs between 0 and 10),
  post_pain_nprs smallint check (post_pain_nprs between 0 and 10),
  status        text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned'))
);
alter table public.sessions enable row level security;
create policy "member owns sessions"
  on public.sessions for all
  using (auth.uid() = user_id);

-- session_reps
create table if not exists public.session_reps (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid references public.sessions(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  exercise_id  text not null,
  rep_number   smallint not null,
  form_score   smallint check (form_score between 0 and 100),
  landmarks_snapshot jsonb,
  created_at   timestamptz not null default now()
);
alter table public.session_reps enable row level security;
create policy "member owns reps"
  on public.session_reps for all
  using (auth.uid() = user_id);
```

### `0002_outcomes.sql`

```sql
-- pain_logs
create table if not exists public.pain_logs (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete set null,
  nprs      smallint not null check (nprs between 0 and 10),
  context   text check (context in ('pre_session', 'post_session', 'daily_log')),
  logged_at timestamptz not null default now()
);
alter table public.pain_logs enable row level security;
create policy "member owns pain logs"
  on public.pain_logs for all
  using (auth.uid() = user_id);

-- odi_submissions
create table if not exists public.odi_submissions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  score       smallint not null check (score between 0 and 100),
  odi_responses jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);
alter table public.odi_submissions enable row level security;
create policy "member owns odi"
  on public.odi_submissions for all
  using (auth.uid() = user_id);

-- coach_checkins
create table if not exists public.coach_checkins (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  week_number  smallint not null,
  ai_message   jsonb not null,
  member_response jsonb,
  safety_flag  boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table public.coach_checkins enable row level security;
create policy "member owns checkins"
  on public.coach_checkins for all
  using (auth.uid() = user_id);

-- safety_rescreens
create table if not exists public.safety_rescreens (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  week_number smallint not null,
  answers     jsonb not null,
  result      text not null check (result in ('safe', 'warn', 'block')),
  screened_at timestamptz not null default now()
);
alter table public.safety_rescreens enable row level security;
create policy "member owns rescreens"
  on public.safety_rescreens for all
  using (auth.uid() = user_id);
```

### `0003_odi_responses.sql`

```sql
-- This migration is a no-op if you ran 0002_outcomes.sql after the initial version.
-- It ensures the odi_responses column exists and has the correct type.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'odi_submissions' and column_name = 'odi_responses'
  ) then
    alter table public.odi_submissions add column odi_responses jsonb not null default '{}'::jsonb;
  end if;
end $$;
```

---

## Phase 3 — Safety & Intake Boilerplate

### `backend/services/safety/red_flags.py`

```python
from typing import Literal

RED_FLAG_QUESTIONS: list[dict] = [
    {
        "id": "bowel_bladder",
        "text": "Have you noticed any loss of control of your bladder or bowels recently?",
        "severity": "block",
    },
    {
        "id": "saddle_numbness",
        "text": "Do you have numbness or tingling in your groin or inner thighs (saddle area)?",
        "severity": "block",
    },
    {
        "id": "progressive_weakness",
        "text": "Have you noticed progressive weakness in one or both legs in the last few days?",
        "severity": "block",
    },
    {
        "id": "unexplained_weight_loss",
        "text": "Have you had unexplained weight loss of more than 5 kg in the past 3 months?",
        "severity": "warn",
    },
    {
        "id": "night_pain",
        "text": "Is your back pain worse at night and does it wake you from sleep?",
        "severity": "warn",
    },
    {
        "id": "fever",
        "text": "Have you had a fever, chills, or felt generally unwell along with your back pain?",
        "severity": "warn",
    },
]


def evaluate_red_flags(
    answers: dict[str, bool],
) -> Literal["safe", "warn", "block"]:
    """
    Given a dict of {question_id: bool}, return safety classification.

    'block' -- one or more block-severity questions answered True.
               User must not proceed; show emergency referral message.
    'warn'  -- one or more warn-severity questions answered True.
               Proceed but flag for clinical review.
    'safe'  -- all answers False.
    """
    question_map = {q["id"]: q for q in RED_FLAG_QUESTIONS}
    result: Literal["safe", "warn", "block"] = "safe"

    for question_id, answered_yes in answers.items():
        if not answered_yes:
            continue
        question = question_map.get(question_id)
        if question is None:
            continue
        if question["severity"] == "block":
            return "block"  # Short-circuit -- any block answer is immediately block
        if question["severity"] == "warn":
            result = "warn"

    return result
```

### `backend/models/intake.py`

```python
from pydantic import BaseModel, Field
from typing import Literal


class RedFlagAnswers(BaseModel):
    bowel_bladder: bool = False
    saddle_numbness: bool = False
    progressive_weakness: bool = False
    unexplained_weight_loss: bool = False
    night_pain: bool = False
    fever: bool = False


class IntakeData(BaseModel):
    pain_location: Literal[
        "lower_back_central",
        "lower_back_left",
        "lower_back_right",
        "bilateral_leg",
        "left_leg",
        "right_leg",
    ]
    nprs_baseline: int = Field(..., ge=0, le=10)
    duration_weeks: int = Field(..., ge=0, description="How many weeks they have had pain")
    prior_care: bool = Field(default=False, description="Has seen physio or GP for this episode")
    occupation: Literal["desk", "manual", "mixed", "retired_student_other"] | None = None
    notes: str | None = Field(default=None, max_length=500)
```

### `backend/routers/intake.py`

```python
import logging
from fastapi import APIRouter, Depends, HTTPException, status

from db.supabase import get_supabase
from models.intake import IntakeData, RedFlagAnswers
from routers.auth import get_current_user
from services.safety.red_flags import RED_FLAG_QUESTIONS, evaluate_red_flags

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/intake", tags=["intake"])


@router.post("/red-flag")
async def submit_red_flag(
    answers: RedFlagAnswers,
    user_id: str = Depends(get_current_user),
) -> dict:
    result = evaluate_red_flags(answers.model_dump())
    logger.info("red_flag user=%s result=%s", user_id, result)
    return {"result": result, "questions": RED_FLAG_QUESTIONS}


@router.post("/profile")
async def submit_intake(
    data: IntakeData,
    user_id: str = Depends(get_current_user),
) -> dict:
    sb = get_supabase()

    # Upsert so re-submissions update rather than duplicate
    response = (
        sb.table("member_profiles")
        .upsert(
            {
                "user_id": user_id,
                "pain_location": data.pain_location,
                "nprs_baseline": data.nprs_baseline,
                "duration_weeks": data.duration_weeks,
                "prior_care": data.prior_care,
                "red_flag_result": "safe",  # Caller verified red flags before reaching here
            },
            on_conflict="user_id",
        )
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save member profile",
        )

    logger.info("intake saved user=%s", user_id)

    # Phase 5 will add: await generate_and_save_program(data, user_id, sb)
    return {"status": "ok", "user_id": user_id}
```

---

## Phase 4 — Dashboard Boilerplate

### `backend/routers/dashboard.py`

```python
import logging
from fastapi import APIRouter, Depends

from db.supabase import get_supabase
from routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)) -> dict:
    """
    Returns stats for the dashboard.
    Phase 4: returns zeros.
    Phase 9: replace with real queries.
    """
    sb = get_supabase()

    # --- Session count ---
    sessions_resp = (
        sb.table("sessions")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .execute()
    )
    total_sessions = sessions_resp.count or 0

    # --- Current week number ---
    weeks_resp = (
        sb.table("program_weeks")
        .select("week_number")
        .eq("user_id", user_id)
        .order("week_number", desc=True)
        .limit(1)
        .execute()
    )
    current_week = weeks_resp.data[0]["week_number"] if weeks_resp.data else 1

    return {
        "total_sessions": total_sessions,
        "streak_days": 0,          # Phase 9: calculate from pain_logs dates
        "avg_form_score": None,    # Phase 9: avg from session_reps
        "latest_odi_score": None,  # Phase 9: from odi_submissions
        "current_week": current_week,
    }
```

### `backend/models/outcomes.py`

```python
from pydantic import BaseModel, Field
from typing import Literal


class PainLog(BaseModel):
    nprs: int = Field(..., ge=0, le=10)
    context: Literal["pre_session", "post_session", "daily_log"] = "daily_log"
    session_id: str | None = None
```

### `backend/routers/pain.py`

```python
import logging
from fastapi import APIRouter, Depends

from db.supabase import get_supabase
from models.outcomes import PainLog
from routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pain", tags=["pain"])


@router.post("/log")
async def log_pain(
    payload: PainLog,
    user_id: str = Depends(get_current_user),
) -> dict:
    sb = get_supabase()
    sb.table("pain_logs").insert(
        {
            "user_id": user_id,
            "nprs": payload.nprs,
            "context": payload.context,
            "session_id": payload.session_id,
        }
    ).execute()
    logger.info("pain_log user=%s nprs=%d", user_id, payload.nprs)
    return {"ok": True}


@router.get("/trend")
async def get_pain_trend(user_id: str = Depends(get_current_user)) -> dict:
    """
    Phase 4: returns 14 zeros.
    Phase 9: replace with real query from services/outcomes/pain_trend.py
    """
    return {
        "trend": [{"date": None, "avg_nprs": 0.0} for _ in range(14)],
    }
```

### `frontend/src/pages/Dashboard.tsx`

```typescript
import { useEffect, useState } from 'react'
import { apiCall } from '../api/client'
import ProgressBlock from '../components/dashboard/ProgressBlock'
import PainTrendChart from '../components/dashboard/PainTrendChart'
import PainLogInline from '../components/dashboard/PainLogInline'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  total_sessions: number
  streak_days: number
  avg_form_score: number | null
  latest_odi_score: number | null
  current_week: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    apiCall<DashboardStats>('/dashboard/stats')
      .then(setStats)
      .catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="p-8 text-red-600">Error: {error}</div>
  if (!stats) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Dashboard — Week {stats.current_week}</h1>

      <ProgressBlock stats={stats} />
      <PainLogInline />
      <PainTrendChart />

      <button
        onClick={() => navigate('/session')}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition"
      >
        Start Today's Session
      </button>
    </div>
  )
}
```

### `frontend/src/components/dashboard/ProgressBlock.tsx`

```typescript
interface Stats {
  total_sessions: number
  streak_days: number
  avg_form_score: number | null
  latest_odi_score: number | null
  current_week: number
}

const StatCard = ({
  label,
  value,
  unit,
}: {
  label: string
  value: string | number
  unit?: string
}) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-1">
    <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
    <span className="text-2xl font-bold text-gray-900">
      {value}
      {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
    </span>
  </div>
)

export default function ProgressBlock({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard label="Sessions Done" value={stats.total_sessions} />
      <StatCard label="Day Streak" value={stats.streak_days} unit="days" />
      <StatCard
        label="Avg Form Score"
        value={stats.avg_form_score !== null ? stats.avg_form_score : '--'}
        unit={stats.avg_form_score !== null ? '%' : undefined}
      />
      <StatCard
        label="ODI Disability"
        value={stats.latest_odi_score !== null ? stats.latest_odi_score : '--'}
        unit={stats.latest_odi_score !== null ? '%' : undefined}
      />
      <StatCard label="Current Week" value={`Week ${stats.current_week}`} />
    </div>
  )
}
```

### `frontend/src/components/dashboard/PainLogInline.tsx`

```typescript
import { useState } from 'react'
import { apiCall } from '../../api/client'

export default function PainLogInline() {
  const [selected, setSelected] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  const handleLog = async (score: number) => {
    setSelected(score)
    await apiCall('/pain/log', {
      method: 'POST',
      body: JSON.stringify({ nprs: score, context: 'daily_log' }),
    })
    setSaved(true)
  }

  if (saved) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 font-medium">
        Pain level {selected}/10 logged. Thanks!
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <p className="text-sm font-medium text-gray-700 mb-3">
        How is your back pain right now? (0 = none, 10 = worst)
      </p>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => handleLog(i)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold border transition
              ${selected === i
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50'
              }`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### `frontend/src/components/dashboard/PainTrendChart.tsx`

```typescript
import { useEffect, useState } from 'react'
import { apiCall } from '../../api/client'

interface TrendPoint {
  date: string | null
  avg_nprs: number
}

export default function PainTrendChart() {
  const [data, setData] = useState<TrendPoint[]>([])

  useEffect(() => {
    apiCall<{ trend: TrendPoint[] }>('/pain/trend').then((r) => setData(r.trend))
  }, [])

  const W = 400
  const H = 100
  const pad = 12
  const maxNprs = 10
  const points = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2),
    y: H - pad - (d.avg_nprs / maxNprs) * (H - pad * 2),
  }))
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">14-Day Pain Trend</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0, 5, 10].map((v) => {
          const y = H - pad - (v / maxNprs) * (H - pad * 2)
          return (
            <line key={v} x1={pad} y1={y} x2={W - pad} y2={y}
              stroke="#f3f4f6" strokeWidth="1" />
          )
        })}
        {points.length > 1 && (
          <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
        ))}
      </svg>
    </div>
  )
}
```

---

## Phase 5 — AI Program Generation Boilerplate

### `backend/data/exercise_library.json`

```json
{
  "exercises": [
    {
      "id": "pelvic_tilt",
      "name": "Pelvic Tilt",
      "type": "cv",
      "description": "Gentle flattening of the lower back against the floor",
      "default_sets": 2,
      "default_reps": 10,
      "rest_seconds": 30,
      "cues": ["Breathe out as you flatten", "Keep shoulders relaxed", "Hold 2 seconds at top"],
      "contraindications": ["acute_disc_herniation"]
    },
    {
      "id": "glute_bridge",
      "name": "Glute Bridge",
      "type": "cv",
      "description": "Hip hinge from lying to lift the pelvis off the floor",
      "default_sets": 2,
      "default_reps": 10,
      "rest_seconds": 45,
      "cues": ["Drive through heels", "Squeeze glutes at top", "Lower slowly in 3 seconds"],
      "contraindications": []
    },
    {
      "id": "cat_cow",
      "name": "Cat-Cow",
      "type": "cv",
      "description": "Alternating spinal flexion and extension on all fours",
      "default_sets": 2,
      "default_reps": 10,
      "rest_seconds": 30,
      "cues": ["Move slowly and breathe", "Full range both directions", "Keep arms straight"],
      "contraindications": []
    },
    {
      "id": "bird_dog",
      "name": "Bird-Dog",
      "type": "cv",
      "description": "Opposite arm and leg extension from quadruped",
      "default_sets": 2,
      "default_reps": 8,
      "rest_seconds": 45,
      "cues": ["Keep hips level", "Reach long not high", "Brace your core before moving"],
      "contraindications": []
    },
    {
      "id": "dead_bug",
      "name": "Dead Bug",
      "type": "cv",
      "description": "Opposite arm and leg lowering from supine with core engaged",
      "default_sets": 2,
      "default_reps": 8,
      "rest_seconds": 45,
      "cues": ["Keep lower back pressed down", "Lower only as far as you can control", "Exhale on the way down"],
      "contraindications": []
    },
    {
      "id": "knee_to_chest",
      "name": "Knee-to-Chest Stretch",
      "type": "self_paced",
      "description": "Single knee hugged to chest for lumbar mobility",
      "default_sets": 1,
      "default_reps": 5,
      "hold_seconds": 20,
      "rest_seconds": 15,
      "cues": ["Hold 20 seconds each side", "Keep the other leg long", "No bouncing"],
      "contraindications": []
    },
    {
      "id": "child_pose",
      "name": "Child's Pose",
      "type": "self_paced",
      "description": "Kneeling forward fold for lumbar and hip flexor stretch",
      "default_sets": 1,
      "default_reps": 3,
      "hold_seconds": 30,
      "rest_seconds": 15,
      "cues": ["Reach arms far forward", "Let your chest drop", "Breathe into your lower back"],
      "contraindications": []
    },
    {
      "id": "piriformis_stretch",
      "name": "Piriformis Stretch",
      "type": "self_paced",
      "description": "Figure-4 hip external rotation stretch",
      "default_sets": 1,
      "default_reps": 4,
      "hold_seconds": 30,
      "rest_seconds": 20,
      "cues": ["Gentle pull only", "Keep foot flexed", "If you feel sharp nerve pain stop"],
      "contraindications": ["acute_sciatica_severe"]
    },
    {
      "id": "sciatic_nerve_floss",
      "name": "Sciatic Nerve Floss",
      "type": "self_paced",
      "description": "Seated ankle pumps with neck flexion/extension for neural mobilisation",
      "default_sets": 2,
      "default_reps": 10,
      "rest_seconds": 30,
      "cues": ["Never force range", "Rhythmic and slow", "Stop if sharp referral"],
      "contraindications": ["disc_protrusion_severe"]
    },
    {
      "id": "thoracic_rotation",
      "name": "Thoracic Rotation",
      "type": "self_paced",
      "description": "Side-lying thoracic rotation with top arm sweeping open",
      "default_sets": 1,
      "default_reps": 8,
      "rest_seconds": 20,
      "cues": ["Let your eyes follow your hand", "Keep hips stacked", "Exhale as you open"],
      "contraindications": []
    }
  ]
}
```

### `backend/models/program.py`

```python
from pydantic import BaseModel, Field
from typing import Literal


class ProgramExercise(BaseModel):
    exercise_id: str
    name: str
    type: Literal["cv", "self_paced"]
    sets: int = Field(..., ge=1, le=5)
    reps: int = Field(..., ge=1, le=30)
    hold_seconds: int | None = None
    rest_seconds: int = Field(default=30, ge=0, le=120)
    rationale: str | None = None  # Claude's one-line reason for including this exercise


class GeneratedProgram(BaseModel):
    week_number: int = 1
    exercises: list[ProgramExercise]
    program_notes: str | None = None
    generated_by: Literal["claude", "fallback"] = "claude"
```

### `backend/services/ai/program_generator.py`

```python
import asyncio
import json
import logging
import re
from pathlib import Path

import anthropic

from models.intake import IntakeData
from models.program import GeneratedProgram, ProgramExercise

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic()

_EXERCISE_LIBRARY_PATH = Path(__file__).parent.parent.parent / "data" / "exercise_library.json"
with _EXERCISE_LIBRARY_PATH.open() as f:
    _EXERCISE_LIBRARY: dict = json.load(f)

SYSTEM_PROMPT = """You are a physiotherapist-grade AI assistant helping design safe, personalised lower back pain rehabilitation programs.

Given a patient's intake information you will select 5-7 exercises from the provided library and configure sets and reps appropriate for their pain level and duration.

Guidelines:
- NPRS >= 7: prioritise gentle mobility (cat_cow, knee_to_chest, child_pose), low reps (6-8), no loading exercises
- NPRS 4-6: balanced mix of CV-scored strengthening and mobility, 8-10 reps
- NPRS <= 3: can include all CV exercises, 10-12 reps
- Always include at least 2 CV-scored exercises so the camera-based feedback system has targets
- Always include at least 1 mobility/self-paced exercise
- Provide a one-sentence rationale for each exercise inclusion

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "week_number": 1,
  "exercises": [
    {
      "exercise_id": "pelvic_tilt",
      "name": "Pelvic Tilt",
      "type": "cv",
      "sets": 2,
      "reps": 10,
      "rest_seconds": 30,
      "rationale": "Activates deep lumbar stabilisers without loading the spine"
    }
  ],
  "program_notes": "Start slowly and rest on any days with pain > 7/10",
  "generated_by": "claude"
}"""


def _build_user_prompt(intake: IntakeData) -> str:
    library_summary = json.dumps(
        [
            {
                "id": e["id"],
                "name": e["name"],
                "type": e["type"],
                "contraindications": e.get("contraindications", []),
            }
            for e in _EXERCISE_LIBRARY["exercises"]
        ],
        indent=2,
    )
    return f"""Patient intake:
- Pain location: {intake.pain_location}
- Current pain (NPRS 0-10): {intake.nprs_baseline}
- Duration: {intake.duration_weeks} weeks
- Prior physiotherapy or GP care: {intake.prior_care}
- Occupation: {intake.occupation or 'not specified'}

Available exercises:
{library_summary}

Please generate a personalised Week 1 program."""


def _extract_json(text: str) -> str:
    """Strip any markdown fences that Claude may include despite instructions."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return text


def _build_fallback_program(intake: IntakeData) -> GeneratedProgram:
    """Deterministic fallback when Claude is unavailable."""
    if intake.nprs_baseline >= 7:
        exercise_ids = ["cat_cow", "knee_to_chest", "child_pose", "pelvic_tilt"]
        reps = 6
    elif intake.nprs_baseline >= 4:
        exercise_ids = ["pelvic_tilt", "cat_cow", "glute_bridge", "knee_to_chest", "child_pose"]
        reps = 8
    else:
        exercise_ids = ["pelvic_tilt", "glute_bridge", "bird_dog", "dead_bug", "cat_cow", "child_pose"]
        reps = 10

    ex_map = {e["id"]: e for e in _EXERCISE_LIBRARY["exercises"]}
    exercises = [
        ProgramExercise(
            exercise_id=eid,
            name=ex_map[eid]["name"],
            type=ex_map[eid]["type"],
            sets=ex_map[eid].get("default_sets", 2),
            reps=reps,
            hold_seconds=ex_map[eid].get("hold_seconds"),
            rest_seconds=ex_map[eid].get("rest_seconds", 30),
            rationale=None,
        )
        for eid in exercise_ids
        if eid in ex_map
    ]
    return GeneratedProgram(
        week_number=1,
        exercises=exercises,
        program_notes="Standard program. Complete on 3 non-consecutive days per week.",
        generated_by="fallback",
    )


async def generate_program(intake: IntakeData) -> GeneratedProgram:
    try:
        response = await asyncio.to_thread(
            _client.messages.create,
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": _build_user_prompt(intake)}],
        )
        text = response.content[0].text
        raw_json = _extract_json(text)
        program = GeneratedProgram.model_validate_json(raw_json)
        logger.info("program generated by claude exercises=%d", len(program.exercises))
        return program
    except Exception as exc:
        logger.warning("claude program generation failed, using fallback: %s", exc)
        return _build_fallback_program(intake)
```

---

## Phase 6 — Session Shell Boilerplate

### `backend/models/session.py`

```python
from pydantic import BaseModel, Field
from typing import Optional


class RepData(BaseModel):
    exercise_id: str
    rep_number: int = Field(..., ge=1)
    form_score: Optional[int] = Field(default=None, ge=0, le=100)
    landmarks_snapshot: Optional[dict] = None  # Optional sparse landmark dict


class CompleteSessionPayload(BaseModel):
    pre_pain_nprs: int = Field(..., ge=0, le=10)
    post_pain_nprs: int = Field(..., ge=0, le=10)
    reps: list[RepData]
```

### `backend/routers/session.py`

```python
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from db.supabase import get_supabase
from models.session import CompleteSessionPayload
from routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/session", tags=["session"])


@router.post("/start")
async def start_session(
    week_number: int = 1,
    user_id: str = Depends(get_current_user),
) -> dict:
    sb = get_supabase()
    result = (
        sb.table("sessions")
        .insert(
            {
                "user_id": user_id,
                "week_number": week_number,
                "status": "in_progress",
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session",
        )
    session_id = result.data[0]["id"]
    logger.info("session_start user=%s session=%s", user_id, session_id)
    return {"session_id": session_id}


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    payload: CompleteSessionPayload,
    user_id: str = Depends(get_current_user),
) -> dict:
    sb = get_supabase()

    # Verify session belongs to this user
    check = (
        sb.table("sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Update session
    sb.table("sessions").update(
        {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "pre_pain_nprs": payload.pre_pain_nprs,
            "post_pain_nprs": payload.post_pain_nprs,
        }
    ).eq("id", session_id).execute()

    # Insert rep data
    if payload.reps:
        rep_rows = [
            {
                "session_id": session_id,
                "user_id": user_id,
                "exercise_id": rep.exercise_id,
                "rep_number": rep.rep_number,
                "form_score": rep.form_score,
                "landmarks_snapshot": rep.landmarks_snapshot,
            }
            for rep in payload.reps
        ]
        sb.table("session_reps").insert(rep_rows).execute()

    # Insert pain logs for pre/post
    sb.table("pain_logs").insert(
        [
            {
                "user_id": user_id,
                "session_id": session_id,
                "nprs": payload.pre_pain_nprs,
                "context": "pre_session",
            },
            {
                "user_id": user_id,
                "session_id": session_id,
                "nprs": payload.post_pain_nprs,
                "context": "post_session",
            },
        ]
    ).execute()

    logger.info(
        "session_complete user=%s session=%s reps=%d",
        user_id,
        session_id,
        len(payload.reps),
    )
    return {"ok": True}
```

### `frontend/src/components/session/SessionRunner.tsx`

```typescript
import { useState } from 'react'
import { apiCall } from '../../api/client'

type SessionState = 'PRE_PAIN' | 'EXERCISES' | 'POST_PAIN' | 'COMPLETE'

interface Exercise {
  exercise_id: string
  name: string
  type: 'cv' | 'self_paced'
  sets: number
  reps: number
}

interface RepRecord {
  exercise_id: string
  rep_number: number
  form_score: number | null
}

interface Props {
  sessionId: string
  exercises: Exercise[]
}

export default function SessionRunner({ sessionId, exercises }: Props) {
  const [state, setState] = useState<SessionState>('PRE_PAIN')
  const [prePain, setPrePain] = useState<number | null>(null)
  const [postPain, setPostPain] = useState<number | null>(null)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [repsDone, setRepsDone] = useState(0)
  const [allReps, setAllReps] = useState<RepRecord[]>([])

  const currentExercise = exercises[exerciseIndex]

  const handleRepDone = () => {
    const newRep: RepRecord = {
      exercise_id: currentExercise.exercise_id,
      rep_number: repsDone + 1,
      form_score: null, // Phase 8 will fill this in from the CV scorer
    }
    const updatedReps = [...allReps, newRep]
    setAllReps(updatedReps)
    const nextRepCount = repsDone + 1
    if (nextRepCount >= currentExercise.reps * currentExercise.sets) {
      if (exerciseIndex + 1 < exercises.length) {
        setExerciseIndex(exerciseIndex + 1)
        setRepsDone(0)
      } else {
        setState('POST_PAIN')
      }
    } else {
      setRepsDone(nextRepCount)
    }
  }

  const handleComplete = async () => {
    if (postPain === null) return
    await apiCall(`/session/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        pre_pain_nprs: prePain,
        post_pain_nprs: postPain,
        reps: allReps,
      }),
    })
    setState('COMPLETE')
  }

  if (state === 'PRE_PAIN') {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Before we start</h2>
        <p className="text-gray-600">Rate your current back pain (0 = none, 10 = worst):</p>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setPrePain(i)}
              className={`w-10 h-10 rounded-lg font-semibold border transition
                ${prePain === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}
            >
              {i}
            </button>
          ))}
        </div>
        <button
          disabled={prePain === null}
          onClick={() => setState('EXERCISES')}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40"
        >
          Start Exercises
        </button>
      </div>
    )
  }

  if (state === 'EXERCISES' && currentExercise) {
    const totalReps = currentExercise.sets * currentExercise.reps
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold">{currentExercise.name}</h2>
        <p className="text-gray-500">
          {currentExercise.sets} sets x {currentExercise.reps} reps
        </p>
        <div className="text-5xl font-bold text-center py-8 text-blue-600">
          {repsDone} / {totalReps}
        </div>
        {/* Phase 7+: CameraView and SkeletonOverlay go here */}
        <button
          onClick={handleRepDone}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg"
        >
          Rep Done
        </button>
        <p className="text-xs text-center text-gray-400">
          Exercise {exerciseIndex + 1} of {exercises.length}
        </p>
      </div>
    )
  }

  if (state === 'POST_PAIN') {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Nice work!</h2>
        <p className="text-gray-600">Rate your back pain now:</p>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setPostPain(i)}
              className={`w-10 h-10 rounded-lg font-semibold border transition
                ${postPain === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}
            >
              {i}
            </button>
          ))}
        </div>
        <button
          disabled={postPain === null}
          onClick={handleComplete}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40"
        >
          Finish Session
        </button>
      </div>
    )
  }

  if (state === 'COMPLETE') {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-6xl">Done!</div>
        <h2 className="text-2xl font-bold text-green-700">Session Complete!</h2>
        <p className="text-gray-600">
          Pain: {prePain}/10 -- {postPain}/10
        </p>
        <a href="/dashboard" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">
          Back to Dashboard
        </a>
      </div>
    )
  }

  return null
}
```

---

## Phase 7 — CV Pipeline Boilerplate

### `frontend/src/cv/poseTracker.ts`

```typescript
import {
  PoseLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'

let _landmarker: PoseLandmarker | null = null

export async function initPoseTracker(): Promise<void> {
  if (_landmarker) return
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  )
  _landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
}

export function detectPose(
  video: HTMLVideoElement,
  timestampMs: number,
): NormalizedLandmark[] | null {
  if (!_landmarker) return null
  const result = _landmarker.detectForVideo(video, timestampMs)
  return result.landmarks[0] ?? null
}

export function disposePoseTracker(): void {
  _landmarker?.close()
  _landmarker = null
}
```

### `frontend/src/cv/geometry.ts`

```typescript
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type Point = { x: number; y: number; z?: number }

/** Angle in degrees at vertex B formed by A-B-C. */
export function angleDeg(a: Point, b: Point, c: Point): number {
  const ba = { x: a.x - b.x, y: a.y - b.y }
  const bc = { x: c.x - b.x, y: c.y - b.y }
  const dot = ba.x * bc.x + ba.y * bc.y
  const magBa = Math.hypot(ba.x, ba.y)
  const magBc = Math.hypot(bc.x, bc.y)
  if (magBa === 0 || magBc === 0) return 0
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBa * magBc)))
  return (Math.acos(cosAngle) * 180) / Math.PI
}

/** Midpoint of two points. */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z ?? 0) + (b.z ?? 0)) / 2 }
}

/**
 * Approximate spine angle relative to vertical (degrees). 0 = perfectly upright.
 * Uses shoulder midpoint -> hip midpoint vector.
 */
export function spineAngle(landmarks: NormalizedLandmark[]): number {
  // MediaPipe indices: 11=left_shoulder, 12=right_shoulder, 23=left_hip, 24=right_hip
  const shoulderMid = midpoint(landmarks[11], landmarks[12])
  const hipMid = midpoint(landmarks[23], landmarks[24])
  const dx = shoulderMid.x - hipMid.x
  const dy = shoulderMid.y - hipMid.y
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI
}

/**
 * Hip symmetry delta: difference in Y-position between left and right hip.
 * 0 = level hips. Positive = right hip higher (in normalized image coords).
 */
export function hipSymmetryDelta(landmarks: NormalizedLandmark[]): number {
  return landmarks[24].y - landmarks[23].y
}

/** Returns true if a landmark's visibility score exceeds the threshold. */
export function isVisible(landmark: NormalizedLandmark, threshold = 0.5): boolean {
  return (landmark.visibility ?? 0) > threshold
}
```

### `frontend/src/components/session/CameraView.tsx`

```typescript
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

export interface CameraViewHandle {
  videoEl: HTMLVideoElement | null
}

interface Props {
  onError?: (msg: string) => void
}

const CameraView = forwardRef<CameraViewHandle, Props>(function CameraView({ onError }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useImperativeHandle(ref, () => ({ videoEl: videoRef.current }))

  useEffect(() => {
    let stream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then((s) => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      })
      .catch(() => {
        onError?.('Camera access denied. Please allow camera permissions and reload.')
      })

    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onError])

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[4/3] bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
      />
    </div>
  )
})

export default CameraView
```

---

## Phase 8 — Scorer Boilerplate

### `frontend/src/cv/scorers/base.ts`

```typescript
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export interface SetupCheck {
  id: string
  label: string
  pass: boolean
}

export interface CoachingHint {
  id: string
  text: string
  priority: 'info' | 'warn' | 'critical'
}

export interface RepScore {
  repNumber: number
  formScore: number          // 0-100
  hints: CoachingHint[]
}

export interface ScorerOutput {
  repsDone: number
  targetReps: number
  currentPhase: string        // e.g. "START", "HOLD", "RETURN"
  formScoreThisRep: number    // live score for the current in-progress rep
  repScores: RepScore[]       // completed reps
  setupChecks: SetupCheck[]
  activeHint: CoachingHint | null
  isComplete: boolean
}

export interface ExerciseScorer {
  readonly exerciseId: string
  setup(targetReps: number, targetSets: number): void
  processFrame(landmarks: NormalizedLandmark[], timestampMs: number): ScorerOutput
  reset(): void
}
```

### `frontend/src/cv/scorers/pelvicTilt.ts`

```typescript
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { angleDeg, isVisible } from '../geometry'
import type {
  CoachingHint,
  ExerciseScorer,
  RepScore,
  ScorerOutput,
  SetupCheck,
} from './base'

// MediaPipe landmark indices
const L_SHOULDER = 11
const R_SHOULDER = 12
const L_HIP = 23
const R_HIP = 24
const L_KNEE = 25
const R_KNEE = 26

type Phase = 'START' | 'TILT' | 'HOLD' | 'RETURN'

export class PelvicTiltScorer implements ExerciseScorer {
  readonly exerciseId = 'pelvic_tilt'

  private targetReps = 10
  private targetSets = 2
  private repsDone = 0
  private phase: Phase = 'START'
  private repScores: RepScore[] = []
  private repAngles: number[] = []
  private holdFrames = 0

  // Angle thresholds (degrees) -- tuned for supine pelvic tilt viewed from the side
  private readonly TILT_ENTER_THRESHOLD = 12   // lumbar flattens past this -> TILT phase
  private readonly TILT_RETURN_THRESHOLD = 6    // angle recovers below this -> RETURN phase
  private readonly HOLD_FRAMES_REQUIRED = 8     // ~250ms at 30fps

  setup(targetReps: number, targetSets: number): void {
    this.targetReps = targetReps
    this.targetSets = targetSets
  }

  reset(): void {
    this.repsDone = 0
    this.phase = 'START'
    this.repScores = []
    this.repAngles = []
    this.holdFrames = 0
  }

  processFrame(landmarks: NormalizedLandmark[], _timestampMs: number): ScorerOutput {
    const setupChecks = this._runSetupChecks(landmarks)
    const allPass = setupChecks.every((c) => c.pass)

    if (!allPass || this.repsDone >= this.targetReps * this.targetSets) {
      return this._buildOutput(setupChecks, null)
    }

    const lHip = landmarks[L_HIP]
    const rHip = landmarks[R_HIP]
    const lKnee = landmarks[L_KNEE]
    const rKnee = landmarks[R_KNEE]
    const lShoulder = landmarks[L_SHOULDER]
    const rShoulder = landmarks[R_SHOULDER]

    const hipMid = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 }
    const kneeMid = { x: (lKnee.x + rKnee.x) / 2, y: (lKnee.y + rKnee.y) / 2 }
    const shoulderMid = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 }

    const pelvisAngle = angleDeg(kneeMid, hipMid, shoulderMid)
    this.repAngles.push(pelvisAngle)

    let hint: CoachingHint | null = null

    switch (this.phase) {
      case 'START':
        if (pelvisAngle > this.TILT_ENTER_THRESHOLD) {
          this.phase = 'TILT'
          this.holdFrames = 0
        } else {
          hint = { id: 'start_cue', text: 'Flatten your lower back to the floor', priority: 'info' }
        }
        break

      case 'TILT':
        this.holdFrames++
        if (this.holdFrames >= this.HOLD_FRAMES_REQUIRED) {
          this.phase = 'HOLD'
        }
        hint = { id: 'hold_cue', text: 'Hold -- breathe out', priority: 'info' }
        break

      case 'HOLD':
        if (pelvisAngle < this.TILT_RETURN_THRESHOLD) {
          this.phase = 'RETURN'
        }
        hint = { id: 'hold_cue', text: 'Hold -- breathe out', priority: 'info' }
        break

      case 'RETURN':
        if (pelvisAngle < this.TILT_RETURN_THRESHOLD / 2) {
          const score = this._scoreRep()
          this.repScores.push({
            repNumber: this.repsDone + 1,
            formScore: score,
            hints: score < 60
              ? [{ id: 'form_low', text: 'Try to hold longer at the top', priority: 'warn' }]
              : [],
          })
          this.repsDone++
          this.phase = 'START'
          this.repAngles = []
          this.holdFrames = 0
        }
        hint = { id: 'return_cue', text: 'Slowly return to start', priority: 'info' }
        break
    }

    return this._buildOutput(setupChecks, hint)
  }

  private _scoreRep(): number {
    if (this.repAngles.length === 0) return 50
    const maxAngle = Math.max(...this.repAngles)
    const angleScore = Math.min(100, (maxAngle / 20) * 100)
    const holdScore = Math.min(100, (this.holdFrames / (this.HOLD_FRAMES_REQUIRED * 1.5)) * 100)
    return Math.round(angleScore * 0.6 + holdScore * 0.4)
  }

  private _runSetupChecks(landmarks: NormalizedLandmark[]): SetupCheck[] {
    return [
      {
        id: 'full_body',
        label: 'Full body visible',
        pass:
          isVisible(landmarks[L_SHOULDER]) &&
          isVisible(landmarks[R_SHOULDER]) &&
          isVisible(landmarks[L_HIP]) &&
          isVisible(landmarks[R_HIP]) &&
          isVisible(landmarks[L_KNEE]) &&
          isVisible(landmarks[R_KNEE]),
      },
      {
        id: 'lying_position',
        label: 'Lying on back detected',
        pass: landmarks[L_HIP].y > landmarks[L_SHOULDER].y,
      },
    ]
  }

  private _buildOutput(
    setupChecks: SetupCheck[],
    hint: CoachingHint | null,
  ): ScorerOutput {
    const lastRepScore =
      this.repScores.length > 0
        ? this.repScores[this.repScores.length - 1].formScore
        : 0

    return {
      repsDone: this.repsDone,
      targetReps: this.targetReps * this.targetSets,
      currentPhase: this.phase,
      formScoreThisRep: lastRepScore,
      repScores: this.repScores,
      setupChecks,
      activeHint: hint,
      isComplete: this.repsDone >= this.targetReps * this.targetSets,
    }
  }
}
```

---

## Phase 9 — Outcomes Pipeline Boilerplate

### `backend/services/outcomes/pain_trend.py`

```python
from collections import defaultdict
from datetime import date, timedelta

from db.supabase import get_supabase


async def get_pain_trend(user_id: str, days: int = 14) -> list[dict]:
    """
    Returns a list of {date: str (ISO), avg_nprs: float | None} for the last `days` days.
    Days with no entries get avg_nprs=None.
    """
    sb = get_supabase()
    cutoff = (date.today() - timedelta(days=days)).isoformat()

    result = (
        sb.table("pain_logs")
        .select("nprs, logged_at")
        .eq("user_id", user_id)
        .gte("logged_at", cutoff)
        .execute()
    )

    by_day: dict[str, list[int]] = defaultdict(list)
    for row in result.data:
        day = row["logged_at"][:10]  # ISO date portion
        by_day[day].append(row["nprs"])

    trend = []
    for offset in range(days - 1, -1, -1):
        d = (date.today() - timedelta(days=offset)).isoformat()
        values = by_day.get(d)
        trend.append(
            {
                "date": d,
                "avg_nprs": round(sum(values) / len(values), 1) if values else None,
            }
        )

    return trend
```

### `backend/services/outcomes/odi_scorer.py`

```python
def score_odi(responses: dict[str, int]) -> int:
    """
    Score an Oswestry Disability Index questionnaire.

    Args:
        responses: dict mapping section key (e.g. "s1_pain_intensity") to int 0-5.
                   Expects up to 10 sections.

    Returns:
        ODI score as an integer 0-100.
        Formula: (sum of responses / (5 * answered_sections)) * 100
    """
    answered = [v for v in responses.values() if isinstance(v, int) and 0 <= v <= 5]
    if not answered:
        return 0
    max_possible = 5 * len(answered)
    raw_score = sum(answered)
    return round((raw_score / max_possible) * 100)


def odi_category(score: int) -> str:
    """Return the standard ODI disability category label."""
    if score <= 20:
        return "Minimal Disability"
    elif score <= 40:
        return "Moderate Disability"
    elif score <= 60:
        return "Severe Disability"
    elif score <= 80:
        return "Crippling Back Pain"
    else:
        return "Bed-Bound / Exaggerating"
```

---

## Phase 10 — Weekly Loop Boilerplate

### `backend/services/ai/coach_checkin.py`

```python
import asyncio
import json
import logging
import re
from datetime import date, timedelta

import anthropic

from db.supabase import get_supabase

logger = logging.getLogger(__name__)
_client = anthropic.Anthropic()

CHECKIN_SYSTEM_PROMPT = """You are a warm, evidence-based physiotherapy coach conducting a weekly check-in for a lower back pain rehabilitation program.

Your role:
- Acknowledge what the member has accomplished this week
- Note patterns in their pain data with clinical insight but in plain language
- Ask 2-3 reflective questions that encourage self-awareness (not yes/no questions)
- Give one piece of specific guidance for the coming week based on their data
- Flag safety concern if pain is trending sharply upward (>2 NPRS points above baseline)

Tone: encouraging, professional, human. Never alarmist. Never more than 200 words total.

Return ONLY valid JSON, no markdown:
{
  "greeting": "string",
  "observations": "string",
  "reflectionQuestions": ["string", "string", "string"],
  "guidanceForNextWeek": "string",
  "safetyFlag": false
}"""


async def build_checkin_context(member_id: str) -> dict:
    sb = get_supabase()
    cutoff = (date.today() - timedelta(days=14)).isoformat()

    pain_resp = (
        sb.table("pain_logs")
        .select("nprs, logged_at, context")
        .eq("user_id", member_id)
        .gte("logged_at", cutoff)
        .order("logged_at")
        .execute()
    )

    sessions_resp = (
        sb.table("sessions")
        .select("id, completed_at, pre_pain_nprs, post_pain_nprs")
        .eq("user_id", member_id)
        .eq("status", "completed")
        .gte("completed_at", (date.today() - timedelta(days=7)).isoformat())
        .execute()
    )

    odi_resp = (
        sb.table("odi_submissions")
        .select("score, submitted_at")
        .eq("user_id", member_id)
        .order("submitted_at", desc=True)
        .limit(2)
        .execute()
    )

    profile_resp = (
        sb.table("member_profiles")
        .select("nprs_baseline, pain_location")
        .eq("user_id", member_id)
        .single()
        .execute()
    )

    return {
        "pain_logs": pain_resp.data,
        "sessions_this_week": sessions_resp.data,
        "odi_scores": odi_resp.data,
        "profile": profile_resp.data,
    }


def _format_context_for_prompt(ctx: dict) -> str:
    profile = ctx.get("profile") or {}
    pain_logs = ctx.get("pain_logs") or []
    sessions = ctx.get("sessions_this_week") or []
    odi = ctx.get("odi_scores") or []

    nprs_values = [p["nprs"] for p in pain_logs if p.get("nprs") is not None]
    avg_pain = round(sum(nprs_values) / len(nprs_values), 1) if nprs_values else "no data"
    latest_nprs = nprs_values[-1] if nprs_values else "unknown"

    odi_text = (
        f"Latest ODI score: {odi[0]['score']}% ({odi[0]['submitted_at'][:10]})"
        if odi
        else "No ODI submitted yet"
    )

    return f"""Member profile:
- Baseline NPRS: {profile.get('nprs_baseline', 'unknown')}
- Pain location: {profile.get('pain_location', 'unknown')}

This week:
- Sessions completed: {len(sessions)}
- Pain range: {min(nprs_values) if nprs_values else '?'}-{max(nprs_values) if nprs_values else '?'}/10
- Average NPRS (14 days): {avg_pain}
- Latest NPRS reading: {latest_nprs}

Outcomes:
{odi_text}
"""


async def generate_coach_checkin(member_id: str) -> dict:
    try:
        ctx = await build_checkin_context(member_id)
        user_content = _format_context_for_prompt(ctx)

        response = await asyncio.to_thread(
            _client.messages.create,
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=CHECKIN_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
        )
        text = response.content[0].text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        result = json.loads(match.group(0) if match else text)
        logger.info("checkin generated for member=%s safety_flag=%s", member_id, result.get("safetyFlag"))
        return result

    except Exception as exc:
        logger.warning("checkin generation failed: %s", exc)
        return {
            "greeting": "Great work this week!",
            "observations": "Keep up the consistency -- every session counts.",
            "reflectionQuestions": [
                "How did your body feel during the exercises?",
                "Were there any movements that felt easier than last week?",
                "What is one thing you want to focus on next week?",
            ],
            "guidanceForNextWeek": "Continue with your current program and log your pain daily.",
            "safetyFlag": False,
        }
```

### `backend/services/progression/engine.py`

```python
import logging
from datetime import date, timedelta

from db.supabase import get_supabase

logger = logging.getLogger(__name__)


async def evaluate_progression(
    member_id: str,
    current_week: int,
    program_exercises: list[dict],
) -> list[dict]:
    """
    Evaluate whether each exercise meets progression criteria for advancing to the next week.

    Criteria:
    1. Sessions this week >= 3
    2. Rep hit-rate (reps completed / reps targeted) >= 0.75
    3. Average form score >= 75 (CV exercises only)

    Returns a list of result dicts, one per exercise:
    {
        "exercise_id": str,
        "decision": "advance" | "repeat" | "regress",
        "reason": str,
        "checks_passed": int,
        "checks_possible": int,
    }
    """
    sb = get_supabase()
    week_cutoff = (date.today() - timedelta(days=7)).isoformat()

    sessions_resp = (
        sb.table("sessions")
        .select("id", count="exact")
        .eq("user_id", member_id)
        .eq("week_number", current_week)
        .eq("status", "completed")
        .execute()
    )
    session_count = sessions_resp.count or 0
    sessions_ok = session_count >= 3

    results = []

    for exercise in program_exercises:
        exercise_id = exercise["exercise_id"]
        target_reps = exercise.get("reps", 10) * exercise.get("sets", 2)
        exercise_type = exercise.get("type", "self_paced")

        reps_resp = (
            sb.table("session_reps")
            .select("rep_number, form_score")
            .eq("user_id", member_id)
            .eq("exercise_id", exercise_id)
            .gte("created_at", week_cutoff)
            .execute()
        )
        reps_data = reps_resp.data or []

        reps_done = len(reps_data)
        rep_hit_rate = reps_done / max(target_reps * session_count, 1)
        reps_ok = rep_hit_rate >= 0.75

        form_ok = True
        form_scores = [r["form_score"] for r in reps_data if r.get("form_score") is not None]
        if exercise_type == "cv" and form_scores:
            avg_form = sum(form_scores) / len(form_scores)
            form_ok = avg_form >= 75

        checks_possible = 3 if exercise_type == "cv" else 2
        checks_passed = sum([
            sessions_ok,
            reps_ok,
            form_ok if exercise_type == "cv" else True,
        ])

        if checks_passed >= checks_possible:
            decision = "advance"
            reason = "All progression criteria met"
        elif checks_passed == 0:
            decision = "regress"
            reason = "No sessions completed or very low adherence"
        else:
            decision = "repeat"
            reason = (
                f"Week repeated: sessions={'ok' if sessions_ok else 'low'}, "
                f"reps={'ok' if reps_ok else 'low'}"
                + (f", form={'ok' if form_ok else 'low'}" if exercise_type == "cv" else "")
            )

        results.append(
            {
                "exercise_id": exercise_id,
                "decision": decision,
                "reason": reason,
                "checks_passed": checks_passed,
                "checks_possible": checks_possible,
            }
        )
        logger.info(
            "progression exercise=%s decision=%s checks=%d/%d",
            exercise_id,
            decision,
            checks_passed,
            checks_possible,
        )

    return results
```

---

*Last updated: 2026-05-06. Architecture: FastAPI backend + React/Vite frontend.*
