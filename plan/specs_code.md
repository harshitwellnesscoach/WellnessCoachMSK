# Wellness Coach MSK — Technical Specifications & Code Reference

> Architecture: **Python FastAPI backend + React/Vite frontend**

---

## Table of Contents

0. [Competitive Strategy vs. Sword Health & Hinge Health](#0-competitive-strategy-vs-sword-health--hinge-health)
1. [System Architecture](#1-system-architecture)
2. [Tech Stack](#2-tech-stack)
3. [Full Directory Structure](#3-full-directory-structure)
4. [Auth Flow](#4-auth-flow)
5. [FastAPI Backend (Python)](#5-fastapi-backend-python)
   - 5.1 [main.py](#51-mainpy)
   - 5.2 [db/supabase.py](#52-dbsupabasepy)
   - 5.3 [models/intake.py](#53-modelsintakepy)
   - 5.4 [models/program.py](#54-modelsprogrampy)
   - 5.5 [models/session.py](#55-modelssessionpy)
   - 5.6 [models/outcomes.py](#56-modelsoutcomespy)
   - 5.7 [routers/intake.py](#57-routersintakepy)
   - 5.8 [routers/program.py](#58-routersprogrampy)
   - 5.9 [routers/session.py](#59-routerssessionpy)
   - 5.10 [routers/pain.py](#510-routerspainpy)
   - 5.11 [routers/odi.py](#511-routersodipy)
   - 5.12 [routers/checkin.py](#512-routerscheckinpy)
   - 5.13 [routers/progression.py](#513-routersprogressionpy)
   - 5.14 [services/ai/program_generator.py](#514-servicesaiprogram_generatorpy)
   - 5.15 [services/ai/coach_checkin.py](#515-servicesaicoach_checkinpy)
   - 5.16 [services/safety/red_flags.py](#516-servicessafetyred_flagspy)
   - 5.17 [services/progression/engine.py](#517-servicesprogressionenginepy)
6. [Computer Vision Pipeline (Browser JavaScript)](#6-computer-vision-pipeline-browser-javascript)
   - 6.1 [MediaPipe Setup](#61-mediapipe-setup-cvposetrackertstsss)
   - 6.2 [Geometry Utilities](#62-geometry-utilities-cvgeometryts)
   - 6.3 [Scorer Interface](#63-scorer-interface-cvscorersbasetstsss)
   - 6.4 [Exercise Scorers](#64-exercise-scorers)
7. [Frontend Architecture (React/Vite)](#7-frontend-architecture-reactvite)
   - 7.1 [API Client](#71-api-client-apiclientts)
   - 7.2 [Auth Pages](#72-auth-pagessignintsx-and-signuptsx)
   - 7.3 [Session Flow](#73-session-flow)
   - 7.4 [Component Structure](#74-component-structure)
8. [Database Schema](#8-database-schema)
9. [Security](#9-security)
10. [Performance Targets](#10-performance-targets)

---

## 0. Competitive Strategy vs. Sword Health & Hinge Health

**Sword Health** ($340M+ raised)
- Ships a physical tablet + sensor kit to each member's home
- Every member is assigned a PT-of-record who reviews sessions
- Sold exclusively to Fortune 500 employers through benefits brokers
- Time from employer sign-up to member's first session: **2–4 weeks** (kit shipping + PT intake call)
- Cost per enrolled member: high (hardware + PT labour + logistics)
- AI is layered on top of a fundamentally operations-heavy model

**Hinge Health** ($600M+ raised)
- App + wearable sensors + dedicated PT video calls
- Strong outcomes data (used to win large enterprise contracts)
- Same distribution model as Sword — broker-locked, Fortune 500 focus
- Similar hardware/PT dependencies

Going head-to-head on their turf is unwinnable at our stage. They have:
- Established broker relationships we can't replicate in 90 days
- Clinical outcomes data from tens of thousands of members
- Hardware supply chains and fulfilment infrastructure
- PT networks under contract

**Our strategy: don't compete where they're strong. Compete where their model breaks down.**

---

### Where Their Model Breaks Down (Our Openings)

#### Opening 1 — The Market They Can't Serve Profitably

Sword/Hinge's unit economics only work above a certain employer size (typically 1,000+ employees). Below that, the broker commission, hardware fulfilment, and PT overhead make the per-member cost unworkable.

**Our wedge:** Mid-market employers (50–500 employees), smaller self-insured employers, regional health plans, and geographies where hardware shipping is impractical. This is a large, underserved market they are structurally unable to go after at their cost base.

| Metric | Sword Health | Wellness Coach MSK |
|---|---|---|
| Hardware required | Yes (tablet + sensors) | No — laptop + webcam |
| Time to first session | 2–4 weeks | Minutes |
| PT intake call required | Yes | No |
| Cost per enrolled member | High | Low |
| Min viable employer size | ~1,000 employees | ~50 employees |
| Geographies | Primarily US/EU (shipping) | Anywhere with internet |

#### Opening 2 — Their AI Is Retrofitted, Ours Is Native

Sword and Hinge were built before LLMs and modern browser CV were practical. Their architecture is:
```
Hardware sensors → PT reviews data → AI flags anomalies
```
AI is a post-processing layer on a human-led system.

Our architecture is:
```
Browser webcam → AI designs program → AI coaches in real time → AI adapts weekly
```
The LLM is the system, not a feature added to it. This means:

- **Program generation** happens instantly at intake, not days later after a PT call
- **Adaptation** happens every week automatically, not when a PT has bandwidth
- **Coaching cues** are generated from biomechanical data, not scripted templates
- **Iteration speed** is engineering-limited, not operations-limited — we can ship improvements weekly

#### Opening 3 — Onboarding Friction

Sword's onboarding friction (2–4 weeks, PT call, kit setup) means:
- Members who would benefit often don't start
- Employers with high turnover see poor utilisation
- The employer's HR team manages complaints about delayed starts

Our onboarding is:
```
Sign up → 5-minute intake → program generated by AI → first session starts immediately
```

This isn't just a UX win. It directly improves the metric employers pay for: **utilisation rate**. A program that 60% of enrolled members actually use beats a clinically superior program that 20% use.

---

### Feature-by-Feature Comparison

| Capability | Sword Health | Hinge Health | Wellness Coach MSK |
|---|---|---|---|
| Movement tracking | IMU wrist/ankle sensors | Wearable sensors | Browser webcam (MediaPipe WASM) |
| Form feedback | Sensor-based + PT review | Sensor-based | Real-time CV angle scoring |
| Program design | PT-designed, AI-assisted | PT-designed | LLM-generated from intake |
| Coaching | Assigned human PT | Assigned human PT | AI (Claude) weekly + live cues |
| Pain tracking | App-based NPRS | App-based | NPRS pre/post every session + standalone |
| Function tracking | PROMIS / ODI | PROMIS | Oswestry Disability Index (weekly) |
| Progression | PT-managed | PT-managed | Rules-based engine + LLM adjustment |
| Safety screening | PT intake | PT intake | Automated red-flag + weekly re-screen |
| Hardware | Required (shipped to home) | Required | None — laptop + webcam |
| Time to first session | 2–4 weeks | 1–2 weeks | Minutes |
| Pilot report / outcomes | Yes (mature) | Yes (mature) | Yes (built into MVP) |
| Price point | $$$ (enterprise only) | $$$ (enterprise only) | $$ (mid-market viable) |

---

### Technical Decisions

| Decision | Why |
|---|---|
| MediaPipe WASM in-browser | No hardware cost, no shipping, no setup — directly enables the hardware-free wedge |
| Claude for program generation | Instant personalisation at intake — no PT call needed, no wait time |
| FastAPI + Python | Backend entirely in Python — fast to write, easy to maintain, async-native |
| React + Vite | Minimal JS surface — only the browser CV layer; Vite keeps the dev loop fast |
| ODI + NPRS outcomes pipeline | Produces the pilot report that justifies the enterprise contract renewal |
| Rule-based fallbacks for every LLM call | Demo never breaks — critical for investor demos and employer pilots |

---

## 1. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  BROWSER (React + Vite)                   │
│                                                          │
│  ┌──────────────┐    ┌─────────────────────────────────┐  │
│  │  React Pages  │    │  MediaPipe Pose Landmarker       │  │
│  │  (UI, forms,  │◄──►│  (WASM — runs entirely local,   │  │
│  │   dashboard)  │    │   no video ever leaves device)  │  │
│  └──────┬───────┘    └─────────────────────────────────┘  │
│         │                                                  │
│  ┌──────▼───────┐    ┌─────────────────────────────────┐  │
│  │  api/client  │    │  @supabase/supabase-js           │  │
│  │  fetch wrap  │    │  (auth only — getSession, signIn)│  │
│  └──────┬───────┘    └──────────────┬──────────────────┘  │
└─────────┼────────────────────────────┼────────────────────┘
          │ fetch + Bearer JWT          │ JWT issued here
          │ (all business logic calls)  │
┌─────────▼────────────────────────────┼────────────────────┐
│              FastAPI (Python)         │                    │
│              Railway / Render         │                    │
│                                      │                    │
│  ┌──────────────────────────────┐    │                    │
│  │  Routers                     │    │                    │
│  │  /intake  /program  /session │◄───┘ (JWT verified     │
│  │  /pain    /odi      /checkin │      via Supabase JWT  │
│  │  /progression  /rescreen     │      secret)           │
│  └───────────┬──────────────────┘                        │
│              │                                            │
│  ┌───────────▼──────────────────┐                        │
│  │  Services                    │                        │
│  │  ai/program_generator.py     │◄── anthropic Python SDK│
│  │  ai/coach_checkin.py         │    (Claude Sonnet 4.6) │
│  │  safety/red_flags.py         │                        │
│  │  progression/engine.py       │                        │
│  └───────────┬──────────────────┘                        │
└──────────────┼────────────────────────────────────────────┘
               │ supabase-py (service role)
┌──────────────▼────────────────────────────────────────────┐
│  Supabase                                                  │
│  Postgres + Auth + Row-Level Security                      │
└────────────────────────────────────────────────────────────┘
```

### Auth Data Flow

```
1. User signs in via @supabase/supabase-js in browser
2. Supabase returns a JWT (access_token)
3. Frontend stores JWT (managed by supabase-js)
4. Every fetch to FastAPI includes:  Authorization: Bearer <token>
5. FastAPI dependency get_current_user() verifies JWT using Supabase JWT secret
6. Route handler receives verified user_id — never trusts client-passed IDs
```

---

## 2. Tech Stack

| Technology | Role | Why chosen |
|---|---|---|
| **FastAPI** | Async web framework, route definitions | Python-native, Pydantic built-in, auto OpenAPI docs at /docs |
| **anthropic** | Python SDK for Claude API | Program generation + coach check-ins |
| **supabase-py** | Supabase client for server-side DB + auth admin | Service-role access for RLS bypass where needed |
| **python-jose** | JWT verification in FastAPI dependency | Lightweight, handles Supabase HS256 JWTs |
| **uvicorn** | ASGI server | Standard for FastAPI in production |
| **pydantic** | Data validation, request/response models | Built into FastAPI; type safety throughout |
| **React + Vite** | Browser UI | Fast dev loop; minimal config; user is Python-primary so keep JS surface small |
| **@mediapipe/tasks-vision** | In-browser pose tracking (WASM) | No server calls for CV; no hardware required |
| **@supabase/supabase-js** | Auth only (client-side) | Supabase handles auth entirely; no custom auth code needed |
| **Tailwind CSS + shadcn/ui** | Styling and UI components | Fast to compose; good defaults; copy-paste component model |

---

## 3. Full Directory Structure

```
LowerBackPainAI/
├── backend/
│   ├── main.py                         # FastAPI app + CORS + router registration
│   ├── requirements.txt
│   ├── .env                            # never commit
│   │
│   ├── routers/
│   │   ├── auth.py                     # (reserved — Supabase handles auth)
│   │   ├── intake.py                   # POST /intake/red-flag, POST /intake/profile
│   │   ├── program.py                  # POST /program/generate, GET /program/current
│   │   ├── session.py                  # POST /session/start, POST /session/complete
│   │   ├── pain.py                     # POST /pain/log, GET /pain/trend
│   │   ├── odi.py                      # POST /odi/submit, GET /odi/latest
│   │   ├── checkin.py                  # POST /checkin/generate, POST /checkin/respond
│   │   ├── progression.py              # POST /progression/advance
│   │   └── rescreen.py                 # POST /rescreen/submit, GET /rescreen/needed
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── program_generator.py    # Claude program generation + fallback
│   │   │   └── coach_checkin.py        # Weekly check-in generation
│   │   ├── safety/
│   │   │   ├── red_flags.py            # Red-flag questions + evaluation logic
│   │   │   └── rescreen_trigger.py     # Trigger conditions
│   │   ├── progression/
│   │   │   └── engine.py               # Week evaluation logic
│   │   └── outcomes/
│   │       ├── odi_scorer.py           # ODI 0-100 scoring + band
│   │       └── pain_trend.py           # 14-day trend computation
│   │
│   ├── models/
│   │   ├── intake.py                   # IntakeData, RedFlagAnswers, IntakeSubmission
│   │   ├── program.py                  # ProgramExercise, GeneratedProgram
│   │   ├── session.py                  # SessionCreate, RepData, CompleteSessionPayload
│   │   └── outcomes.py                 # PainLog, ODISubmission, CoachCheckin
│   │
│   ├── db/
│   │   └── supabase.py                 # supabase-py client setup (service role)
│   │
│   └── data/
│       └── exercise_library.json       # Static exercise definitions
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env                            # VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       │
│       ├── api/
│       │   └── client.ts               # fetch wrapper: adds Bearer token, throws on non-2xx
│       │
│       ├── pages/
│       │   ├── SignIn.tsx
│       │   ├── SignUp.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Onboarding/
│       │   │   ├── RedFlag.tsx
│       │   │   └── Intake.tsx
│       │   ├── Session.tsx
│       │   ├── Checkin.tsx
│       │   ├── ODI.tsx
│       │   └── Rescreen.tsx
│       │
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── PainTrendChart.tsx
│       │   │   ├── ProgressBlock.tsx
│       │   │   └── WeeklyPrompts.tsx
│       │   ├── session/
│       │   │   ├── SessionRunner.tsx
│       │   │   ├── CameraView.tsx
│       │   │   ├── SkeletonOverlay.tsx
│       │   │   └── ExerciseHUD.tsx
│       │   └── forms/
│       │       ├── RedFlagForm.tsx
│       │       ├── IntakeForm.tsx
│       │       ├── ODIForm.tsx
│       │       └── RescreenForm.tsx
│       │
│       └── cv/
│           ├── poseTracker.ts          # MediaPipe init + detectPose()
│           ├── geometry.ts             # angleDeg, midpoint, spineAngle, hipSymmetryDelta
│           └── scorers/
│               ├── base.ts             # ExerciseScorer interface
│               ├── pelvicTilt.ts
│               ├── gluteBridge.ts
│               ├── catCow.ts
│               ├── birdDog.ts
│               └── deadBug.ts
│
└── supabase/
    └── migrations/
        ├── 0001_initial.sql
        └── 0002_outcomes.sql
```

---

## 4. Auth Flow

Supabase handles all authentication. The frontend uses `@supabase/supabase-js` to sign up and sign in — no backend involvement. Once the user has a session, Supabase provides a JWT. The frontend includes that JWT as a Bearer token on every request to FastAPI. FastAPI verifies the JWT using the Supabase JWT secret (available in your Supabase project settings under `JWT_SECRET`).

**Why this split:** Auth state management (sessions, refresh tokens, email confirmation) is Supabase's problem, not ours. FastAPI only needs to verify a token, not issue one.

### FastAPI `get_current_user` dependency

Add this to any route to require authentication. It returns the verified Supabase `user_id` (UUID string).

```python
# backend/routers/_deps.py

import os
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

bearer_scheme = HTTPBearer()

SUPABASE_JWT_SECRET = os.environ["SUPABASE_JWT_SECRET"]


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


CurrentUser = Annotated[str, Depends(get_current_user)]
```

Usage in any router:

```python
from routers._deps import CurrentUser

@router.get("/program/current")
async def get_current_program(user_id: CurrentUser):
    # user_id is the verified Supabase user UUID
    ...
```

---

## 5. FastAPI Backend (Python)

### 5.1 main.py

```python
# backend/main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import intake, program, session, pain, odi, checkin, progression, rescreen

app = FastAPI(title="Wellness Coach MSK API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intake.router, prefix="/intake", tags=["intake"])
app.include_router(program.router, prefix="/program", tags=["program"])
app.include_router(session.router, prefix="/session", tags=["session"])
app.include_router(pain.router, prefix="/pain", tags=["pain"])
app.include_router(odi.router, prefix="/odi", tags=["odi"])
app.include_router(checkin.router, prefix="/checkin", tags=["checkin"])
app.include_router(progression.router, prefix="/progression", tags=["progression"])
app.include_router(rescreen.router, prefix="/rescreen", tags=["rescreen"])


@app.get("/health")
async def health():
    return {"status": "ok"}
```

### 5.2 db/supabase.py

```python
# backend/db/supabase.py

import os
from supabase import create_client, Client

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client
```

The service role key bypasses RLS — use only in backend. Never expose it to the frontend.

### 5.3 models/intake.py

```python
# backend/models/intake.py

from pydantic import BaseModel, Field


class RedFlagAnswers(BaseModel):
    cauda_equina: bool
    progressive_weakness: bool
    unexplained_weight_loss: bool
    fever: bool
    cancer_history: bool
    trauma: bool


class IntakeData(BaseModel):
    pain_location: str
    nprs_score: int = Field(ge=0, le=10)
    duration_months: int = Field(ge=0)
    directional_preference: str  # 'flexion' | 'extension' | 'neutral' | 'unknown'
    aggravating_activities: list[str]
    relieving_activities: list[str]
    previous_treatment: str


class IntakeSubmission(BaseModel):
    red_flags: RedFlagAnswers
    intake: IntakeData
```

### 5.4 models/program.py

```python
# backend/models/program.py

from pydantic import BaseModel


class ProgramExercise(BaseModel):
    exercise_id: str
    sets: int
    reps: int
    hold_seconds: int | None
    rationale: str
    progression_id: str | None
    has_live_scoring: bool = True


class GeneratedProgram(BaseModel):
    week_number: int
    exercises: list[ProgramExercise]
    program_summary: str
    clinical_rationale: str
```

### 5.5 models/session.py

```python
# backend/models/session.py

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    week_number: int
    pre_session_nprs: int = Field(ge=0, le=10)


class RepData(BaseModel):
    exercise_id: str
    rep_number: int
    form_score: int | None = Field(default=None, ge=0, le=100)
    score_breakdown: dict[str, float] | None = None
    cues_triggered: list[str] = []


class SessionExerciseSummary(BaseModel):
    exercise_id: str
    reps_completed: int
    reps_target: int
    rep_scores: list[int]


class CompleteSessionPayload(BaseModel):
    session_id: str
    post_session_nprs: int = Field(ge=0, le=10)
    perceived_effort: int | None = Field(default=None, ge=1, le=10)
    member_notes: str | None = None
    exercises: list[SessionExerciseSummary]
    reps: list[RepData]
```

### 5.6 models/outcomes.py

```python
# backend/models/outcomes.py

from pydantic import BaseModel, Field


class PainLog(BaseModel):
    nprs_score: int = Field(ge=0, le=10)
    note: str | None = None
    source: str = "standalone"  # 'session_pre' | 'session_post' | 'standalone'


class ODISubmission(BaseModel):
    week_number: int
    # section_id → selected value 0-5; 10 sections required
    responses: dict[str, int]


class CoachCheckin(BaseModel):
    week_number: int


class CheckinResponse(BaseModel):
    checkin_id: str
    responses: dict[str, str]  # question_index → member's answer
```

### 5.7 routers/intake.py

```python
# backend/routers/intake.py

from fastapi import APIRouter
from db.supabase import get_supabase
from models.intake import RedFlagAnswers, IntakeData
from routers._deps import CurrentUser
from services.safety.red_flags import evaluate_red_flags
from services.ai.program_generator import generate_program

router = APIRouter()


@router.post("/red-flag")
async def submit_red_flag(answers: RedFlagAnswers, user_id: CurrentUser):
    result = evaluate_red_flags(answers.model_dump())
    db = get_supabase()
    db.table("member_profiles").update({
        "red_flag_screened_at": "now()",
        "red_flag_result": result["urgency_level"],
    }).eq("id", user_id).execute()
    return result


@router.post("/profile")
async def submit_intake(intake: IntakeData, user_id: CurrentUser):
    db = get_supabase()
    db.table("member_profiles").update({
        "pain_location": intake.pain_location,
        "intake_nprs": intake.nprs_score,
        "pain_duration_months": intake.duration_months,
        "directional_preference": intake.directional_preference,
        "aggravating_activities": intake.aggravating_activities,
        "relieving_activities": intake.relieving_activities,
        "previous_treatment": intake.previous_treatment,
    }).eq("id", user_id).execute()

    program = await generate_program(intake)
    db.table("program_weeks").insert({
        "member_id": user_id,
        "week_number": 1,
        "exercises": [e.model_dump() for e in program.exercises],
        "program_summary": program.program_summary,
        "clinical_rationale": program.clinical_rationale,
    }).execute()

    return {"status": "ok", "program_summary": program.program_summary}
```

### 5.8 routers/program.py

```python
# backend/routers/program.py

from fastapi import APIRouter, HTTPException
from db.supabase import get_supabase
from models.program import GeneratedProgram
from models.intake import IntakeData
from routers._deps import CurrentUser
from services.ai.program_generator import generate_program

router = APIRouter()


@router.post("/generate", response_model=GeneratedProgram)
async def trigger_program_generation(intake: IntakeData, user_id: CurrentUser):
    program = await generate_program(intake)
    db = get_supabase()

    profile = db.table("member_profiles").select("current_week").eq("id", user_id).single().execute()
    current_week = profile.data["current_week"]

    db.table("program_weeks").upsert({
        "member_id": user_id,
        "week_number": current_week,
        "exercises": [e.model_dump() for e in program.exercises],
        "program_summary": program.program_summary,
        "clinical_rationale": program.clinical_rationale,
    }).execute()

    return program


@router.get("/current")
async def get_current_program(user_id: CurrentUser):
    db = get_supabase()
    profile = db.table("member_profiles").select("current_week").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    current_week = profile.data["current_week"]
    result = (
        db.table("program_weeks")
        .select("*")
        .eq("member_id", user_id)
        .eq("week_number", current_week)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No program for current week")
    return result.data
```

### 5.9 routers/session.py

```python
# backend/routers/session.py

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from db.supabase import get_supabase
from models.session import SessionCreate, CompleteSessionPayload
from routers._deps import CurrentUser

router = APIRouter()


@router.post("/start")
async def start_session(payload: SessionCreate, user_id: CurrentUser):
    db = get_supabase()
    session_id = str(uuid.uuid4())
    db.table("sessions").insert({
        "id": session_id,
        "member_id": user_id,
        "week_number": payload.week_number,
        "pre_session_nprs": payload.pre_session_nprs,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "exercises": [],
    }).execute()

    db.table("pain_logs").insert({
        "member_id": user_id,
        "nprs_score": payload.pre_session_nprs,
        "source": "session_pre",
    }).execute()

    return {"session_id": session_id}


@router.post("/complete")
async def complete_session(payload: CompleteSessionPayload, user_id: CurrentUser):
    db = get_supabase()

    session_check = (
        db.table("sessions")
        .select("id")
        .eq("id", payload.session_id)
        .eq("member_id", user_id)
        .single()
        .execute()
    )
    if not session_check.data:
        raise HTTPException(status_code=403, detail="Session not found or not yours")

    db.table("sessions").update({
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "post_session_nprs": payload.post_session_nprs,
        "perceived_effort": payload.perceived_effort,
        "member_notes": payload.member_notes,
        "exercises": [e.model_dump() for e in payload.exercises],
    }).eq("id", payload.session_id).execute()

    if payload.reps:
        db.table("session_reps").insert([
            {
                "session_id": payload.session_id,
                "exercise_id": r.exercise_id,
                "rep_number": r.rep_number,
                "form_score": r.form_score,
                "score_breakdown": r.score_breakdown,
                "cues_triggered": r.cues_triggered,
            }
            for r in payload.reps
        ]).execute()

    db.table("pain_logs").insert({
        "member_id": user_id,
        "nprs_score": payload.post_session_nprs,
        "source": "session_post",
    }).execute()

    return {"status": "ok"}
```

### 5.10 routers/pain.py

```python
# backend/routers/pain.py

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query
from db.supabase import get_supabase
from models.outcomes import PainLog
from routers._deps import CurrentUser

router = APIRouter()


@router.post("/log")
async def log_pain(payload: PainLog, user_id: CurrentUser):
    db = get_supabase()
    db.table("pain_logs").insert({
        "member_id": user_id,
        "nprs_score": payload.nprs_score,
        "note": payload.note,
        "source": payload.source,
        "logged_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    return {"status": "ok"}


@router.get("/trend")
async def get_pain_trend(user_id: CurrentUser, days: int = Query(default=14, ge=1, le=90)):
    db = get_supabase()
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    result = (
        db.table("pain_logs")
        .select("nprs_score, logged_at")
        .eq("member_id", user_id)
        .gte("logged_at", since)
        .order("logged_at")
        .execute()
    )
    logs = result.data or []
    scores = [r["nprs_score"] for r in logs]
    delta = (scores[-1] - scores[0]) if len(scores) >= 2 else 0
    return {"logs": logs, "delta": delta}
```

### 5.11 routers/odi.py

```python
# backend/routers/odi.py

from fastapi import APIRouter
from db.supabase import get_supabase
from models.outcomes import ODISubmission
from routers._deps import CurrentUser
from services.outcomes.odi_scorer import score_odi

router = APIRouter()


@router.post("/submit")
async def submit_odi(payload: ODISubmission, user_id: CurrentUser):
    db = get_supabase()
    total_score, disability_band = score_odi(payload.responses)

    db.table("odi_submissions").insert({
        "member_id": user_id,
        "week_number": payload.week_number,
        "responses": payload.responses,
        "total_score": total_score,
        "disability_band": disability_band,
    }).execute()

    return {"total_score": total_score, "disability_band": disability_band}


@router.get("/latest")
async def get_latest_odi(user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("odi_submissions")
        .select("*")
        .eq("member_id", user_id)
        .order("submitted_at", desc=True)
        .limit(2)
        .execute()
    )
    submissions = result.data or []
    if not submissions:
        return {"latest": None, "delta": None}
    latest = submissions[0]
    delta = (
        latest["total_score"] - submissions[1]["total_score"]
        if len(submissions) == 2
        else None
    )
    return {"latest": latest, "delta": delta}
```

### 5.12 routers/checkin.py

```python
# backend/routers/checkin.py

import uuid
from fastapi import APIRouter
from db.supabase import get_supabase
from models.outcomes import CoachCheckin, CheckinResponse
from routers._deps import CurrentUser
from services.ai.coach_checkin import build_checkin_context, generate_coach_checkin

router = APIRouter()


@router.post("/generate")
async def generate_checkin(payload: CoachCheckin, user_id: CurrentUser):
    db = get_supabase()
    context = await build_checkin_context(user_id, db)
    checkin_message = await generate_coach_checkin(context)

    checkin_id = str(uuid.uuid4())
    db.table("coach_checkins").insert({
        "id": checkin_id,
        "member_id": user_id,
        "week_number": payload.week_number,
        "coach_message": checkin_message,
        "context_snapshot": context,
    }).execute()

    return {"checkin_id": checkin_id, "message": checkin_message}


@router.post("/respond")
async def submit_checkin_response(payload: CheckinResponse, user_id: CurrentUser):
    db = get_supabase()
    db.table("coach_checkins").update({
        "member_responses": payload.responses,
        "completed_at": "now()",
    }).eq("id", payload.checkin_id).eq("member_id", user_id).execute()
    return {"status": "ok"}
```

### 5.13 routers/progression.py

```python
# backend/routers/progression.py

from fastapi import APIRouter, HTTPException
from db.supabase import get_supabase
from routers._deps import CurrentUser
from services.progression.engine import evaluate_progression
from services.ai.program_generator import generate_program
from models.intake import IntakeData

router = APIRouter()


@router.post("/advance")
async def advance_week(user_id: CurrentUser):
    db = get_supabase()

    profile = db.table("member_profiles").select("*").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    current_week = profile.data["current_week"]

    program_row = (
        db.table("program_weeks")
        .select("exercises")
        .eq("member_id", user_id)
        .eq("week_number", current_week)
        .single()
        .execute()
    )
    if not program_row.data:
        raise HTTPException(status_code=404, detail="No program for current week")

    sessions_row = (
        db.table("sessions")
        .select("*")
        .eq("member_id", user_id)
        .eq("week_number", current_week)
        .not_.is_("completed_at", "null")
        .execute()
    )

    decisions = evaluate_progression(
        member_id=user_id,
        current_week=current_week,
        exercises=program_row.data["exercises"],
        sessions=sessions_row.data or [],
    )

    intake = IntakeData(
        pain_location=profile.data.get("pain_location", "lower_back_center"),
        nprs_score=profile.data.get("intake_nprs", 5),
        duration_months=profile.data.get("pain_duration_months", 3),
        directional_preference=profile.data.get("directional_preference", "neutral"),
        aggravating_activities=profile.data.get("aggravating_activities", []),
        relieving_activities=profile.data.get("relieving_activities", []),
        previous_treatment=profile.data.get("previous_treatment", ""),
    )
    new_program = await generate_program(intake, week_number=current_week + 1, progression_decisions=decisions)

    db.table("program_weeks").insert({
        "member_id": user_id,
        "week_number": current_week + 1,
        "exercises": [e.model_dump() for e in new_program.exercises],
        "program_summary": new_program.program_summary,
        "clinical_rationale": new_program.clinical_rationale,
        "progression_decisions": [d.model_dump() for d in decisions],
    }).execute()

    db.table("member_profiles").update({"current_week": current_week + 1}).eq("id", user_id).execute()

    return {
        "new_week": current_week + 1,
        "decisions": [d.model_dump() for d in decisions],
        "program_summary": new_program.program_summary,
    }
```

---

### 5.14 services/ai/program_generator.py

```python
# backend/services/ai/program_generator.py

import json
import os
from pathlib import Path
import anthropic
from models.intake import IntakeData
from models.program import GeneratedProgram, ProgramExercise

_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

EXERCISE_LIBRARY: list[dict] = json.loads(
    (Path(__file__).parent.parent.parent / "data" / "exercise_library.json").read_text()
)

SYSTEM_PROMPT = """\
You are a clinical exercise specialist designing a personalized lower back rehabilitation program.

Rules:
- Select 5-7 exercises from the provided library only. Do not invent exercises.
- Match exercises to the member's directional preference:
  flexion-biased pain → avoid exercises that load flexion
  extension-biased pain → avoid exercises that load extension
- For NPRS >= 7: prioritize gentle mobility; avoid high-load stabilization. Keep sets low (2).
- For NPRS <= 3: prioritize progressive loading and functional movement.
- Every program must include at least one core stabilization exercise and one mobility exercise.
- Return a valid JSON object matching this exact schema:
  {
    "week_number": int,
    "exercises": [
      {
        "exercise_id": str,
        "sets": int,
        "reps": int,
        "hold_seconds": int | null,
        "rationale": str,
        "progression_id": str | null,
        "has_live_scoring": bool
      }
    ],
    "program_summary": str,
    "clinical_rationale": str
  }
- program_summary is member-facing: warm, encouraging, jargon-free, max 3 sentences.
- clinical_rationale is internal: technical, references evidence base.
- Return only the JSON — no markdown fences, no extra text.\
"""


def _build_user_message(
    intake: IntakeData,
    week_number: int,
    progression_decisions: list | None,
) -> str:
    lines = [
        "Member intake:",
        f"- Pain location: {intake.pain_location}",
        f"- Current pain (NPRS): {intake.nprs_score}/10",
        f"- Duration: {intake.duration_months} months",
        f"- Directional preference: {intake.directional_preference}",
        f"- Aggravating: {', '.join(intake.aggravating_activities) or 'none reported'}",
        f"- Relieving: {', '.join(intake.relieving_activities) or 'none reported'}",
        f"- Previous treatment: {intake.previous_treatment or 'none'}",
        f"\nGenerate a Week {week_number} program.",
    ]
    if progression_decisions:
        lines.append("\nProgression context from last week:")
        for d in progression_decisions:
            lines.append(f"  - {d['exercise_id']}: {d['decision']} — {d['reason']}")

    lines.append(f"\nAvailable exercise library:\n{json.dumps(EXERCISE_LIBRARY, indent=2)}")
    return "\n".join(lines)


async def generate_program(
    intake: IntakeData,
    week_number: int = 1,
    progression_decisions: list | None = None,
) -> GeneratedProgram:
    user_message = _build_user_message(intake, week_number, progression_decisions)
    try:
        response = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        text = response.content[0].text if response.content else ""
        data = json.loads(text)
        data["week_number"] = week_number
        return GeneratedProgram(**data)
    except Exception:
        return _build_fallback_program(intake, week_number)


def _build_fallback_program(intake: IntakeData, week_number: int) -> GeneratedProgram:
    base_reps = 5 if intake.nprs_score >= 7 else (8 if intake.nprs_score >= 4 else 10)
    base_sets = 2 if intake.nprs_score >= 7 else 3

    exercises = [
        ProgramExercise(
            exercise_id="pelvic_tilt_supine",
            sets=base_sets,
            reps=base_reps,
            hold_seconds=5,
            rationale="Foundational lumbar stabilization exercise — safe for all pain levels.",
            progression_id="pelvic_tilt_seated",
            has_live_scoring=True,
        ),
        ProgramExercise(
            exercise_id="cat_cow",
            sets=2,
            reps=base_reps,
            hold_seconds=None,
            rationale="Gentle lumbar mobility to restore range of motion.",
            progression_id="thoracic_rotation_quadruped",
            has_live_scoring=True,
        ),
        ProgramExercise(
            exercise_id="glute_bridge_bilateral",
            sets=base_sets,
            reps=base_reps,
            hold_seconds=2,
            rationale="Hip extension strength — core support for lumbar spine.",
            progression_id="glute_bridge_single_leg",
            has_live_scoring=True,
        ),
        ProgramExercise(
            exercise_id="bird_dog",
            sets=base_sets,
            reps=max(6, base_reps - 2),
            hold_seconds=3,
            rationale="Contralateral stabilization — trains neutral spine control.",
            progression_id="bird_dog_with_band",
            has_live_scoring=True,
        ),
        ProgramExercise(
            exercise_id="dead_bug",
            sets=base_sets,
            reps=max(6, base_reps - 2),
            hold_seconds=None,
            rationale="Anti-extension core stability — protects lumbar during limb movement.",
            progression_id="dead_bug_extended",
            has_live_scoring=True,
        ),
    ]

    return GeneratedProgram(
        week_number=week_number,
        exercises=exercises,
        program_summary=(
            "We've put together a gentle, evidence-based program to help reduce your back pain "
            "and build the strength your spine needs. Start slowly — the goal this week is to "
            "build the habit and move with confidence."
        ),
        clinical_rationale=(
            "Fallback program: conservative motor control and mobility protocol. "
            "Exercises selected for low load, high neural recruitment. "
            "Appropriate for initial presentation across all NPRS levels."
        ),
    )
```

### 5.15 services/ai/coach_checkin.py

```python
# backend/services/ai/coach_checkin.py

import os
import json
from datetime import datetime, timezone, timedelta
import anthropic
from supabase import Client

_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

COACH_SYSTEM_PROMPT = """\
You are a warm, evidence-based digital health coach specialising in chronic low back pain recovery.

Return a JSON object with this exact structure:
{
  "greeting": "personal, references their specific data",
  "observations": "2-3 sentences citing specific numbers from their week",
  "reflection_questions": ["question 1", "question 2", "question 3"],
  "guidance_for_next_week": "1-2 sentences on what to focus on",
  "safety_flag": null
}

Rules:
- Never diagnose or give medical advice.
- If pain trend delta > +2 or ODI is worsening: set safety_flag to a message recommending they contact a healthcare provider.
- Reflection questions should connect behaviour (sessions done, effort) to outcome (pain change, function).
- Keep total response under 300 words.
- Tone: peer coach, not clinical authority.
- Return only the JSON — no markdown fences.\
"""


async def build_checkin_context(member_id: str, db: Client) -> dict:
    since = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()

    pain_rows = (
        db.table("pain_logs")
        .select("nprs_score, logged_at")
        .eq("member_id", member_id)
        .gte("logged_at", since)
        .order("logged_at")
        .execute()
    ).data or []
    scores = [r["nprs_score"] for r in pain_rows]
    pain_delta = (scores[-1] - scores[0]) if len(scores) >= 2 else 0
    trend = "improving" if pain_delta < -1 else ("worsening" if pain_delta > 1 else "stable")

    profile = db.table("member_profiles").select("current_week").eq("id", member_id).single().execute()
    current_week = profile.data["current_week"] if profile.data else 1

    sessions = (
        db.table("sessions")
        .select("exercises, post_session_nprs, member_notes")
        .eq("member_id", member_id)
        .eq("week_number", current_week)
        .not_.is_("completed_at", "null")
        .execute()
    ).data or []

    form_scores: list[int] = []
    for s in sessions:
        for ex in (s.get("exercises") or []):
            form_scores.extend(ex.get("rep_scores", []))
    avg_form = round(sum(form_scores) / len(form_scores)) if form_scores else None

    odi_rows = (
        db.table("odi_submissions")
        .select("total_score, disability_band, week_number")
        .eq("member_id", member_id)
        .order("submitted_at", desc=True)
        .limit(2)
        .execute()
    ).data or []
    odi_latest = odi_rows[0] if odi_rows else None
    odi_delta = (
        odi_rows[0]["total_score"] - odi_rows[1]["total_score"] if len(odi_rows) == 2 else None
    )

    return {
        "member_id": member_id,
        "week_number": current_week,
        "pain_trend": {
            "values": [{"date": r["logged_at"], "score": r["nprs_score"]} for r in pain_rows],
            "delta": pain_delta,
            "trend": trend,
        },
        "sessions": {
            "count_this_week": len(sessions),
            "target_this_week": 3,
            "avg_form_score": avg_form,
        },
        "odi": {
            "latest_score": odi_latest["total_score"] if odi_latest else None,
            "disability_band": odi_latest["disability_band"] if odi_latest else None,
            "delta": odi_delta,
        },
    }


async def generate_coach_checkin(context: dict) -> dict:
    try:
        response = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=COACH_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Member data:\n{json.dumps(context, indent=2)}"}],
        )
        text = response.content[0].text if response.content else ""
        return json.loads(text)
    except Exception:
        sessions_done = context.get("sessions", {}).get("count_this_week", 0)
        return {
            "greeting": "Great work this week.",
            "observations": (
                f"You completed {sessions_done} sessions this week. "
                "Consistency is the most important factor in recovery at this stage."
            ),
            "reflection_questions": [
                "What time of day did you feel most motivated to do your exercises?",
                "Did any exercise feel noticeably easier than last week?",
                "What is one thing that might help you stay consistent next week?",
            ],
            "guidance_for_next_week": "Keep showing up — small daily efforts compound into lasting change.",
            "safety_flag": None,
        }
```

### 5.16 services/safety/red_flags.py

```python
# backend/services/safety/red_flags.py

from typing import Literal

RedFlagUrgency = Literal["safe", "warn", "block"]

RED_FLAG_QUESTIONS: list[dict] = [
    {
        "id": "cauda_equina",
        "text": "Have you recently noticed loss of bladder or bowel control, or numbness in your inner thighs or groin?",
        "urgency": "block",
    },
    {
        "id": "progressive_weakness",
        "text": "Have you noticed progressive weakness in your legs (e.g., difficulty walking, foot drop)?",
        "urgency": "block",
    },
    {
        "id": "unexplained_weight_loss",
        "text": "Have you experienced unexplained weight loss in the last 3 months?",
        "urgency": "block",
    },
    {
        "id": "fever",
        "text": "Do you have persistent fever or night sweats along with your back pain?",
        "urgency": "block",
    },
    {
        "id": "cancer_history",
        "text": "Do you have a history of cancer?",
        "urgency": "block",
    },
    {
        "id": "trauma",
        "text": "Did your back pain start after a significant fall, accident, or injury?",
        "urgency": "warn",
    },
]


def evaluate_red_flags(answers: dict[str, bool]) -> dict:
    blocking = [
        q for q in RED_FLAG_QUESTIONS
        if q["urgency"] == "block" and answers.get(q["id"]) is True
    ]
    warning = [
        q for q in RED_FLAG_QUESTIONS
        if q["urgency"] == "warn" and answers.get(q["id"]) is True
    ]

    if blocking:
        return {
            "should_block": True,
            "urgency_level": "block",
            "message": (
                "Based on your answers, we recommend seeking immediate medical attention "
                "before continuing this program. Please contact your GP or go to your "
                "nearest emergency department."
            ),
            "triggered_flags": [q["id"] for q in blocking],
        }

    if warning:
        return {
            "should_block": False,
            "urgency_level": "warn",
            "message": (
                "One of your answers suggests it would be worth checking with your GP or "
                "physiotherapist before starting. You can continue, but please get medical "
                "clearance if you haven't already."
            ),
            "triggered_flags": [q["id"] for q in warning],
        }

    return {
        "should_block": False,
        "urgency_level": "safe",
        "message": "No red flags detected. You're good to start your program.",
        "triggered_flags": [],
    }
```

### 5.17 services/progression/engine.py

```python
# backend/services/progression/engine.py

from pydantic import BaseModel
from typing import Literal


class ProgressionDecision(BaseModel):
    exercise_id: str
    decision: Literal["advance", "hold"]
    reason: str
    next_exercise_id: str | None


MIN_SESSIONS = 3
MIN_REP_HIT_RATE = 0.75
MIN_FORM_SCORE = 75


def evaluate_progression(
    member_id: str,
    current_week: int,
    exercises: list[dict],
    sessions: list[dict],
) -> list[ProgressionDecision]:
    decisions: list[ProgressionDecision] = []

    for exercise in exercises:
        ex_id = exercise["exercise_id"]

        relevant = [
            s for s in sessions
            if any(e["exercise_id"] == ex_id for e in (s.get("exercises") or []))
        ]

        # Check 1: session count
        if len(relevant) < MIN_SESSIONS:
            decisions.append(ProgressionDecision(
                exercise_id=ex_id,
                decision="hold",
                reason=f"Only {len(relevant)} of {MIN_SESSIONS} sessions completed this week.",
                next_exercise_id=None,
            ))
            continue

        # Check 2: rep hit rate
        hit_rates: list[float] = []
        for s in relevant:
            ex_data = next((e for e in (s.get("exercises") or []) if e["exercise_id"] == ex_id), None)
            if ex_data and ex_data.get("reps_target", 0) > 0:
                rate = ex_data["reps_completed"] / ex_data["reps_target"]
                hit_rates.append(rate)

        avg_hit_rate = sum(hit_rates) / len(hit_rates) if hit_rates else 0.0

        if avg_hit_rate < MIN_REP_HIT_RATE:
            decisions.append(ProgressionDecision(
                exercise_id=ex_id,
                decision="hold",
                reason=(
                    f"Rep completion rate was {round(avg_hit_rate * 100)}% — "
                    f"target is {round(MIN_REP_HIT_RATE * 100)}%."
                ),
                next_exercise_id=None,
            ))
            continue

        # Check 3: form score (CV-scored exercises only)
        if exercise.get("has_live_scoring"):
            all_scores: list[int] = []
            for s in relevant:
                ex_data = next((e for e in (s.get("exercises") or []) if e["exercise_id"] == ex_id), None)
                if ex_data:
                    all_scores.extend(ex_data.get("rep_scores", []))

            if all_scores:
                avg_form = sum(all_scores) / len(all_scores)
                if avg_form < MIN_FORM_SCORE:
                    decisions.append(ProgressionDecision(
                        exercise_id=ex_id,
                        decision="hold",
                        reason=(
                            f"Average form score was {round(avg_form)}/100 — "
                            "keep practising before advancing."
                        ),
                        next_exercise_id=None,
                    ))
                    continue

        decisions.append(ProgressionDecision(
            exercise_id=ex_id,
            decision="advance",
            reason="All targets met — ready for the next progression.",
            next_exercise_id=exercise.get("progression_id"),
        ))

    return decisions
```

---

## 6. Computer Vision Pipeline (Browser JavaScript)

**Important context for the Python-first developer:** This is the only part of the product written in TypeScript. It runs entirely inside the browser — no video frame ever leaves the device. The user's webcam feed is processed locally using MediaPipe's WASM build, which compiles the pose estimation model to run in the browser without any server calls. Think of it as a Python library that runs in the browser tab instead of a Python interpreter.

FastAPI knows nothing about the CV pipeline. The browser runs it, scores the reps, and then sends the final rep scores to FastAPI via the `POST /session/complete` endpoint at the end of the session.

### 6.1 MediaPipe Setup (cv/poseTracker.ts)

```typescript
// frontend/src/cv/poseTracker.ts

import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export type PoseFrame = PoseLandmark[];

let _landmarker: PoseLandmarker | null = null;

export async function initPoseLandmarker(): Promise<void> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  _landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/models/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

export function detectPose(
  videoElement: HTMLVideoElement,
  timestampMs: number
): PoseFrame | null {
  if (!_landmarker) return null;
  const result: PoseLandmarkerResult = _landmarker.detectForVideo(
    videoElement,
    timestampMs
  );
  if (!result.landmarks || result.landmarks.length === 0) return null;
  return result.landmarks[0] as PoseFrame;
}
```

### 6.2 Geometry Utilities (cv/geometry.ts)

```typescript
// frontend/src/cv/geometry.ts

import type { PoseLandmark, PoseFrame } from "./poseTracker";

export function angleDeg(
  a: PoseLandmark,
  vertex: PoseLandmark,
  b: PoseLandmark
): number {
  const ax = a.x - vertex.x;
  const ay = a.y - vertex.y;
  const bx = b.x - vertex.x;
  const by = b.y - vertex.y;
  const dot = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);
  if (magA === 0 || magB === 0) return 0;
  return (
    Math.acos(Math.min(Math.max(dot / (magA * magB), -1), 1)) * (180 / Math.PI)
  );
}

export function midpoint(a: PoseLandmark, b: PoseLandmark): PoseLandmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  };
}

export function spineAngle(landmarks: PoseFrame): number {
  const hipMid = midpoint(landmarks[23], landmarks[24]);
  const shoulderMid = midpoint(landmarks[11], landmarks[12]);
  const dx = shoulderMid.x - hipMid.x;
  const dy = shoulderMid.y - hipMid.y;
  return Math.atan2(dx, -dy) * (180 / Math.PI);
}

export function hipSymmetryDelta(landmarks: PoseFrame): number {
  return Math.abs(landmarks[23].y - landmarks[24].y);
}
```

### 6.3 Scorer Interface (cv/scorers/base.ts)

```typescript
// frontend/src/cv/scorers/base.ts

import type { PoseFrame } from "../poseTracker";

export interface SetupCheck {
  id: string;
  label: string;
  check: (frame: PoseFrame) => boolean;
}

export interface CoachingHint {
  id: string;
  triggerCondition: (frame: PoseFrame, repScore: number) => boolean;
  message: string;
  visualLabel?: string;
  cooldownFrames: number;
}

export interface ScorerOutput {
  repCount: number;
  phase: "IDLE" | "ACTIVE" | "HOLD" | "RETURN" | "COMPLETE";
  formScore: number | null;
  activeHints: CoachingHint[];
  setupPassed: boolean;
}

export interface ExerciseScorer {
  exerciseId: string;
  setupChecks: SetupCheck[];
  processFrame(frame: PoseFrame): ScorerOutput;
  reset(): void;
}
```

### 6.4 Exercise Scorers

Each scorer lives in `cv/scorers/<name>.ts` and implements `ExerciseScorer`. The full pelvic tilt scorer below is the canonical template — the others follow the same structure.

**Pelvic Tilt** (`pelvicTilt.ts`) — measures posterior tilt depth via knee-hip-shoulder angle change from a neutral baseline. Key threshold: peak tilt at ≥20° change, minimum hold of 15 frames (~0.5s at 30fps). Form score weighted: tilt depth 50%, hip symmetry 30%, hold stability 20%.

```typescript
// frontend/src/cv/scorers/pelvicTilt.ts

import type { PoseFrame } from "../poseTracker";
import { angleDeg, hipSymmetryDelta, midpoint } from "../geometry";
import type { ExerciseScorer, ScorerOutput, SetupCheck, CoachingHint } from "./base";

const SETUP_CHECKS: SetupCheck[] = [
  {
    id: "supine",
    label: "Lie on your back facing the camera",
    check: (frame) => {
      const hip = midpoint(frame[23], frame[24]);
      const shoulder = midpoint(frame[11], frame[12]);
      return (
        frame[23].visibility > 0.6 &&
        frame[24].visibility > 0.6 &&
        Math.abs(hip.y - shoulder.y) < 0.15
      );
    },
  },
];

const HINTS: CoachingHint[] = [
  {
    id: "flatten_back",
    triggerCondition: (_frame, score) => score < 50,
    message: "Flatten your lower back into the mat",
    cooldownFrames: 90,
  },
  {
    id: "breathe",
    triggerCondition: (_frame, score) => score > 70,
    message: "Good — breathe out as you tilt",
    cooldownFrames: 150,
  },
];

export class PelvicTiltScorer implements ExerciseScorer {
  exerciseId = "pelvic_tilt_supine";
  setupChecks = SETUP_CHECKS;

  private repCount = 0;
  private phase: ScorerOutput["phase"] = "IDLE";
  private holdFrames = 0;
  private lastFormScore: number | null = null;
  private hintCooldowns = new Map<string, number>();
  private frameIndex = 0;

  processFrame(frame: PoseFrame): ScorerOutput {
    this.frameIndex++;
    const setupPassed = SETUP_CHECKS.every((c) => c.check(frame));
    if (!setupPassed) {
      return { repCount: this.repCount, phase: "IDLE", formScore: null, activeHints: [], setupPassed: false };
    }

    const hipAngle = angleDeg(frame[25], frame[23], frame[11]);
    const tiltDepth = Math.min(Math.max((hipAngle - 160) / 20, 0), 1);
    const symmetry = Math.max(0, 1 - hipSymmetryDelta(frame) / 0.05);
    const repScore = Math.round((tiltDepth * 0.5 + symmetry * 0.3 + 0.2) * 100);

    if (this.phase === "IDLE" && tiltDepth > 0.3) {
      this.phase = "ACTIVE";
    } else if (this.phase === "ACTIVE" && tiltDepth >= 0.8) {
      this.phase = "HOLD";
      this.holdFrames = 0;
    } else if (this.phase === "HOLD") {
      this.holdFrames++;
      if (tiltDepth < 0.2 && this.holdFrames >= 15) {
        this.repCount++;
        this.lastFormScore = repScore;
        this.phase = "IDLE";
      }
    }

    const activeHints = HINTS.filter((h) => {
      const last = this.hintCooldowns.get(h.id) ?? -Infinity;
      const cooled = this.frameIndex - last > h.cooldownFrames;
      if (cooled && h.triggerCondition(frame, repScore)) {
        this.hintCooldowns.set(h.id, this.frameIndex);
        return true;
      }
      return false;
    });

    return {
      repCount: this.repCount,
      phase: this.phase,
      formScore: this.lastFormScore,
      activeHints,
      setupPassed: true,
    };
  }

  reset(): void {
    this.repCount = 0;
    this.phase = "IDLE";
    this.holdFrames = 0;
    this.lastFormScore = null;
    this.hintCooldowns.clear();
    this.frameIndex = 0;
  }
}
```

**Glute Bridge** (`gluteBridge.ts`) — measures hip extension angle (hip-knee-ankle). Peak threshold: knee angle ≥165°. Form score: hip height 40%, spine neutral (spineAngle deviation) 35%, symmetry 25%.

**Cat-Cow** (`catCow.ts`) — cycle counter rather than rep/hold state machine. Tracks spineAngle oscillation through flexion (negative) and extension (positive). Full cycle = cat position reached + cow position reached + return. Form score: flexion range 40%, extension range 40%, movement smoothness 20%.

**Bird-Dog** (`birdDog.ts`) — contralateral hold. Detects which side is extended via wrist/ankle visibility. Primary metric: spineAngle deviation from neutral during hold (strict: <10°). Form score: spine neutral 40%, arm extension (shoulder-elbow-wrist angle) 30%, leg extension (hip-knee-ankle angle) 30%.

**Dead Bug** (`deadBug.ts`) — lumbar stability during limb movement. Tracks hip-shoulder y-distance deviation from a calibrated supine baseline. Form score: lumbar stability 50%, arm extension above head 25%, leg extension away from body 25%.

---

## 7. Frontend Architecture (React/Vite)

### 7.1 API Client (api/client.ts)

All calls to FastAPI go through this single module. It gets the auth token from Supabase automatically and adds the Bearer header.

```typescript
// frontend/src/api/client.ts

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const API_BASE = import.meta.env.VITE_API_URL; // e.g. https://your-app.railway.app

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Not authenticated");
  return data.session.access_token;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${detail}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${detail}`);
  }
  return res.json() as Promise<T>;
}
```

### 7.2 Auth Pages (SignIn.tsx and SignUp.tsx)

Auth uses Supabase JS directly — the FastAPI backend is not involved at all.

```typescript
// frontend/src/pages/SignIn.tsx

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-16 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white rounded py-2">
        Sign in
      </button>
    </form>
  );
}
```

`SignUp.tsx` is the same structure using `supabase.auth.signUp({ email, password })` and redirecting to `/onboarding/red-flag`.

### 7.3 Session Flow

`SessionRunner` is a React component with an explicit state machine controlling the session lifecycle. It does not call FastAPI until the session is fully complete.

```typescript
// frontend/src/components/session/SessionRunner.tsx  (structure only)

type SessionPhase =
  | "PRE_PAIN"       // member rates pain before starting
  | "LOADING_MODEL"  // MediaPipe WASM loading
  | "EXERCISING"     // CV active, reps being tracked
  | "POST_PAIN"      // member rates pain after session
  | "COMPLETE";      // data sent to FastAPI, show summary

// On mount: call initPoseLandmarker() → phase transitions to EXERCISING
// During EXERCISING: requestAnimationFrame loop calls detectPose() + scorer.processFrame()
//   Rep data accumulates in local state — no network calls
// On POST_PAIN submit: call apiPost("/session/complete", { ...allRepData, postNprs, notes })
//   then transition to COMPLETE
```

### 7.4 Component Structure

| Component | File | Purpose |
|---|---|---|
| Dashboard | `pages/Dashboard.tsx` | Pain trend chart, weekly prompts, quick pain log |
| PainTrendChart | `components/dashboard/PainTrendChart.tsx` | Inline SVG, 14-day NPRS line chart |
| ProgressBlock | `components/dashboard/ProgressBlock.tsx` | 5-stat summary (sessions, form avg, ODI, streak, week) |
| SessionRunner | `components/session/SessionRunner.tsx` | State machine orchestrating the session |
| CameraView | `components/session/CameraView.tsx` | `<video>` + `<canvas>` overlay, camera permission request |
| SkeletonOverlay | `components/session/SkeletonOverlay.tsx` | Draws landmarks + segment lines on canvas |
| ExerciseHUD | `components/session/ExerciseHUD.tsx` | Rep count, form score ring, current phase label |
| RedFlagForm | `components/forms/RedFlagForm.tsx` | 6 yes/no questions, calls `POST /intake/red-flag` |
| IntakeForm | `components/forms/IntakeForm.tsx` | Multi-step intake, calls `POST /intake/profile` |
| ODIForm | `components/forms/ODIForm.tsx` | 10-section ODI, calls `POST /odi/submit` |
| RescreenForm | `components/forms/RescreenForm.tsx` | Abbreviated red-flag recheck, calls `POST /rescreen/submit` |

---

## 8. Database Schema

### migrations/0001_initial.sql

```sql
CREATE TABLE member_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Intake fields
  pain_location TEXT,
  intake_nprs INTEGER CHECK (intake_nprs BETWEEN 0 AND 10),
  pain_duration_months INTEGER,
  directional_preference TEXT,
  aggravating_activities TEXT[],
  relieving_activities TEXT[],
  previous_treatment TEXT,

  -- Red flag
  red_flag_screened_at TIMESTAMPTZ,
  red_flag_result TEXT CHECK (red_flag_result IN ('safe', 'warn', 'block')),

  -- Program state
  current_week INTEGER DEFAULT 1,
  program_generated_at TIMESTAMPTZ
);

CREATE TABLE program_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  exercises JSONB NOT NULL,
  program_summary TEXT,
  clinical_rationale TEXT,
  progression_decisions JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id, week_number)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  pre_session_nprs INTEGER CHECK (pre_session_nprs BETWEEN 0 AND 10),
  post_session_nprs INTEGER CHECK (post_session_nprs BETWEEN 0 AND 10),
  perceived_effort INTEGER CHECK (perceived_effort BETWEEN 1 AND 10),
  member_notes TEXT,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE session_reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  rep_number INTEGER NOT NULL,
  form_score INTEGER CHECK (form_score BETWEEN 0 AND 100),
  score_breakdown JSONB,
  cues_triggered TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_profile" ON member_profiles
  FOR ALL USING (auth.uid() = id);

ALTER TABLE program_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_program_weeks" ON program_weeks
  FOR ALL USING (auth.uid() = member_id);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_sessions" ON sessions
  FOR ALL USING (auth.uid() = member_id);

ALTER TABLE session_reps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_session_reps" ON session_reps
  FOR ALL USING (
    auth.uid() = (SELECT member_id FROM sessions WHERE id = session_reps.session_id)
  );
```

### migrations/0002_outcomes.sql

```sql
CREATE TABLE pain_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  nprs_score INTEGER NOT NULL CHECK (nprs_score BETWEEN 0 AND 10),
  note TEXT,
  source TEXT CHECK (source IN ('session_pre', 'session_post', 'standalone')),
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE odi_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  responses JSONB NOT NULL,
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  disability_band TEXT NOT NULL CHECK (
    disability_band IN ('minimal', 'moderate', 'severe', 'crippling', 'bed-bound')
  ),
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coach_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  coach_message JSONB NOT NULL,
  context_snapshot JSONB,
  member_responses JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE safety_rescreens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  trigger TEXT CHECK (trigger IN ('week_boundary', 'pain_spike')),
  answers JSONB NOT NULL,
  result TEXT CHECK (result IN ('safe', 'warn', 'block')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE pain_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_pain_logs" ON pain_logs
  FOR ALL USING (auth.uid() = member_id);

ALTER TABLE odi_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_odi" ON odi_submissions
  FOR ALL USING (auth.uid() = member_id);

ALTER TABLE coach_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_checkins" ON coach_checkins
  FOR ALL USING (auth.uid() = member_id);

ALTER TABLE safety_rescreens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_rescreens" ON safety_rescreens
  FOR ALL USING (auth.uid() = member_id);
```

---

## 9. Security

### Principles

- **No video leaves the device.** MediaPipe runs in WASM inside the browser tab. The webcam feed is never sent to any server.
- **JWT verification on every FastAPI route.** The `CurrentUser` dependency (see §4) verifies the Supabase JWT before any route handler runs. No route trusts a client-supplied user ID.
- **`ANTHROPIC_API_KEY` is server-side only.** It lives in `backend/.env`, never in the frontend `.env`. The frontend never calls the Anthropic API directly.
- **Supabase RLS as data-layer safety net.** Even if the FastAPI JWT check were bypassed, RLS policies prevent cross-member data access.
- **CORS restricts origins.** `CORSMiddleware` in `main.py` allows only `FRONTEND_ORIGIN`. In production this is the Vercel/Netlify domain — not `*`.

### Backend .env template

```bash
# backend/.env — never commit

ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # project settings → API → service_role
SUPABASE_JWT_SECRET=...           # project settings → API → JWT Secret
FRONTEND_ORIGIN=https://your-frontend.vercel.app
```

### Frontend .env template

```bash
# frontend/.env — safe to commit (all VITE_ vars are public)

VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...    # project settings → API → anon public
VITE_API_URL=https://your-backend.railway.app
```

---

## 10. Performance Targets

| Metric | Target | How to Measure |
|---|---|---|
| Pose inference latency | <33ms per frame (30 FPS) | Chrome DevTools Performance panel |
| Rep detection accuracy | ≥85% agreement vs. manual ground truth | 10-rep manual test per exercise |
| False coaching hint rate | <1 per 10 reps | Same test set |
| FastAPI endpoint p95 latency | <200ms (non-Claude routes) | Railway / Render logs |
| Claude program generation | <8s end-to-end | Manual timing; show spinner |
| Session complete save (p95) | <500ms | FastAPI request logs |
| Dashboard page load (p95) | <1.5s | Browser DevTools Network tab |
| WASM model initial load | <3s on 10 Mbps | Chrome Network throttle |
| CV TTS cue latency | <200ms from trigger | Manual timing |

### Performance Degradation Handling

| Condition | Detection | Response |
|---|---|---|
| FPS drops below 15 | `performance.now()` delta between frames | Show "low performance" banner; suggest closing other tabs |
| MediaPipe fails to load | Error on `initPoseLandmarker()` | Fall back to self-paced mode; still track reps manually |
| Landmark visibility < 0.4 | Per-landmark visibility score | Show "move into better light / adjust camera" overlay |
| Camera permission denied | `getUserMedia` rejection | Show browser-specific instructions; offer self-paced mode |
| FastAPI unavailable | Fetch throws or returns 5xx | Show "connection issue" toast; queue and retry session save |

---

*All modules above map directly to the 90-day plan in `planner.md`. Build order: CV scorers (Phase 1) → outcomes pipeline (Phase 2) → progression + hardening (Phase 3). The FastAPI backend can be developed and tested independently of the frontend using the auto-generated docs at `/docs`.*
