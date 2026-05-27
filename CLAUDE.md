# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Design Besti (designbesti.com) — AI-powered design critique tool. "The senior design partner you can't afford." Repo: github.com/thata-ani/design-bestie. Live: designbesti.com.

## Critical Rules

1. **ALWAYS use Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — Sonnet causes 504 timeouts on Vercel free tier
2. **ALWAYS use pnpm** — never npm or yarn
3. **Test on localhost before pushing** — verify changes locally first
4. **Git tag working states** before major changes (pattern: `working-backup-may27`)
5. **.claude/ in .gitignore** — never commit Claude Code memory/state

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, Supabase auth + db + storage, Google OAuth, pnpm, Anthropic API, Framer Motion, Lenis, GSAP

Path alias `@/*` maps to repo root.

## Commands

- `pnpm dev` — run Next.js dev server
- `pnpm build` — production build (`next build`)
- `pnpm start` — serve the production build
- `pnpm lint` — `eslint .` (no test runner configured)

`next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so `pnpm build` will succeed even with TS errors. To type-check, run `pnpm exec tsc --noEmit` separately.

## Environment Variables

All three are required. The Supabase ones are read on both client and server; `ANTHROPIC_API_KEY` is server-only.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

## Supabase

**Project ID**: kaqrfaoqfxniqelemiyq

**Tables**:
- `usage` — tracks analysis usage per user
- `battles` — battle metadata (creator, challenger, status, winner)
- `battle_messages` — battle roasts and defenses

**Storage**:
- `battle-images` bucket (public) — stores battle uploads

## Third-Party Integrations

- **Microsoft Clarity** — ID: `wsdruf81ub`, script in `app/layout.tsx`
- **Mixpanel** — token: `aa410ec7b476534151c51328e2dc82cc`, `lib/mixpanel.ts`, `components/MixpanelProvider.tsx`
- **Sentry** — DSN: `https://77f6ee0780da50618a3a153c72219d58@o4511403839979520.ingest.us.sentry.io/4511403846860800`
- **Tally feedback** — form: `https://tally.so/r/Y5JYRW`, button on results page
- **OneSignal** — App ID: `9c3de50e-e4e1-4667-b3a1-f254def319c2`, service worker in `/public/OneSignalSDKWorker.js`

## Pricing Model

- **Guest (not logged in)**: 7 free analyses (localStorage key: `designBestiGuestCount`)
- **Free logged in**: 14 analyses/month (Supabase `usage` table)
- **Pro**: $9/month, unlimited (Stripe — not yet integrated)

## Features Built

### Core Analysis
- UX Audit with score, issues, wins, reading patterns, benchmark
- Stress Test (7 user personas)
- Roast Mode (brutal feedback)
- Stakeholder Translator (business risks, ROI matrix)
- Brief Mode (requirement → screens/states/edge cases)
- First 5 Seconds Test (first impression analysis)

### Results Page
`components/results/ResultsPage.tsx` — white theme, 35/65 split, zone-based click highlight, category rings, score animation. Mode components in `components/results/modes/`.

### Auth & Usage
- Google OAuth via Supabase (`contexts/AuthContext.tsx`)
- LoginModal mounted at root in `app/layout.tsx`
- UserMenu shown in all navbars when logged in
- UsageCounter component + pricing modal (`components/UsageCounter.tsx`, shows on all navbars)
- Private beta whitelist: `ALLOWED_EMAILS` in `middleware.ts` (currently: anirudh.thata@gmail.com)

### Design Roast Battle
Full feature: create, join, roast, defend, verdict. Battle page at `/battle/[slug]`. Lottie animations in `/public/`:
- `battle-waiting.json`, `battle-starting.json`, `battle-roasting.json`, `battle-defense.json`, `battle-ai-responds.json`, `battle-verdict.json`, `battle-winner.json`, `battle-loser.json`

Battle APIs: `app/api/battle/` (create, join, roast, defend, verdict). Supabase storage for images (`battle-images` bucket).

### Analytics
Microsoft Clarity, Mixpanel, Sentry, Tally, OneSignal all integrated.

### UI/UX
- **Homepage** (`app/page.tsx`) — BlastCanvas particles, 3D parallax hero, critique typewriter, scroll-snap service cards
- **Splash Screen** (`components/SplashScreen.tsx`) — first-visit-only, multilingual cycling words, logo reveal (persisted in sessionStorage)
- **Modal System** — `AnalyseModal.tsx` and `BriefModal.tsx` with dark-glass theme, drag/drop upload
- **No-flash transitions** — black-screen handoff between homepage and /analyse

## Key File Locations

- **Homepage**: `app/page.tsx`
- **Audit tool**: `app/analyse/page.tsx`
- **Results page**: `components/results/ResultsPage.tsx`
- **Mode components**: `components/results/modes/`
- **Usage counter + pricing modal**: `components/UsageCounter.tsx`
- **Battle page**: `app/battle/[slug]/page.tsx`
- **Battle APIs**: `app/api/battle/`
- **Analysis API**: `app/api/analyse/route.ts`
- **Scoring engine**: `lib/scoringEngine.ts`
- **Benchmark engine**: `lib/benchmarkEngine.ts`
- **Analytics**: `lib/mixpanel.ts`, `components/MixpanelProvider.tsx`
- **Auth middleware**: `middleware.ts` (ALLOWED_EMAILS whitelist array)
- **Supabase browser client**: `lib/supabase/client.ts`
- **Supabase server client**: `lib/supabase/server.ts`

## Architecture

### Two-Layer Auth/Gating

1. **Edge middleware** (`middleware.ts`) runs on every page route (to keep Supabase session fresh) and on all `/api/{analyse,stress,roast,stakeholder,firstfive,brief}` routes (to enforce auth). Protected API calls without a session return `401 { error: "auth_required" }`. There is also a **private-beta whitelist** — `ALLOWED_EMAILS` in `middleware.ts`. When non-empty, only those emails can hit protected APIs (returns `403 not_allowed`); when empty, any signed-in user passes. Toggle beta access by editing this array.

2. **Client gating** via `useGatedAction` (`hooks/useGatedAction.ts`) wraps any handler so it opens the login modal instead of firing when the user is signed out. Use it for buttons that trigger protected APIs so users hit the modal before the network round-trip. Auth state lives in `contexts/AuthContext.tsx` (Google OAuth via Supabase, redirect through `/auth/callback`). `app/layout.tsx` mounts `<AuthProvider>` and `<LoginModal>` at the root.

If you add a new protected API route, update **both** `PROTECTED_API_ROUTES` and the `matcher` in `middleware.ts`.

### Supabase Clients — Pick the Right One

- `lib/supabase/client.ts` — browser (`createBrowserClient`). Use in client components.
- `lib/supabase/server.ts` — server (`createServerClient` with `next/headers` cookies). Use in route handlers / server components. Returns a `Promise` — `await createClient()`.
- `middleware.ts` instantiates its own server client because it needs the request/response cookie plumbing.

### AI Route Handlers — Shared Shape

`app/api/{analyse,stress,roast,stakeholder,firstfive,brief}/route.ts` are all variations on the same template:

- `export const maxDuration = 60` (Vercel function timeout)
- POST → call Anthropic Messages API directly via `fetch` (no SDK) with `model: "claude-haiku-4-5-20251001"`
- Each prompt **embeds a strict JSON schema** in the user message and asks for raw JSON (no markdown)
- The handler strips ` ```json ` fences and falls back to slicing at the last `}` if `JSON.parse` fails
- `analyse` accepts `{ imageBase64, mimeType, context? }` (context is optional designer-supplied string)
- Other routes accept their specific inputs

When editing prompts, the JSON shape in the prompt and the keys the frontend reads must stay in sync — the parser does no schema validation, missing fields just become `undefined`.

### Scoring Pipeline (analyse only)

`/api/analyse` is the only route that runs deterministic post-processing on the model output:

1. Claude returns issues with a `type` field constrained to one of: `missing_cta`, `low_contrast`, `too_many_cta`, `cluttered_layout`, `poor_spacing`, `other`
2. **Type normalization** — the route validates types against the allowed list and defaults invalid types to `"other"`
3. `lib/scoringEngine.ts` maps each `type` to a fixed point deduction and category (clarity / hierarchy / accessibility / cognitive_load / consistency), starting from 100
4. **The overall_score returned to frontend ALWAYS comes from scoringEngine.ts** — never from Claude's score
5. `lib/benchmarkEngine.ts` turns the score + issue types into a percentile-style benchmark string and message

Both functions are pure and table-driven — to tune scoring, edit the `DEDUCTIONS` / `CATEGORY_MAX` tables, not the call sites. The other AI routes do **not** go through this pipeline; they return Claude's JSON as-is.

### Zone-Based Highlighting System

The results page uses a 3×3 grid system for highlighting issues on the uploaded image:

- **ZONE_HIGHLIGHT** — maps zone names to `{ top, left, width, height }` percentages
- **ZONE_POSITIONS** — maps zone names to center positions for numbered dots
- Valid zones: `top-left`, `top-center`, `top-right`, `mid-left`, `mid-center`, `mid-right`, `bottom-left`, `bottom-center`, `bottom-right`
- Each issue has a `zone` field that determines where its dot appears
- Clicking an issue card highlights the zone with a dark overlay + colored box shadow
- Prompt explicitly constrains Claude to use only these 9 zone values

### Results Page Structure

`components/results/ResultsPage.tsx`:
- Left column (35%): score + benchmark, category rings, uploaded image with dots and highlights
- Right column (65%): verdict, mode tabs, scrollable mode content
- Mode components in `components/results/modes/`:
  - `AnalyseResults.tsx` — issues and wins with filters
  - `RoastResults.tsx` — brutal feedback
  - `StressResults.tsx` — persona-based testing
  - `StakeholderResults.tsx` — business translation
  - `FirstFiveResults.tsx` — first impression analysis

When an issue is clicked:
- `activeIssueId` state updates
- Zone highlight appears with boxShadow trick: `0 0 0 9999px rgba(0,0,0,0.45), 0 0 0 3px ${color}`
- Image container scrolls to show the active dot
- Numbered dots dim except the active one

### UI Structure

- **`app/page.tsx`** — marketing homepage. Single client component with particle `BlastCanvas`, 3D-parallax hero card, critique typewriter, scroll-snap service cards, and CTAs that open analyse/brief modals. Uses `lenis` (smooth scroll) and `gsap` + `ScrollTrigger` (scroll-driven reveals) — both dynamic-imported. Returns fullscreen `#08090F` div until mount effect resolves.

- **`app/analyse/page.tsx`** — the audit tool (single ~1200-line client component holding home, analysing, results, briefing, stress, roast, and stakeholder screens). On mount reads `sessionStorage` keys `designBestiPendingAnalyse` / `designBestiPendingBrief`, hydrates state, jumps to appropriate screen. Direct navigation lands on `HomeScreen`. Renders fullscreen `#08090F` div until `bootChecked` flips.

- **`components/AnalyseModal.tsx` / `components/BriefModal.tsx`** — overlays on homepage. On submit, stashes data into `sessionStorage` and `window.location.href = '/analyse'`. A `navigating` state replaces modal with fullscreen `#08090F` cover before navigation.

- **`components/SplashScreen.tsx`** — first-visit-only splash. Cycles "Design Besti" through 13 languages, reveals logo, zoom-dissolves into homepage. Persistence via `sessionStorage` key `designBestiSplashSeen`.

- **`<html>` and `<body>`** forced to `background: #08090F` in `app/layout.tsx` so hard navigations never flash white.

- **`components/ui/*`** is shadcn/ui (style: "new-york", icons: lucide). Don't hand-roll primitives — extend existing ones.

- **Tailwind v4** with `@tailwindcss/postcss`; design tokens in `app/globals.css`.

### Modal → /analyse Handoff (No-Flash Chain)

Three independent dark-cover gates ensure no homepage frame is visible after modal submit:

1. Modal flips `navigating=true` → renders fullscreen `#08090F` div instead of card
2. Hard navigation begins; `<html>`/`<body>` already `#08090F` so even raw browser paint stays dark
3. `/analyse` first render returns `#08090F` div (`!bootChecked`), then in single batched effect: reads `sessionStorage`, hydrates state, calls `setScreen("analysing"|"briefing")`, sets `bootChecked=true`. Render-2 is the analysing screen.

Touching any of these three gates — modal `navigating`, layout body bg, or `/analyse` `bootChecked` — risks reintroducing the flash.

## Vercel

vercel.com/anirudhthata-3305s-projects/design-bestie

## Whitelist Email

anirudh.thata@gmail.com

## Immediate Priorities (in order)

1. **Lock Pro features** — Roast, Stress, Stakeholders, First 5s, Roast Battle show locked for free users
2. **Stripe payment integration**
3. **Prompt rewrite** — consistent results, same image = same issues
4. **SEO** — meta tags, og images, sitemap
5. **Product Hunt launch prep**
6. **Email automation** — AI agent for newsletters, no manual input
7. **Social media automation** — AI agent for posts and promotions
8. **Announcement bar**
9. **Shareable results card**

## Feature Roadmap

- **Conversion Predictor** — multi-screen upload, predicts drop-off
- **Design Memory** — version comparison
- **Accessibility Lawsuit Risk Score**
- **Design Trend Detector**
- **Honest Portfolio Reviewer**
- **Presentation Generator** — analysis to PDF + PPTX deck
- **Figma plugin**
- **Hand Gesture Control** — wave to navigate slides (MediaPipe)
- **Debate Mode**
- **Brief Translator for PMs**
- **Design DNA**

## Infrastructure Roadmap

- **Figma MCP integration** — design system checking (post-paywall Pro only)
- **Team collaboration**
- **Jira + Notion integration**

## Session Log

**2026-05-27**: Design Roast Battle complete — full feature with create, join, roast, defend, verdict flow. Battle page at /battle/[slug] with white theme, Lottie animations, expandable roast messages, WinnerCertificate with watermark + trophy seal. Supabase storage for battle images. All analytics integrated (Clarity, Mixpanel, Sentry, Tally, OneSignal). UsageCounter + pricing modal live on all navbars. CLAUDE.md rewritten with current state.
