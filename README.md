# Torque AI — AI Voice Mock Interview Platform

Torque AI is a real-time voice AI that conducts mock interviews the way an actual interviewer would: it listens to what you say, decides on the spot whether to follow up, push back, or move on, and closes with a feedback report grounded in what was actually said. There is no fixed question bank and no script — every question and follow-up is generated fresh from the live conversation.

Live Website: https://torque-llm.vercel.app/

---

## Table of Contents

1. [Why this exists](#why-this-exists)
2. [What makes this different](#what-makes-this-different)
3. [Quick Start](#quick-start)
4. [Environment Variables](#environment-variables)
5. [Architecture](#architecture)
6. [The Conversation Engine (LangGraph)](#the-conversation-engine-langgraph)
7. [Voice Layer (Vapi)](#voice-layer-vapi)
8. [Interview Types](#interview-types)
9. [Design Trade-offs](#design-trade-offs--why-they-were-made)
10. [Cost Analysis](#cost-analysis-per-session)
11. [Database Schema](#database-schema)
12. [API Routes](#api-routes)
13. [Pages](#pages)
14. [Deployment](#deployment)
15. [Screenshots](#screenshots)
16. [Author](#author)

---

## Why this exists

Most interview-prep tools are quizzes wearing a chat UI: a fixed list of questions, no memory of what you actually said, and feedback that could apply to anyone. That doesn't prepare you for a real interview, because a real interview is adversarial and adaptive — a good interviewer notices when you're vague, asks you to go deeper, and changes course based on your answers.

Torque AI was built to close that gap: a voice-only AI interviewer that behaves like a real one — one question at a time, genuinely reactive to your last answer, capable of surprising you with a follow-up you didn't expect — and that produces a report you can trust because every line in it is traceable back to something you actually said in the transcript.

## What makes this different

- **No question bank.** The AI is never handed a list of 10 questions to march through. It plans *topics* internally (e.g. "handling failure," "prioritization trade-offs") and generates the actual question text fresh, every time, from the live conversation — so no two interviews ask the same thing the same way.
- **It actually decides, per answer.** Every candidate response is classified (`strong` / `vague` / `weak` / `incomplete`) before the AI decides what to do next. Vague answers get a targeted follow-up that quotes what you said. Weak or contradictory answers get a respectful push-back. Strong answers get acknowledged and the interview moves on. This is a real decision made per turn, not a canned branch.
- **It knows how to end a conversation like a human would.** It states the format up front (~5 questions, follow-ups where needed, ~15–20 minutes), wraps up naturally when time or topics run out, and if you say "let's end the interview," it says a graceful goodbye and ends the call itself — instead of you having to hunt for a stop button.
- **The report is grounded, not generated.** If a session had no real answers (dead mic, disconnected candidate), the report says exactly that instead of inventing feedback about topics that were never discussed. Every claim the report makes is required to trace back to the transcript.
- **Managed voice infrastructure, not reinvented wheels.** Speech-to-text, text-to-speech, voice activity detection, and barge-in handling are all delegated to Vapi (Deepgram + ElevenLabs under the hood) — this project focuses its engineering effort entirely on the part that's actually hard: the reasoning about what to say next.

---

## Quick Start

```bash
git clone <repo> && cd <repo>
npm install
cp .env.example .env.local   # fill in every variable — see below, especially the Vapi section
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **The voice call will not connect on `npm install` alone.** Unlike the database or auth, Vapi requires a one-time manual setup step in their dashboard before any call can be started — see [Voice Layer (Vapi)](#voice-layer-vapi) below. This is not a bug in this repo; it's a hard requirement of Vapi's free tier (it blocks inline/transient assistants and requires a *registered* assistant ID). Budget 5–10 minutes for this the first time.

---

## Environment Variables

```bash
# Database (Neon Postgres, or any Postgres instance)
DATABASE_URL=              # postgresql://user:pass@host/db?sslmode=require

# Auth
JWT_SECRET=                # random 32+ char string — used to sign session JWTs

# LLM — either works, OpenRouter is used if both are set
OPENAI_API_KEY=            # sk-...
OPENROUTER_API_KEY=        # sk-or-v1-... (recommended — lets you route to the fastest upstream provider per request)

# Vapi (voice layer) — see "Voice Layer (Vapi)" section for the manual setup this requires
VAPI_API_KEY=               # Vapi SERVER/private key (dashboard → API Keys) — never sent to the browser
NEXT_PUBLIC_VAPI_API_KEY=   # Vapi PUBLIC key (dashboard → API Keys) — safe for the browser SDK
NEXT_PUBLIC_VAPI_ASSISTANT_ID=  # id of the registered Vapi assistant (see below) — REQUIRED, not optional

# App URL — used to build the webhook URL Vapi calls back into
NEXT_PUBLIC_APP_URL=        # http://localhost:3000 locally, your real domain in production
```

`NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle **at build time**. If you change one after deploying, you must trigger a new build — restarting the server is not enough.

---

## Architecture

```
┌──────────────┐        WebRTC audio        ┌──────────────┐
│   Browser    │ ◄────────────────────────► │   Vapi API   │
│ (Vapi Web    │                             │ (STT/TTS/VAD)│
│  SDK, proxied│                             └──────┬───────┘
│  same-origin)│                                    │ POST (OpenAI-
└──────────────┘                                    │ compatible SSE)
                                                     ▼
                                          ┌────────────────────┐
                                          │  Next.js API route  │
                                          │ /api/sessions/turn/  │
                                          │  chat/completions    │
                                          └──────────┬───────────┘
                                                     │ rebuilds full
                                                     │ transcript state
                                                     ▼
                                          ┌────────────────────┐
                                          │  LangGraph engine   │
                                          │ (evaluate → route → │
                                          │  respond)           │
                                          └──────────┬───────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  Postgres (Neon)      │
                                          │  User / Session /     │
                                          │  Turn / FeedbackReport│
                                          └────────────────────────┘
```

**Key design decision: the server is stateless between turns.** No in-memory session state, no sticky connections. Every turn, the full conversation is reconstructed from the `Turn` table (ordered by timestamp), fed into the graph, and the result is written back. This means the app can run on serverless functions (Vercel) that spin up and down per request, at the cost of one extra database read per turn — a trade worth making for zero-ops deployment.

**Layers:**
- **Frontend + Backend**: Next.js 15 App Router — one deploy, API routes double as the backend, no separate server to run or ops-manage.
- **Database**: Postgres via Neon (serverless, scales to zero, free tier, pairs naturally with Vercel).
- **ORM**: Prisma — type-safe schema, fast local iteration via `db push`.
- **Auth**: Hand-rolled JWT (bcrypt + `jose`), httpOnly cookie, 7-day expiry. No OAuth — deliberately, see [Trade-offs](#design-trade-offs--why-they-were-made).
- **Conversation engine**: LangGraph.js — the interview is modeled as a state graph, not a single prompt loop. See below.
- **Voice**: Vapi — manages the entire real-time audio pipeline so this codebase never touches raw audio.
- **LLM**: OpenRouter, routed to `gpt-4o-mini` for every live turn (speed) and `gpt-4o` for the post-session report (quality).

---

## The Conversation Engine (LangGraph)

The interview is modeled as a **state graph** with one specialized node per responsibility, not one large prompt trying to do everything:

```
                              ┌──────────┐
                    ┌────────►│  intro   │  (templated, no LLM call — instant)
                    │         └────┬─────┘
              routeEntry           ▼
                    │         ┌──────────────┐
                    └────────►│ ask_question │◄─────────────────┐
                              └──────┬───────┘                  │
                          candidate speaks, END                 │
                                     │                           │
                                     ▼                           │
                          ┌────────────────────┐                 │
                          │  evaluate_answer    │                 │
                          │ (classifies answer  │                 │
                          │  strong/vague/weak/  │                │
                          │  incomplete)         │                │
                          └──────────┬──────────┘                │
                     ┌───────────────┼────────────────┐          │
                strong│          vague/incomplete  weak│          │
                     ▼               ▼                 ▼          │
        ┌────────────────────┐ ┌───────────┐   ┌───────────┐     │
        │acknowledge_and_     │ │ follow_up │   │  probe    │     │
        │advance (new topic)  │ │ (max 2x)  │   │ (max 1x)  │     │
        └──────────┬──────────┘ └─────┬─────┘   └─────┬─────┘     │
                    │                  └───────────────┴──────────┘
             all topics covered              (loops back to
             or time budget hit                candidate)
                    │
                    ▼
              ┌───────────┐
              │  wrap_up   │ → ends call, generate_report runs post-session
              └───────────┘
```

**Why a graph instead of one big prompt:**
- **Adaptive branching is explicit, not implicit.** `routeAfterEvaluation` is a real function that reads the classified answer quality and the follow-up count, and decides the next node. That logic is testable and inspectable independent of any single prompt — a monolithic "chat loop" prompt can't be branched on or unit-tested the same way.
- **Persistent, structured state.** `InterviewState` carries the full transcript, current topic, topics covered/planned, follow-up counts, and turn count across the entire conversation — reconstructed from the database every turn so the AI always has complete context, never just the last message.
- **Specialized nodes, specialized prompts.** Evaluation, follow-up generation, pushback, topic transition, and final scoring each have a narrowly-scoped prompt built for exactly one job. This is far more reliable than one prompt trying to simultaneously decide quality, generate the next line, and track topic coverage.
- **Future-proof by construction.** Adding a coding-round node, a different interviewer persona, or human-reviewer intervention is a new node and a routing edge — not a rewrite of a monolithic prompt.

---

## Voice Layer (Vapi)

Vapi is the entire real-time audio pipeline: WebRTC transport, Deepgram speech-to-text, ElevenLabs text-to-speech, voice activity detection, and barge-in (interrupting the AI mid-sentence) are all handled by Vapi — none of it is custom code in this repo.

This app plugs into Vapi via its **Custom LLM** provider: Vapi treats our webhook as an OpenAI-compatible endpoint, POSTing `{ messages, stream: true }` to `/api/sessions/turn/chat/completions` and expecting a server-sent-events chat-completion stream back. The webhook runs that turn through the LangGraph engine and streams the response back sentence-by-sentence, so Vapi's TTS can start speaking before the full reply is generated.

**One-time manual setup this requires** (not scriptable — a real limitation of Vapi's free tier, not this codebase):

1. Create a Vapi account and grab your **public** and **private** API keys (dashboard → API Keys).
2. Create an **Assistant** in the Vapi dashboard (Vapi's free tier blocks passing custom LLMs inline/transiently — a registered assistant is required).
3. Set that assistant's **Model Provider** to `Custom LLM`, URL: `https://<your-domain>/api/sessions/turn` (Vapi appends `/chat/completions` itself — both paths are wired up in this repo).
4. Set Voice to `11labs`, Transcriber to `deepgram` / `nova-2`.
5. Copy the assistant's ID into `NEXT_PUBLIC_VAPI_ASSISTANT_ID`.

The browser never talks to `api.vapi.ai` directly — it calls through a same-origin proxy (`/api/vapi/*`) that forwards to Vapi server-side, since direct browser calls to Vapi's API are frequently blocked by adblockers, browser privacy shields, and some corporate firewalls.

---

## Interview Types

All four types share the same graph and the same engineering — only the persona's system prompt, evaluation focus, and topic list differ:

| Type | Interviewer persona | What it evaluates |
|------|---------------------|--------------------|
| Behavioral | Senior engineering manager | STAR completeness, specificity, ownership vs. deflection |
| Technical | Peer-level engineer | Correctness, depth under probing, edge-case reasoning |
| System Design | Staff engineer | Requirements clarification, trade-off discussion, handling pushback |
| HR / Culture Fit | HR partner | Motivation clarity, values alignment, situational judgment |

---

## Design Trade-offs — why they were made

Being upfront about the deliberate compromises, since every real engineering decision has a cost:

- **The opening question per interview type is a fixed template, not LLM-generated.** This is the one piece of canned text in the entire flow — done so that creating a session is instant (no LLM round-trip before the candidate can start speaking). Every question after the first is fully dynamic.
- **Evaluation and response generation are two sequential LLM calls per turn**, not one combined call. This keeps each prompt narrowly scoped (a classifier prompt is more reliable than one prompt asked to classify *and* respond simultaneously) at the cost of extra latency per turn. If sub-second turn latency becomes a hard requirement, merging these into a single structured-output call is the next optimization.
- **The server is stateless between turns** (see Architecture) — an extra database round-trip per turn, in exchange for being deployable entirely on serverless infrastructure with no session affinity or in-memory state to manage.
- **Auth is hand-rolled JWT, not OAuth.** Simple email + password, bcrypt-hashed, signed JWT in an httpOnly cookie. This was a deliberate scope decision — OAuth adds provider config, redirect handling, and account-linking complexity with no proportional benefit for a mock-interview tool where the primary need is "know which user this is."
- **The Vapi webhook endpoints are intentionally unauthenticated** (`/api/sessions/turn`, `/api/sessions/[id]/turn`) — Vapi must be able to reach them without a login session. They're protected only by the session ID being an unguessable `cuid`, not by verifying a Vapi request signature. Acceptable for the current threat model; the next hardening step would be verifying Vapi's optional webhook signature header.

---

## Cost Analysis (per session)

Assuming a 15-minute behavioral interview (~16 conversational turns):

| Cost Item | Rate | Est. per session |
|-----------|------|-------------------|
| Vapi platform | ~$0.05/min | ~$0.75 |
| Deepgram STT | ~$0.004/min | ~$0.06 |
| ElevenLabs TTS | ~$0.003/char | ~$0.15 |
| GPT-4o Mini (live turns, 2 calls/turn) | ~$0.0001/1k tokens | ~$0.05 |
| GPT-4o (final report, 1 call) | ~$0.01/1k tokens | ~$0.08 |
| **Total** | | **~$1.09–$1.50** |

Vapi's free trial credit (~$10) covers roughly 7–9 complete end-to-end sessions for demo/evaluation purposes.

---

## Database Schema

```
User → Session[] → Turn[]
Session → FeedbackReport (1:1)
```

- `Session.shareToken` — nullable unique token; set the first time a candidate shares a report, powering the public read-only `/report/[token]` page without exposing the account or transcript.
- `Turn.graphNode` — records which LangGraph node produced each AI turn (`ask_question`, `follow_up`, `probe`, `wrap_up`, etc.) — pure debuggability, lets you replay exactly how the AI reasoned through a session after the fact.

See [`prisma/schema.prisma`](./prisma/schema.prisma) for full model definitions.

---

## API Routes

```
POST /api/auth/signup                          Create account, issue JWT cookie
POST /api/auth/login                           Verify password, issue JWT cookie
POST /api/auth/logout                          Clear cookie
POST /api/auth/demo                            One-click evaluator login — creates a real account, same as signup

GET   /api/me                                  Current user profile
PATCH /api/me                                  Update name / jobRole / experience

POST /api/sessions                             Create session, run templated intro
GET  /api/sessions                              List past sessions (dashboard)
GET  /api/sessions/:id                          Full transcript + report
POST /api/sessions/:id/turn                     Legacy/direct-test turn endpoint
POST /api/sessions/:id/turn/chat/completions    Vapi custom-llm webhook (per-session)
POST /api/sessions/turn/chat/completions        Vapi custom-llm webhook (static assistant)
POST /api/sessions/:id/end                      Mark complete, generate feedback report
POST /api/sessions/:id/share                    Create/return the public share token

POST /api/vapi/[...path]                        Same-origin proxy to the Vapi REST API
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | Create account |
| `/login` | Sign in |
| `/onboarding` | Profile setup (name, job role, experience) |
| `/interview/new` | Choose interview type |
| `/interview/[id]` | Live voice session |
| `/dashboard` | Session history + stats |
| `/dashboard/[sessionId]` | Full report + transcript, share + download PDF |
| `/report/[token]` | Public, read-only shared report (no login required) |

---

## Deployment

1. Push to GitHub.
2. Import to [Vercel](https://vercel.com) → add every environment variable listed above.
3. Point `DATABASE_URL` at your Neon project, then run `npx prisma db push` once against production.
4. Set `NEXT_PUBLIC_APP_URL` to your real Vercel domain.
5. In the Vapi dashboard, set the assistant's Custom LLM URL to `https://<your-domain>/api/sessions/turn`.
6. Redeploy after setting env vars — `NEXT_PUBLIC_*` values are baked in at build time, not read at runtime.

---

## Screenshots

### Landing page

![Landing page](./docs/screenshots/landing-page.png)

### Dashboard

Session history, average score, and quick access to start a new interview.

![Dashboard](./docs/screenshots/dashboard.png)

### Choosing an interview type

![Choose interview type](./docs/screenshots/choose-interview.png)

### Live interview session

Voice-only — the AI interviewer speaks, listens, and reacts in real time.

![Live interview](./docs/screenshots/live-interview.png)

---

## Author

Made by **Kabilesh C**
[GitHub](https://github.com/kabilesh-c) · [LinkedIn](https://www.linkedin.com/in/kabilesh-c20) · [kabileshc.dev@gmail.com](mailto:kabileshc.dev@gmail.com)
