# Mentorque — AI Voice Mock Interview Platform

An AI voice interviewer that listens, reasons about your answers in real time, and decides to follow up, probe, or move on — no fixed question bank. Built as a take-home assignment for Mentorque.

## Quick Start (5 commands)

```bash
git clone <repo> && cd <repo>
npm install
cp .env.example .env.local   # fill in DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, VAPI keys
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend + Backend | Next.js 15 (App Router) | One repo, one deploy, API routes = backend |
| Styling | Tailwind CSS v4 | Utility-first, no design time wasted |
| Database | PostgreSQL (Neon) | Serverless, free tier, works with Vercel |
| ORM | Prisma | Type-safe schema, fast migrations |
| Auth | Custom JWT (bcrypt + jose) | httpOnly cookies, no OAuth, ~150 lines |
| Conversation Engine | LangGraph.js | State graph with conditional routing |
| LLM (real-time) | GPT-4o Mini | Fast + cheap enough for every voice turn |
| LLM (feedback) | GPT-4o | Quality report generation post-session |
| Voice | Vapi | VAD, STT, TTS, barge-in handled for you |

---

## Environment Variables

```bash
DATABASE_URL=          # Neon PostgreSQL connection string
JWT_SECRET=            # Random 32+ char secret
OPENAI_API_KEY=        # sk-...
VAPI_API_KEY=          # Vapi server-side key
NEXT_PUBLIC_VAPI_API_KEY=  # Vapi public key (browser SDK)
NEXT_PUBLIC_APP_URL=   # https://your-domain.com (for Vapi webhook)
```

---

## Conversation Engine — LangGraph Design

The interview is modelled as a **state graph**, not a prompt loop:

```
intro → ask_question
ask_question → [candidate speaks] → evaluate_answer
evaluate_answer →
  "strong"        → acknowledge_and_advance → ask_question | wrap_up
  "vague"         → follow_up (max 2x per question) → evaluate_answer
  "incomplete"    → follow_up → evaluate_answer
  "weak"          → probe (max 1x per question) → evaluate_answer
wrap_up → [session ends] → generate_report (post-session, quality model)
```

Key properties:
- `topicsPlanned` is internal — never shown to candidate. Actual questions generated fresh each turn.
- Last 6 turns injected into each node prompt (not full transcript) to keep latency under Vapi's webhook window.
- `evaluate_answer` always runs on fast model (gpt-4o-mini). `generate_report` runs on quality model (gpt-4o).

---

## Interview Types

All four types use the same graph — only the system prompt + topics differ:

| Type | Persona | Evaluation Focus |
|------|---------|-----------------|
| Behavioral | Senior engineering manager | STAR completeness, ownership vs deflection |
| Technical | Engineer peer | Correctness, edge case reasoning |
| System Design | Staff engineer | Clarifying questions, trade-off discussion |
| HR / Culture Fit | HR partner | Motivation clarity, what-if judgment |

---

## Cost Analysis (per session)

Assuming a 15-minute behavioral interview (~16 turns):

| Cost Item | Rate | Est. per session |
|-----------|------|-----------------|
| Vapi platform | $0.05/min | ~$0.75 |
| Deepgram STT | ~$0.004/min | ~$0.06 |
| 11Labs TTS | ~$0.003/char | ~$0.15 |
| GPT-4o Mini (turns) | ~$0.0001/1k tokens | ~$0.05 |
| GPT-4o (report) | ~$0.01/1k tokens | ~$0.08 |
| **Total** | | **~$1.09–$1.50** |

Vapi's $10 trial credit covers ~7–9 complete sessions for demo purposes.

---

## Database Schema

```
User → Session[] → Turn[]
Session → FeedbackReport (1:1)
```

See [`prisma/schema.prisma`](./prisma/schema.prisma) for full model definitions.

---

## API Routes

```
POST /api/auth/signup        Create account, issue JWT cookie
POST /api/auth/login         Verify password, issue JWT cookie
POST /api/auth/logout        Clear cookie

GET  /api/me                 Current user profile
PATCH /api/me                Update name / jobRole / experience

POST /api/sessions           Create session, run intro node
GET  /api/sessions           List past sessions (dashboard)
POST /api/sessions/:id/turn  Vapi webhook — runs LangGraph per turn
POST /api/sessions/:id/end   Mark complete, generate report
GET  /api/sessions/:id       Full transcript + report
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | Create account (split layout) |
| `/login` | Sign in (split layout) |
| `/onboarding` | 3-step profile setup |
| `/interview/new` | Choose interview type (4 cards) |
| `/interview/[id]` | Live voice session (orb + waveform) |
| `/dashboard` | Session history + stats |
| `/dashboard/[sessionId]` | Full report + transcript |

---

## Deployment

1. Push to GitHub
2. Import to [Vercel](https://vercel.com) → add environment variables
3. Add your Neon `DATABASE_URL`, run `npx prisma migrate deploy`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. In Vapi dashboard → set Server URL to `https://your-domain.com/api/sessions/{sessionId}/turn`
