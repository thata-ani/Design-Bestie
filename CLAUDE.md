# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Design Besti** — AI design critique tool  
**Website**: designbesti.com  
**Tagline**: "The senior design partner you can't afford"  
**Repository**: github.com/thata-ani/design-bestie

Design Besti analyzes UI screenshots and provides professional design feedback across multiple modes: UX Audit, Roast Mode, Stress Test, Stakeholder Translator, Brief Mode, and First 5 Seconds Test.

## Stack

- **Next.js 16** App Router + React 19 + TypeScript
- **Vercel** — free tier deployment
- **Claude Haiku 4.5** — `claude-haiku-4-5-20251001` (NEVER use Sonnet — causes 504 timeouts)
- **Supabase** — auth + database (Google OAuth)
- **pnpm** — package manager (NEVER use npm or yarn)
- **Anthropic Messages API** — direct fetch calls, no SDK
- **Framer Motion** — animations
- **shadcn/ui** — UI components ("new-york" style, lucide icons)
- **Tailwind v4** — styling with `@tailwindcss/postcss`
- **Lenis** — smooth scroll (homepage)
- **GSAP + ScrollTrigger** — scroll animations (homepage)
- **Microsoft Clarity** — analytics (ID: wsdruf81ub)

Path alias `@/*` maps to repo root.

## Critical Rules

1. **ALWAYS use Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — Sonnet causes 504 timeouts
2. **ALWAYS use pnpm** — never npm or yarn
3. **Test on localhost before pushing** — verify changes locally first
4. **Git tag before major changes** — create tags for significant releases
5. **Scores ALWAYS come from scoringEngine.ts** — never use Claude's score directly

## Commands

- `pnpm dev` — run Next.js dev server
- `pnpm build` — production build (`next build`)
- `pnpm start` — serve the production build
- `pnpm lint` — `eslint .` (no test runner configured)

`next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so `pnpm build` will succeed even with TS errors. To type-check, run `pnpm exec tsc --noEmit` separately.

## Required Environment Variables

All three are required. The Supabase ones are read on both client and server; `ANTHROPIC_API_KEY` is server-only.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

## Features Built

### Core Analysis
- UX Audit with score, issues, wins, reading patterns, benchmark
- Score animation (count-up effect)
- Category breakdown rings (5 categories: Usability, Accessibility, Visual, Hierarchy, Cognitive)
- Zone-based issue highlighting on uploaded design
- Issue cards with expand/collapse
- Priority fixes section

### Additional Modes
- **Roast Mode** — brutal, no-holds-barred feedback
- **Stress Test** — 7 user personas (first-timer, power user, accessibility user, older user, distracted user, mobile user, non-native speaker)
- **Stakeholder Translator** — converts UX issues into business risks, ROI matrix, sprint-ready tickets
- **Brief Mode** — paste requirements, get screens, states, edge cases, questions to ask
- **First 5 Seconds Test** — captures first impression, noticed/missed elements, attention score

### UI/UX
- **Homepage** — `app/page.tsx` with BlastCanvas particles, 3D parallax hero, critique typewriter, scroll-snap service cards
- **Splash Screen** — first-visit-only, multilingual cycling words, logo reveal, zoom dissolve (persisted in sessionStorage)
- **Results Page** — `components/results/ResultsPage.tsx`
  - White theme, 35/65 left/right split
  - Left: score block, category rings, uploaded image with zone highlights
  - Right: verdict, mode tabs, scrollable content
  - Zone-based highlighting using ZONE_HIGHLIGHT (3×3 grid) and ZONE_POSITIONS
  - Numbered dots on image for each issue
  - Click issue card → highlight zone + scroll to dot
- **Modal System** — `AnalyseModal.tsx` and `BriefModal.tsx` with dark-glass theme, drag/drop upload
- **No-flash transitions** — black-screen handoff between homepage and /analyse

### Auth & User
- **Google OAuth** via Supabase
- **AuthContext** — `contexts/AuthContext.tsx`
- **LoginModal** — mounted at root in `app/layout.tsx`
- **UserMenu** — shown in all navbars when logged in
- **Private beta whitelist** — `ALLOWED_EMAILS` in `middleware.ts` (currently: anirudh.thata@gmail.com)

### Analytics & Tracking
- **Microsoft Clarity** — tracking script in `app/layout.tsx` (ID: wsdruf81ub)
- **Vercel Analytics** — production only

### Placeholders
- **Announcement bar** — placeholder ready for implementation

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

## Pricing

**Free Tier**: 3 analyses (testing phase)  
**Starter**: $9/month — 30 analyses  
**Pro**: $19/month — unlimited analyses

Pro-only features (to be locked):
- Roast Mode
- Stress Test
- Stakeholder Translator
- First 5 Seconds Test

## Immediate Priorities

1. **3 free analyses limit + paywall modal**
2. **Lock Pro features** (Roast, Stress, Stakeholders, First 5s)
3. **Prompt rewrite for consistent results** (determinism)
4. **Mixpanel analytics**
5. **Sentry error tracking**
6. **Tally feedback button**
7. **OneSignal push notifications**
8. **Announcement bar** (implementation)
9. **Stripe payment integration**
10. **SEO optimization**
11. **Product Hunt launch**
12. **Email automation**
13. **Shareable results card**

## Future Feature Roadmap

- **Debate Mode** — argue with the AI about design decisions
- **Conversion Predictor** — multi-screen upload, predict conversion flow
- **Design Memory** — version comparison, track design evolution
- **Presentation Generator** — export to PDF + PPTX
- **Design Roast Battle** — competitive design critique
- **Brief Translator for PMs** — translate PM-speak to design requirements
- **Design Trend Detector** — identify trends in uploaded designs
- **Design DNA** — unique design fingerprint analysis
- **Accessibility Lawsuit Risk Score** — legal compliance assessment
- **Honest Portfolio Reviewer** — brutal portfolio feedback
- **Figma plugin** — analyze designs directly from Figma
- **Team collaboration** — shared workspaces, comments
- **Hand Gesture Control** — MediaPipe integration for gesture-based navigation
- **Homepage redesign** — refresh landing page experience

## Marketing Automation

### AI Newsletter Agent
- Fully automated newsletter generation and scheduling
- No manual input required
- Scheduled sends based on content calendar

### AI Social Media Agent
- Automated social media posts and promotions
- Cross-platform distribution (Twitter, LinkedIn, etc.)
- Content generated based on product updates and analytics
- Fully autonomous operation

## Tools Installed

- **UI/UX Pro Max plugin** — design standards database (50+ styles, 161 color palettes, 57 font pairings, 99 UX guidelines)
- **21st.dev Magic MCP** — needs API key fix
- **Framer Motion** — animation library
- **shadcn/ui** — component library

## Deployment

**Vercel**: vercel.com/anirudhthata-3305s-projects/design-bestie  
**Supabase Project ID**: kaqrfaoqfxniqelemiyq  
**Whitelist Email**: anirudh.thata@gmail.com

## Session Log

**2026-05-17**: Results page redesign complete — zone-based highlighting with ZONE_HIGHLIGHT/ZONE_POSITIONS, click-to-highlight with scroll-to-dot, category rings animation, white theme 35/65 split. Added Microsoft Clarity tracking (ID: wsdruf81ub). Prompt improvements for deterministic zone values. UserMenu added to all navbars. Scores now always come from scoringEngine.ts. Type normalization added to /api/analyse route.
