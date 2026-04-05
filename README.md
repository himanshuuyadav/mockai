# MockAI

MockAI is an AI-powered interview preparation platform built with Next.js. It helps users upload a resume, convert it into structured candidate data, generate contextual mock interview questions, submit answers during a live session, and review a post-interview performance report with actionable feedback.

The application is designed like a small SaaS product rather than a demo page. It includes authentication, protected routes, resume parsing, AI-driven interview orchestration, Stripe billing, usage limits for free users, and report generation for completed sessions.

## Project Overview

MockAI supports a complete interview-prep workflow:

1. Users sign in with Google using NextAuth.
2. Users upload a PDF or DOCX resume.
3. The resume is uploaded to Cloudinary and parsed into text.
4. Gemini-powered services structure the resume into reusable interview context.
5. Users start a technical or HR interview session.
6. The system generates contextual questions and follow-up questions.
7. Answers are analyzed and stored with scores, feedback, and transcript data.
8. A final report is generated with metrics like confidence, filler words, speaking speed, and improvement suggestions.

## User Journey Flow

```text
User lands on MockAI
        |
        v
Check session
        |
        +--> Not signed in --> Login with Google --> User profile sync
        |
        v
Open dashboard
        |
        v
Upload resume
        |
        v
Validate file -> Upload to Cloudinary -> Parse text -> Structure with AI -> Save to MongoDB
        |
        v
Start interview
        |
        +--> Technical interview
        |
        +--> HR interview
        |
        v
Generate first question
        |
        v
Submit answer
        |
        v
Analyze answer + generate follow-up
        |
        v
Repeat until session ends
        |
        v
Generate final report
        |
        v
View score, feedback, charts, and suggestions

Optional billing path:
Dashboard -> Upgrade to Pro -> Stripe checkout -> Webhook sync -> Unlimited interviews / deeper analysis
```

## Core Features

- Google OAuth login with session-aware protected pages
- Resume upload and parsing for `PDF` and `DOCX`
- Resume intelligence extracted into structured skills, projects, experience, education, and more
- Technical and HR interview modes
- AI-generated first questions and follow-up questions based on resume context and optional job description input
- Live interview session flow with transcript capture and optional answer video uploads
- Final interview report with charts, feedback timeline, and transcript review
- Free vs Pro access model with monthly interview limits
- Stripe checkout, subscription management, and webhook handling

## Tech Stack

### Frontend

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Radix UI Slot
- React Hook Form
- Zod

### Backend and Platform

- Next.js Route Handlers for API endpoints
- NextAuth for authentication
- MongoDB with Mongoose
- Google Gemini via `@google/genai`
- Cloudinary for resume and interview media storage
- Stripe for subscriptions and billing

### Tooling

- ESLint
- PostCSS
- Tailwind configuration via `tailwind.config.ts`

## Environment Variables

Create a `.env.local` file based on [`.env.example`](/c:/Users/Dell/Desktop/mockai/.env.example).

Required variables used by the app include:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `GEMINI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `BILLING_BOOTSTRAP_TOKEN`

Environment validation runs at app startup through [`lib/config.ts`](/c:/Users/Dell/Desktop/mockai/lib/config.ts) and [`lib/env.ts`](/c:/Users/Dell/Desktop/mockai/lib/env.ts).

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

```bash
cp .env.example .env.local
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

Then replace placeholder values with real credentials.

### 3. Run development server

```bash
npm run dev
```

The app will start on `http://localhost:3000`.

### 4. Build for production

```bash
npm run build
npm start
```

## Scripts

- `npm run dev` starts the Next.js dev server
- `npm run build` creates a production build
- `npm run start` runs the production server
- `npm run lint` runs linting

## Folder Structure

```text
mockai/
|- app/                 Next.js pages, layouts, and API routes
|- components/          Reusable UI and feature components
|- hooks/               Custom React hooks
|- lib/                 Shared infra, config, auth, db, utils
|- models/              Mongoose models
|- services/            Domain and integration logic
|- types/               Type declarations
|- utils/               Misc constants and helpers
|- middleware.ts        Route protection and tier gating
|- tailwind.config.ts   Tailwind theme configuration
|- next.config.mjs      Next.js configuration
|- package.json         Scripts and dependencies
```

## Key Product Pages

- `/` landing page
- `/login` Google sign-in entry
- `/dashboard` user dashboard
- `/resume` resume workspace
- `/interview` interview setup
- `/interview/session/[sessionId]` live interview room
- `/report` interview report view
- `/pricing` subscription plan details
- `/profile` user profile page

## API Surface

Main route groups in [`app/api`](/c:/Users/Dell/Desktop/mockai/app/api):

- `auth` for NextAuth handlers
- `resume` for upload and latest resume retrieval
- `interview/session` for session creation, answer submission, ending, and report access
- `billing` for checkout, cancellation, bootstrap, and webhook handling

## Curl Endpoints

Most application endpoints are protected and require a valid signed-in session. For `curl` testing, pass your browser session cookie.

Example:

```bash
export BASE_URL="http://localhost:3000"
export SESSION_COOKIE="next-auth.session-token=your_session_cookie"
```

On PowerShell:

```powershell
$env:BASE_URL="http://localhost:3000"
$env:SESSION_COOKIE="next-auth.session-token=your_session_cookie"
```

### Resume upload

```bash
curl -X POST "$BASE_URL/api/resume" \
  -H "Cookie: $SESSION_COOKIE" \
  -F "file=@./resume.pdf"
```

### View latest uploaded resume

```bash
curl -i "$BASE_URL/api/resume/latest/view" \
  -H "Cookie: $SESSION_COOKIE"
```

### Create interview session

```bash
curl -X POST "$BASE_URL/api/interview/session" \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "type": "technical",
    "jdInfo": "Frontend React developer role with strong TypeScript skills"
  }'
```

### Submit interview answer

```bash
curl -X POST "$BASE_URL/api/interview/session/<sessionId>/answer" \
  -H "Cookie: $SESSION_COOKIE" \
  -F "transcript=I would break this problem into smaller components and optimize rendering carefully."
```

### Submit interview answer with video

```bash
curl -X POST "$BASE_URL/api/interview/session/<sessionId>/answer" \
  -H "Cookie: $SESSION_COOKIE" \
  -F "transcript=Here is my spoken answer." \
  -F "video=@./answer.webm"
```

### End interview session

```bash
curl -X POST "$BASE_URL/api/interview/session/<sessionId>/end" \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "reason": "manual"
  }'
```

### End interview session with final transcript or video

```bash
curl -X POST "$BASE_URL/api/interview/session/<sessionId>/end" \
  -H "Cookie: $SESSION_COOKIE" \
  -F "reason=manual" \
  -F "transcript=Final answer before ending the interview." \
  -F "video=@./final-answer.webm"
```

### Fetch interview report

```bash
curl "$BASE_URL/api/interview/session/<sessionId>/report" \
  -H "Cookie: $SESSION_COOKIE"
```

### Create Stripe checkout session

```bash
curl -X POST "$BASE_URL/api/billing/checkout" \
  -H "Cookie: $SESSION_COOKIE"
```

### Cancel Stripe subscription at period end

```bash
curl -X POST "$BASE_URL/api/billing/cancel" \
  -H "Cookie: $SESSION_COOKIE"
```

### Bootstrap Stripe product and price

This endpoint is protected by `x-billing-bootstrap-token`.

```bash
curl -X POST "$BASE_URL/api/billing/bootstrap" \
  -H "Content-Type: application/json" \
  -H "x-billing-bootstrap-token: your_bootstrap_token" \
  -d '{
    "productName": "MockAI Pro",
    "amountInCents": 1900,
    "currency": "usd",
    "interval": "month"
  }'
```

### Stripe webhook endpoint

Stripe should call this route directly:

```text
POST /api/billing/webhook
```

## Notes for Contributors

- The app validates environment variables on startup, so missing secrets will fail fast
- MongoDB access is centralized through reusable services and models
- The project currently uses `npm` with a checked-in `package-lock.json`
- The architecture is service-oriented inside a single Next.js codebase, which keeps page code thin and business rules centralized

## Future Improvement Ideas

- Add automated tests for service logic and route handlers
- Add background jobs for heavier AI processing workloads
- Persist richer analytics history for dashboard trend analysis
- Expand role-specific interview templates and reporting depth
- Add admin or coach workflows for multi-user review
