# Wellness Coach MSK — Master Project Planner
> **Product:** AI-Powered Movement & Posture Coach for Lower Back Pain  
> **Document drafted:** 2026-05-01 | **Last updated:** 2026-05-04  
> **Status:** MVP functionally complete (investor-grade demo). Targeting first paid employer pilot in 90 days.

---

## Table of Contents
1. [Project Vision & Objective](#1-project-vision--objective)
2. [Problem Context](#2-problem-context)
3. [Strategic Positioning](#3-strategic-positioning)
4. [Core Requirements](#4-core-requirements)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture & Data Flow](#6-system-architecture--data-flow)
7. [What's Already Built](#7-whats-already-built)
8. [The 90-Day Plan to First Paid Pilot](#8-the-90-day-plan-to-first-paid-pilot)
9. [Current Build Status](#9-current-build-status)
10. [What's Outstanding](#10-whats-outstanding)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [This Week's Immediate Actions](#12-this-weeks-immediate-actions)
13. [Parallel Workstreams (Non-Engineering)](#13-parallel-workstreams-non-engineering)

---

## 1. Project Vision & Objective

Build a robust, AI-native, browser-based system that:
- Tracks human movement in real time using a standard webcam
- Understands posture and exercise form using computer vision
- Provides real-time corrective audio/visual feedback
- Helps users perform lower back rehabilitation exercises safely and effectively
- Adapts the program week-over-week based on performance and outcomes data

**The product simulates the core intelligence layer behind digital MSK (musculoskeletal) platforms like Sword Health and Hinge Health — but with a hardware-free, AI-first architecture that lets us move at engineering speed.**

Members open a browser, point their webcam at themselves, and the system coaches them through evidence-based exercises with live form feedback, captures pain and function over time, and adapts their program every week.

---

## 2. Problem Context

Lower back pain recovery depends critically on:
- **Correct posture** — deviations compound injury risk
- **Proper execution** — quality of movement determines therapeutic outcome
- **Consistency over time** — adherence is the single biggest predictor of recovery

The system acts as a virtual coach that:
- Observes the user via webcam in real time
- Understands movement biomechanically (angles, alignment, timing)
- Guides corrections with context-specific, spoken coaching cues
- Tracks outcomes longitudinally and adapts the program accordingly

**Target population:** Chronic non-specific low back pain, adults 18–65, supervised by an AI coach (not a credentialed PT). This is the largest, most-evidence-supported segment of the MSK market with the lowest clinical risk for an early-stage product.

---

## 3. Strategic Positioning

### Competitive Landscape
| Competitor | Model | Funding | Limitation |
|---|---|---|---|
| Sword Health | Sensor kit + PT-of-record | $340M+ | Hardware shipping, broker-locked to Fortune 500 |
| Hinge Health | App + PT calls | $600M+ | PT intake required, weeks to first session |
| **Wellness Coach MSK** | Browser + webcam, AI-native | Early stage | No kit, no PT call, minutes to first session |

### Our Two Specific Wedges

**1. AI-Native Architecture**
Sword and Hinge built their AI layer on top of sensor + PT-led systems — AI was retrofitted. Wellness Coach MSK is built around the LLM as program designer and coach from day one, and around browser-side pose tracking that needs no hardware kit. This allows iteration at engineering speed rather than operations speed.

**2. Hardware-Free Onboarding**
Members need only a laptop and a webcam. No kit ships, no PT intake call to schedule. Time-to-first-session is **minutes, not weeks**. This radically lowers unit cost per enrolled member and makes us viable in:
- Mid-market employers (too small for Sword/Hinge)
- Smaller payers
- Geographies where hardware shipping isn't practical

### Scope Boundaries (MVP)
- **In scope:** Chronic non-specific low back pain only
- **Not in scope (yet):** Other body regions, PT-of-record model, hardware
- **Post Series-A:** Integration with main Wellness Coach product, other MSK conditions

---

## 4. Core Requirements

### 4.1 Movement Tracking
- **Approach:** MediaPipe Pose Landmarker (Tasks API, WASM) running entirely in-browser
- No video frames leave the device — fully on-device inference
- Skeleton overlay with live FPS display
- Per-segment color coding for visual feedback
- Calibration countdown and setup detection before exercise begins
- Works on webcam (preferred) or recorded video

**Output:** Reliable extraction of body movement signals (33 keypoints at 30+ FPS on commodity hardware)

### 4.2 Posture & Movement Understanding
The system represents posture mathematically and tracks movement over time:
- **Joint angles** — computed from landmark positions (e.g., hip flexion, spine extension)
- **Alignment vectors** — spine, hip symmetry, shoulder level
- **Phase detection** — recognizes exercise phases (setup, active, peak, return)
- **Hysteresis logic** — prevents noisy oscillation in rep counting
- **Cycle detection** — for rhythmic exercises like cat-cow

Must handle:
- Spine alignment (lateral, anterior/posterior)
- Hip movement and tilt
- Stability and control (dead-bug, bird-dog)

### 4.3 Exercise Intelligence Module

**10 exercises in the library (5 with live CV scoring, 5 self-paced):**

| Exercise | Mode | Key Metrics |
|---|---|---|
| Pelvic Tilt | Live CV | Posterior tilt angle, hold duration |
| Glute Bridge | Live CV | Hip extension height, symmetry, hold |
| Cat-Cow | Live CV | Flexion/extension cycle, range |
| Bird-Dog | Live CV | Spine neutral, limb extension symmetry |
| Dead Bug | Live CV | Lumbar stability, limb control |
| Exercises 6–10 | Self-paced | Instructions only, no live counter |

**Per-exercise definitions include:**
- What "correct form" means (angle thresholds, alignment criteria)
- Range of motion requirements
- Control and timing standards
- Symmetry checks
- Postural deviation detection

**Acceptance bar for CV scorers:** ≥85% rep-count agreement vs. ground truth on a 10-rep test set; false-error rate <1 per 10 reps.

### 4.4 Real-Time Feedback Engine
- Live spoken coaching cues via TTS (ElevenLabs; Web Speech API as fallback)
- Visual skeleton overlay with color-coded form status
- Exercise-specific cue library (not generic messages)
- Hint throttling — cues don't fire too rapidly
- Low-latency pipeline — feedback within the same frame window

**Example cues:**
- "Keep your back flat against the mat"
- "Hold the peak position for 2 more seconds"
- "Your left hip is dropping — focus on symmetry"
- "Increase your range of motion"

### 4.5 Repetition & Quality Scoring
- Automatic rep detection using phased state machine
- Per-rep form score: 0–100
- Rep counter displayed in real time
- Post-session: rep count summary, average form score, session quality

**Output per session:**
- Total reps completed
- Per-rep quality score
- Overall session form score (average across all scored reps)

### 4.6 Adaptive Coaching Logic
Rules-based progression engine at week boundaries:

**Advancement criteria (conservative defaults):**
- ≥3 sessions completed in the week
- ≥75% target rep hit rate
- Form score ≥75 (for scored exercises)

**Adaptive behaviors:**
- Struggling → hold at current variant, written rationale provided
- Performing well → advance to next `progression_id` in exercise library
- Poor posture persists → coaching cues emphasize correction, no advancement

The LLM coach check-in supplements the rules engine with qualitative adaptation based on member reflection answers.

### 4.7 Session & Progress Tracking

**Pain tracking (NPRS — Numeric Pain Rating Scale):**
- Pre-session NPRS captured every session
- Post-session NPRS captured every session
- Standalone "log pain" form on dashboard (0–10 quick entry + optional note)
- 14-day pain trend chart (one dot per day, smooth-line connection)

**Function tracking (Oswestry Disability Index — ODI):**
- Full validated 10-section instrument
- Scored to a percentage with disability band label
- Weekly cadence, dashboard prompt if >7 days since last submission
- Delta from prior score displayed

**Progress block (5 stats, updates after every session):**
1. Total sessions completed
2. Sessions this week
3. Current streak (consecutive days with activity)
4. Average form score across all scored reps
5. Latest ODI score with delta from prior

### 4.8 User Interface
Built as a web app (Next.js). Key screens:

| Screen | Purpose |
|---|---|
| Signup / Onboarding | Email auth → red-flag screen → intake → program generation |
| Dashboard | Pain trend, progress stats, contextual prompts |
| Session Player | Camera feed + skeleton overlay + rep counter + coaching cues |
| Post-Session | NPRS, RPE (optional), notes |
| Weekly Check-In | LLM coach conversation |
| ODI Form | Weekly disability index |
| Safety Re-Screen | Red-flag questions at week boundaries |

---

## 5. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui | Modern React, type-safe, fast iteration |
| **Database / Auth / Storage** | Supabase (Postgres + Auth + Storage + Row-Level Security) | Integrated BaaS, RLS for member data isolation |
| **Hosting** | Vercel | Zero-config Next.js deployment, edge CDN |
| **AI Coach** | Anthropic API — Claude Sonnet 4.6 | Program generation + weekly check-in; rule-based fallback if API key absent |
| **Computer Vision** | MediaPipe Pose Landmarker (Tasks API, WASM) | In-browser, no server roundtrip, no video data leaves device |
| **Voice / TTS** | ElevenLabs TTS (primary) + Web Speech API (fallback) | Natural-sounding coaching cues |
| **Charting** | Inline SVG (no chart library) | Keeps bundle lean |
| **Observability** | Structured console logging today; hookable for Sentry | One-file change wires Sentry to all server actions |

> **Note:** The MSK MVP is intentionally a **separate codebase** from the existing Wellness Coach product. Same team, different stack, different database. Integration planned post-Series-A. Pre-optimizing for integration today would slow this build to a crawl.

---

## 6. System Architecture & Data Flow

### Member Journey (End-to-End Flow)

```
SIGN UP
  └─ Email auth (Supabase)
  └─ Red-flag screen → urgent? → blocking page with escalation language
  └─ Intake form (pain location, NPRS severity, duration, directional aggravators)
  └─ Program generation: Claude reads intake + exercise library → structured 5-7 exercise program
        └─ Fallback: rule-based program if ANTHROPIC_API_KEY not set

SESSION
  └─ Pre-session NPRS pain rating
  └─ Camera on → MediaPipe Pose Landmarker loads (WASM, in-browser)
  └─ Per exercise:
        └─ Setup detection (body in frame, correct position)
        └─ Calibration countdown
        └─ Live skeleton overlay + color-coded segments
        └─ Rep counter (phase-based state machine)
        └─ Per-rep form score (0-100)
        └─ TTS coaching cues (exercise-specific, throttled)
  └─ Post-session: NPRS rating + optional RPE + free-text notes
  └─ Session saved to Supabase

DASHBOARD (updated after every session)
  └─ 14-day pain trend chart
  └─ Progress block: sessions, streak, form score, ODI delta
  └─ Contextual prompts:
        └─ "Time for your weekly coach check-in"
        └─ "Take your weekly safety check"
        └─ "Ready to advance to week 2"

WEEKLY LOOP (7 min total per week)
  └─ LLM Coach Check-In (3 min)
        └─ Claude reads: pain trend, session count, ODI delta, recent notes
        └─ Produces: greeting + observations + 2-3 reflection questions + next-week guidance + safety flag
        └─ Member answers in textareas → thread saved to DB
  └─ ODI Weekly Form (3 min)
        └─ 10-section validated instrument → scored to % + disability band
  └─ Safety Re-Screen (1 min)
        └─ 6 urgent yes/no questions + free-text field
        └─ Triggered at week boundary OR pain spike ≥2 points above intake baseline
        └─ Any urgent "yes" → member routed out of program until cleared

WEEK BOUNDARY PROGRESSION
  └─ Progression engine evaluates each exercise:
        └─ ≥3 sessions + ≥75% rep target + form score ≥75 → advance to next variant
        └─ Criteria not met → hold, written rationale surfaced to member
  └─ New program written with transparent per-exercise explanation
```

### CV Scorer Architecture (per exercise)

```
Camera Frame
  └─ MediaPipe Pose Landmarker (WASM)
  └─ 33 body landmarks (x, y, z, visibility)
  └─ Setup Check Module
        └─ Body in frame? Correct position (supine/quadruped/standing)?
        └─ Camera angle acceptable (side-on for bridge, front for dead-bug)?
  └─ Calibration (baseline measurement per member session)
  └─ Rep State Machine
        └─ Phase: IDLE → SETUP → ACTIVE → PEAK → RETURN → IDLE
        └─ Hysteresis on phase transitions (prevents jitter)
  └─ Form Scorer
        └─ Joint angle computation
        └─ Alignment checks
        └─ Score: 0-100 per rep
  └─ Hint Engine
        └─ Exercise-specific cue library
        └─ Throttled output → TTS / visual overlay
```

---

## 7. What's Already Built

> All items below are live in code and verified working in a Chrome smoke test of the local build.

### Onboarding
- [x] Email-based signup with Supabase Auth
- [x] Single-page intake: pain location, NPRS severity, duration, directional aggravators
- [x] Clinical-grade red-flag screen (cauda equina, progressive weakness, new-onset weight loss/fever/cancer history) → blocking page with escalation language
- [x] AI program generation (Claude Sonnet 4.6) → structured 5-7 exercise program with per-exercise rationale
- [x] Rule-based fallback program generation (demo never breaks without API key)

### Live Exercise Sessions
- [x] MediaPipe Pose Landmarker (WASM) — no video leaves device
- [x] Skeleton overlay, live FPS counter, calibration countdown, per-segment color coding
- [x] **5 exercises with full live CV scoring:**
  - [x] Pelvic tilt
  - [x] Glute bridge
  - [x] Cat-cow (with cycle counter primitive)
  - [x] Bird-dog
  - [x] Dead-bug
- [x] Setup detection per exercise (body in view, correct position, camera angle)
- [x] Rep counter (phase-based for holds, cycle-based for cat-cow)
- [x] Per-rep form score (0–100)
- [x] TTS coaching cues (ElevenLabs + Web Speech API fallback)
- [x] 5 remaining exercises in self-paced mode (full instructions, no live counter)
- [x] Pre/post-session NPRS pain capture every session
- [x] Optional RPE and free-text notes on post-session screen

### Outcomes & Dashboard
- [x] 14-day pain trend chart (NPRS from sessions + standalone log entries)
- [x] Standalone "log pain" inline form — 0-10 button row + optional note
- [x] Oswestry Disability Index (ODI) — full validated 10-section instrument, scored to %, weekly cadence
- [x] Dashboard prompt when last ODI submission is >7 days old
- [x] Progress block: total sessions, sessions this week, current streak, average form score, latest ODI + delta

### Coaching & Adaptation
- [x] Weekly AI coach check-in (LLM-driven with rule-based fallback)
- [x] Multi-week progression engine (rules-based v1) — advance or hold per exercise with written rationale
- [x] Weekly red-flag re-screen at week boundaries + symptom-change trigger (pain spike ≥2 points)

### Operational Hardening
- [x] Global error boundary with member-safe message + error reference for support
- [x] Custom 404 page
- [x] Centralized error/event capture utility (`lib/observability/capture.ts`) — hookable for Sentry
- [x] Operations runbook: top 3 failure modes, required env vars, migration apply order, smoke-test checklist
- [x] Per-exercise visuals + status banner in SessionRunner fixed

---

## 8. The 90-Day Plan to First Paid Pilot

> Solo full-time execution, 90 days, optimized for a paying employer pilot — not just an investor demo.

### Phase 0 — Week 1: Kick Off Async Dependencies
> The two longest-lead-time items must start before any code.

| Action | Owner | Deadline |
|---|---|---|
| Engage PT clinical advisor — send clinical-foundation doc, exercise library JSON, red-flag screen | Founder | Week 1 |
| Plan PT video shoot — find PT model, studio/home setup, kit list, write shot list | Founder | Week 1 |

> **Critical note:** PT review is the single brittlest dependency. If the email doesn't go out in Week 1, review won't return until Week 6+, compressing Phase 3 dangerously. Do not let engineering momentum crowd this out.

---

### Phase 1 — Weeks 2–5: CV Breadth
> Pelvic-tilt is the template. Extract reusable primitives; ship the next four CV scorers on top.

| Week | Deliverable |
|---|---|
| Week 2 | Extract shared scorer infrastructure (setup checks, hysteresis, calibration, rep state machine, hint throttling) — **highest-leverage week of the quarter** |
| Week 3 | Glute-bridge CV scorer |
| Week 4 | Cat-cow CV scorer |
| Week 5 | Bird-dog + dead-bug CV scorers |

**Acceptance bar per exercise:** ≥85% rep-count agreement vs. ground truth on 10-rep test set; false-error rate <1 per 10 reps.

---

### Phase 2 — Weeks 6–9: Outcomes Pipeline + Behavior Loop
> This workstream turns a session-level demo into a longitudinal product an employer can buy. Without outcome data there is no pilot report; without a pilot report there is no second contract.

| Week | Deliverable |
|---|---|
| Week 6 | NPRS pre/post-session capture; pain log UI + 14-day trend chart on dashboard |
| Week 7 | Oswestry Disability Index (ODI), weekly cadence, scored to % |
| Week 8 | Member progress dashboard (sessions, streak, totals, form average, ODI delta) |
| Week 9 | Weekly AI coach check-in — once-a-week prompt; coach reads data, asks 2-3 reflection questions, optionally adjusts program |

---

### Phase 3 — Weeks 10–13: Progression, Re-Screen, Hardening, Video
> By now PT review feedback is back (Week 4-5), library v0.2 is in flight, and the video shoot has happened (Week 8-9), so footage is editing.

| Week | Deliverable |
|---|---|
| Week 10 | Rules-based progression engine |
| Week 11 | Weekly red-flag re-screen + symptom-change trigger |
| Week 12 | Incorporate PT clinical review feedback into library v0.2 + integrate shot PT demo videos |
| Week 13 | Pilot hardening — Sentry, support inbox, runbook, end-to-end smoke test as a fresh member |

---

### What "Pilot-Ready" Means at End of Week 13

**Member-facing:**
- Sign up → red-flag screen → intake → AI-generated 5-exercise program
- 5 exercises with live CV form scoring + rep counting; 5 self-paced
- Pre/post-session NPRS, weekly ODI, standalone pain logs
- Pain trend + program progress dashboard
- Weekly LLM coach check-in that adjusts the program
- Rules-based week-over-week progression
- Re-screen at week boundaries + on symptom change
- Real PT demo videos (not animated stand-ins)
- Exercise library reviewed and version-stamped by a licensed PT

**Operationally:**
- Sentry + uptime monitoring + support inbox
- RLS audited, runbooks for top 3 failure modes

---

## 9. Current Build Status

> As of 2026-05-01 sprint review. Major progress — the bulk of the 90-day plan has been shipped in advance.

| Task | Status |
|---|---|
| Extract shared CV scorer infrastructure from pelvic-tilt | ✅ Done |
| Ship glute-bridge CV scorer | ✅ Done |
| Ship cat-cow CV scorer (with new cycle counter primitive) | ✅ Done |
| Ship bird-dog CV scorer | ✅ Done |
| Ship dead-bug CV scorer | ✅ Done |
| Wire NPRS pre/post-session pain capture into session flow | ✅ Done |
| Build pain log UI + 14-day trend chart on dashboard | ✅ Done |
| Build Oswestry Disability Index (ODI) weekly check-in | ✅ Done |
| Build member progress dashboard (sessions, streak, form, ODI) | ✅ Done |
| Weekly AI coach check-in (LLM-driven, with rule-based fallback) | ✅ Done |
| Multi-week progression engine (rules-based v1) | ✅ Done |
| Re-screen for red flags at week boundaries + symptom changes | ✅ Done |
| Pilot hardening: error boundary, capture util, runbook | ✅ Done |
| Fix per-exercise visuals + status banner in SessionRunner | ✅ Done |
| Smoke-test latest capabilities in Chrome | ✅ Done |

### Known Issue (1 Remaining)
**ODI submission fails in production** with: `"Could not find the table 'public.odi_responses' in the schema cache"`

Fix: Run `app/supabase/migrations/0003_odi_responses.sql` in the Supabase SQL editor. **5-minute fix.** The error path itself works correctly (form preserves state, error surfaces verbatim).

---

## 10. What's Outstanding

### Engineering / Clinical Content

| Task | Blocked By |
|---|---|
| Engage PT clinical advisor for library + red-flag review | Founder action — email must go out this week |
| Plan and book PT demo video shoot (10 exercises × 3 angles) | Founder action — find PT model + studio; schedule Week 8-9 |
| Incorporate PT clinical review feedback into library v0.2 | Blocked on advisor returning review (Week 4-5 if started now) |
| Integrate shot PT demo videos into exercise UI | Blocked on actual shoot (Week 10-11 once footage is in) |

### Required Before Production Goes Live

1. **Run ODI migration in Supabase:** `app/supabase/migrations/0003_odi_responses.sql` in the SQL editor
2. **Confirm `ANTHROPIC_API_KEY`** is set in Vercel environment variables (without it, AI coach falls back to rule-based — still functional, less personalized)
3. **Update `support@wellnesscoach.live` placeholder** if different inbox is needed; configure forwarding

---

## 11. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| PT review comes back with structural changes requiring new CV scorers | Medium | Clinical content is JSON-driven — structural changes are an afternoon's work. Risk is only if review introduces entirely new exercises. |
| Dead-bug or bird-dog CV scoring proves unreliable on commodity hardware | Low-Medium | Ship those exercises self-paced if scoring is noisy. Better to drop a scorer than ship a wrong one. NPRS-based outcomes don't depend on form scoring. |
| Solo founder fatigue around Week 8 | Medium | Front-load Phase 2 (outcomes pipeline) into Phase 1 gaps where possible. One off-day per fortnight as a forcing function. |
| **PT review email doesn't go out in Week 1** | **High impact** | **This is the single highest-impact risk.** Engineering is fun and gratifying; the email is not. If review doesn't kick off in Week 1, it doesn't return until Week 6+, which compresses Phase 3 dangerously. |
| Pilot signing doesn't complete before product is ready | Medium | Engineering being ahead of GTM is fine; the reverse is not. Parallel GTM workstreams must start in Week 1, not Week 12. |

---

## 12. This Week's Immediate Actions

1. **Run the ODI migration** in Supabase SQL editor (`0003_odi_responses.sql`) — 5 minutes
2. **Send PT advisor outreach email** with clinical-foundation doc, exercise library JSON, and red-flag screen
3. **Sketch PT video shoot logistics** — PT model, studio or home setup, kit list. Pencil in Week 8-9 on the calendar
4. **Identify 1-2 design-partner employer prospects** and send first conversational email (design-partner discount + tight feedback loop offer)
5. **Decide SaMD vs. wellness posture** for pilot framing — current wellness framing is fine for demo and small design-partner pilot, but needs explicit confirmation from a legal advisor before enterprise pricing

---

## 13. Parallel Workstreams (Non-Engineering)

> These workstreams are not owned in this document but **block first revenue.** They must start in Week 1.

| Workstream | What's Needed |
|---|---|
| **Pilot agreement paperwork** | Signed contract with design-partner employer |
| **Legal documents** | BAA + privacy policy + ToS that survive enterprise legal review |
| **Regulatory posture decision** | Is this a wellness product or a SaMD requiring FDA conversation? Get to a defensible answer before pricing anyone. Current framing: wellness, not medical care. |
| **PT-of-record arrangement** | Contracted clinical partner with malpractice coverage for member escalations |
| **GTM / actual sale** | Who is the design-partner employer? When is the conversation? This needs to start now. |

---

## Appendix A: Exercise Library (Current)

| # | Exercise | Category | CV Scoring | Progression Path |
|---|---|---|---|---|
| 1 | Pelvic Tilt | Core stabilization | Live | → Week 2 variant |
| 2 | Glute Bridge | Hip/core | Live | → Single-leg bridge |
| 3 | Cat-Cow | Mobility/flexibility | Live | → Extended range |
| 4 | Bird-Dog | Core stability | Live | → Resistance band variant |
| 5 | Dead Bug | Core stabilization | Live | → Extended limb variant |
| 6–10 | (5 exercises) | Various | Self-paced | Per library JSON |

**Shot list for PT video production:**
- 3 angles per exercise: front, side, close-up form-error illustrative
- Total: 30 clips (10 exercises × 3 angles)
- Shoot target: Week 8-9 (after PT clinical review is incorporated)

---

## Appendix B: Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `users` | Supabase Auth managed |
| `member_profiles` | Intake data, program assignment |
| `sessions` | Session records + pre/post NPRS |
| `session_reps` | Per-rep form scores |
| `pain_logs` | Standalone NPRS entries |
| `odi_responses` | Weekly ODI submissions *(migration pending)* |
| `coach_checkins` | Weekly LLM coach conversation threads |
| `safety_screens` | Red-flag screen responses |
| `program_weeks` | Per-week exercise assignments + progression decisions |

---

*This document is the master reference for product, engineering, and clinical content. Regulatory/legal and GTM workstreams are owned outside this document and run in parallel. Questions, pushback, and scope-cut suggestions are welcome — the plan is opinionated but not precious.*