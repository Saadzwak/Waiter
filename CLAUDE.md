# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What we're building

AIWaiter — a SaaS AI waiter specialized per restaurant, primarily for tourist restaurants. Customers scan a QR code at the table and chat with an AI trained on that restaurant's menu. No login for customers. Owners manage menus and see analytics in a dashboard.

Core value: understand dishes, answer dietary/allergen questions, personalized recommendations, drink/dessert pairings, auto language detection.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**, path alias `@/*` → repo root
- **Tailwind CSS** + `tailwindcss-animate`, `clsx`, `tailwind-merge` (`cn()` helper in `lib/utils.ts`)
- **Supabase** (Postgres + pgvector + RLS + Auth) via `@supabase/ssr`
- **OpenAI**: `gpt-4o` (chat + vision), `text-embedding-3-small` (1536 dims), `whisper-1` (chef voice notes), `gpt-4o-mini` (language detection, insights)
- **Vercel AI SDK v6** (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`) for streaming chat
- **Resend** for transactional email (contact form)
- **Tavily** (optional) for the chat `searchWeb` tool — requires `TAVILY_API_KEY`
- **pdf-parse** for PDF menu extraction (declared in `serverExternalPackages` in `next.config.ts`)

## Commands

```bash
npm run dev       # Next.js dev server
npm run build     # production build (also type-checks)
npm run start     # run built app
npm run lint      # next lint (eslint-config-next)
```

No test suite is configured.

## Environment variables

Copy `.env.local.example` then add:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # used by admin client — server-only
OPENAI_API_KEY=
TAVILY_API_KEY=                  # optional — enables searchWeb in chat
RESEND_API_KEY=                  # optional — enables contact form email
CRON_SECRET=                     # required to call /api/cron/insights
```

## High-level architecture

### Request trust levels — THREE Supabase clients, do not mix them up

- `lib/supabase/client.ts` → **browser client**. Anon key. Client components only.
- `lib/supabase/server.ts` → **SSR client** with cookie-based auth. Use in Server Components, Server Actions, and API routes that act on behalf of a logged-in owner. Enforces RLS as the authenticated user.
- `lib/supabase/admin.ts` → **service role client** (`createAdminClient`). Bypasses RLS. Server-only. Used by public customer routes (`/api/chat`, `/api/session`, `app/[slug]/page.tsx`) and background pipelines (menu ingestion, insights cron) where there is no authenticated user.

The multi-tenant RLS rules in `supabase/migrations/001_initial_schema.sql` give each owner exclusive write access to their data, allow public SELECT on `restaurants` / `menu_categories` / `menu_items`, and allow public INSERT on `chat_sessions` / `chat_messages` / `events` so unauthenticated customers can use the chat.

### `proxy.ts` IS the middleware

Next.js 16 renamed `middleware.ts` to `proxy.ts`. The file at repo root (`proxy.ts`, exports `proxy()` and `config`) is the auth middleware:
- Refreshes the Supabase session cookie on every non-asset, non-API request
- Redirects `/dashboard/*` → `/login` when logged out
- Redirects `/login` and `/signup` → `/dashboard` when logged in

Do NOT create a `middleware.ts` — it won't run. Always call `supabase.auth.getUser()` (never `getSession()`) per the comment in `proxy.ts` (spoofing risk).

### Route groups

- `app/(auth)/login`, `app/(auth)/signup` — auth pages
- `app/(dashboard)/dashboard/*` — owner dashboard, wrapped by `app/(dashboard)/layout.tsx` which gates on `supabase.auth.getUser()` and renders the `Sidebar`
- `app/[slug]/page.tsx` — public customer chat page (no auth)
- `app/api/*` — route handlers
- `app/actions/*` — Server Actions (`"use server"`). Form state follows the `{ error?: string, ... }` pattern consumed by `useActionState`. Use `revalidatePath()` after mutations.
- `app/_home/*` — marketing homepage components (used by `app/page.tsx`)

### Multi-restaurant support

One owner can own multiple restaurants. The active one is tracked in the `selected_restaurant` cookie (httpOnly, lax). `modules/dashboard/queries.ts::getSelectedRestaurant(userId)` reads the cookie, falls back to the oldest restaurant. `Sidebar.tsx` renders a switcher calling the `switchRestaurant(id)` Server Action. `lib/restaurant-context.ts::getSelectedRestaurantId()` is the low-level cookie reader.

### Menu ingestion pipeline (async, fire-and-forget)

1. Owner uploads PDF/image via `MenuUploader.tsx` → file goes to Supabase Storage bucket `menu-uploads`.
2. `POST /api/menu/ingest` verifies ownership, creates an `ingestion_jobs` row, calls `ingestMenu()` **without awaiting** (fire-and-forget), returns `jobId`.
3. Client polls `GET /api/menu/job/[jobId]` every 2s.
4. `modules/menu/parser.ts`: PDF → text via `pdf-parse` | Image → GPT-4o Vision → GPT-4o (JSON mode) extracts categories/items → rows inserted → `embedMenuItem()` called serially for each item.
5. For **image menus only**, Vision is also asked to return normalized bboxes for each dish's photo. `modules/menu/images.ts::cropAndSaveDishImage()` uses `sharp` to crop those regions into WebP and upload them to the `dish-images` bucket. Failures here are swallowed — best-effort, owner can always upload manually.
6. `generateMealCombinations()` kicks off in the background from the parser; failure is swallowed on purpose — it must not fail the ingest.
7. If ingest throws, `/api/menu/ingest` removes the source file from `menu-uploads` to avoid orphan objects.

**Re-embedding invariant:** in `updateItem` (`app/actions/menu.ts`), when name/description changes the code sets `embedding = null` AND calls `scheduleReembed(id)` (fire-and-forget) to regenerate the embedding. If you add a new path that mutates fields used by `buildEmbeddingText()` (name/description/tags/allergens/pairings), call `scheduleReembed()` to keep RAG consistent.

### Chat engine (cross-lingual RAG) — `modules/chat/engine.ts`

Per user message:
1. `detectLanguageAndTranslate()` (gpt-4o-mini, JSON mode) returns `{ userLanguage, queryForEmbedding }`. The query is translated to the **menu's** language before embedding — this is what makes RAG work cross-lingually (menu stored in FR, customer asks in JA).
2. Embed the translated query, call `match_menu_items` RPC (cosine similarity, top 6, `available = true`, `embedding is not null`).
3. Filter matches below `SIMILARITY_THRESHOLD = 0.3` to prevent hallucinating off-topic context.
4. Also fetch currently-unavailable items so the AI can say "sold out tonight" gracefully instead of silently ignoring them.
5. `modules/chat/prompts.ts::buildSystemPrompt()` — hard-locks output language to `userLanguage`, enforces no hallucination, price integrity, allergen safety. **Also instructs the model to append `[[dish:<id>]]` on its own line after recommending a specific dish from the context.** The dish id is shown in the MENU section as `id=\`...\``.
6. `streamText` with `gpt-4o`, `stopWhen: stepCountIs(3)`, one tool: `searchWeb` (Tavily) for culinary context the menu doesn't cover.
7. Returns `{ stream, analytics }`. `/api/chat` fires `trackEvent("message_sent", {...analytics, hour, day_of_week, message_index})` without awaiting, then returns `stream.toUIMessageStreamResponse()`. The route **validates `sessionId` is a UUID**; invalid ids drop analytics rather than failing the insert.

**Dish card protocol:** `app/[slug]/ChatInterface.tsx` parses assistant text and replaces complete `[[dish:<uuid>]]` tokens with an inline `DishCard` (image, name, price, tags, allergens). Partial tokens during streaming stay as text until the closing `]]` arrives — never renders half-parsed cards. Card data is looked up client-side from the `items` prop loaded server-side by `app/[slug]/page.tsx`.

If you change the analytics shape, update `modules/insights/analyzer.ts` — it reads `properties.userQuery`, `userLanguage`, `matchedItems`, `topSimilarity`, `hour`.

### Insights pipeline

- `app/api/cron/insights/route.ts` — GET, gated by `Authorization: Bearer ${CRON_SECRET}`. Iterates all restaurants with `Promise.allSettled`. Scheduled daily at 02:00 UTC via `vercel.json`.
- `app/api/insights/generate/route.ts` — on-demand from the dashboard (owner-authenticated).
- `modules/insights/analyzer.ts` aggregates event properties **before** sending to GPT (never raw rows), requires ≥5 enriched events (those with `userQuery` set), upserts into `insights` keyed by `(restaurant_id, analysis_date, period)`.

### Chef voice notes — `app/api/menu/voice-note/route.ts`

Whisper-1 transcribes an audio blob. If `item_id` is passed, save directly to `chef_notes`. Otherwise GPT-4o matches the transcript to an existing menu item from a `id | name` list and saves cleaned notes. These notes are injected into the chat system prompt when the dish matches a RAG hit (see `buildSystemPrompt` "Chef's notes").

### Events

Single sink: `modules/events/tracker.ts::trackEvent()` → `events` table (jsonb `properties`). Event names are enumerated in `types/events.ts`. Chat-route tracking is always fire-and-forget with `.catch(console.error)`.

## Database migrations

In `supabase/migrations/`. Apply in filename order. **Two files share the `003_` prefix** (`003_chef_notes.sql` and `003_contact_leads.sql`) — they touch different tables and both must be applied. `003_chef_notes.sql` drops and recreates the `match_menu_items` RPC to include `chef_notes`; `005_dish_images.sql` drops and recreates it again to include `id` + `image_url` (required by the dish-card UI). Any change to what RAG needs from menu items requires another drop+recreate here.

**Storage buckets** (create via the Supabase dashboard or SQL — not tracked in migrations because they live under the `storage` schema):
- `menu-uploads` — PDFs/images uploaded by owners, read by ingest
- `logos` — restaurant logos, public read
- `dish-images` — auto-cropped or manually-uploaded dish photos, public read, authenticated-or-service-role write. The SQL snippet is commented in `005_dish_images.sql`.

## UX / UI standard

Not a generic dev dashboard. Target polish level: **Stripe / Linear / Notion**.
- Mobile-first, generous spacing, `rounded-2xl` everywhere
- Subtle, fluid, modern; zero friction
- Emerald accents (primary CTA), amber accent reserved for "Service" mode

## Conventions

- **Code and comments in English.** UI copy may be English or French.
- Prefer editing modules under `modules/<domain>/` over adding new top-level files. `types/` re-exports via `types/index.ts`.
- When adding a new customer-facing (unauthenticated) DB access path, use `createAdminClient()` and double-check it aligns with the RLS policies in `001_initial_schema.sql`.
- Server Actions: return `{ error?: string }` shapes and consume with `useActionState`; call `revalidatePath()` to refresh.
