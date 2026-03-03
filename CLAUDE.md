# AIWaiter — Project Context for Claude

## What we're building
A SaaS product: an AI waiter specialized per restaurant for tourist restaurants.
Customers scan a QR code and chat with an AI trained on the restaurant's menu.

**Core value:**
- Understand dishes, answer questions (allergies, spicy, vegan…)
- Personalized recommendations
- Drink/dessert suggestions
- Auto language detection — responds in the customer's language
- No login required for customers
- Reduces pressure on staff, improves experience, increases average basket

## Stack
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS, tailwindcss-animate, clsx, class-variance-authority, lucide-react
- **Database:** Supabase (Postgres + pgvector + RLS + Auth)
- **AI:** OpenAI (GPT-4o for chat + vision, text-embedding-3-small for embeddings)
- **AI SDK:** Vercel AI SDK (`ai` package v6) for streaming
- **Hosting:** TBD (Vercel likely)

## UX/UI Standard
This is NOT a generic developer dashboard.
Target: **Stripe / Linear / Notion** level of polish.

Principles:
- Mobile-first
- Minimaliste, très lisible
- Generous spacing
- `rounded-2xl` everywhere
- Subtle, fluid, modern
- Zero friction

## Product Structure

### Customer side (`/[slug]`)
- No login required
- ChatGPT-style chat interface
- Collapsible menu panel visible in parallel
- Quick suggestion chips
- Auto language detection and response
- Fast and reliable

### Restaurant dashboard (`/dashboard`)
- Auth required (restaurant owner)
- Clean onboarding wizard
- Menu editor (categories, dishes, tags, allergens, pairings)
- Menu ingestion: upload PDF or photos → AI parses → structured JSON → embeddings
- Conversation viewer
- Clear analytics

## Architecture

### Multi-tenant
- Each restaurant is completely isolated
- Row-Level Security (RLS) on all tables
- Public access limited to restaurant slug

### Menu Ingestion Pipeline
1. Restaurant uploads PDF or image
2. System stores the file
3. Extracts text (PDF) or uses GPT-4o Vision (image/OCR)
4. LLM transforms to structured JSON (categories + dishes)
5. Stores in DB
6. Generates embeddings per dish (text-embedding-3-small, 1536 dims)
7. RAG is now active for that restaurant

### Chat Engine (RAG)
1. Customer sends message
2. Vector similarity search on menu_items embeddings
3. Build minimal context from relevant dishes
4. Call LLM with strict system prompt:
   - No hallucination
   - Respond in detected language
   - Soft upsell only
   - Allergen disclaimer when relevant
5. Stream response back

### Event Tracking
Everything tracked via `trackEvent(eventName, properties)`:
- `session_started`
- `menu_viewed`
- `dish_clicked`
- `message_sent`
- `recommendation_shown`
- `recommendation_clicked`

## Database Schema (already written)
Migration file: `supabase/migrations/001_initial_schema.sql`

Tables:
- `restaurants` — slug, name, owner_id, language_default
- `menu_categories` — linked to restaurant
- `menu_items` — with embedding vector(1536), tags[], allergens[], pairing_suggestions[]
- `chat_sessions` — per restaurant, stores detected language
- `chat_messages` — role: user | assistant
- `events` — analytics events with jsonb properties
- `ingestion_jobs` — tracks PDF/image upload pipeline status

All tables have RLS. Customers can insert sessions/messages/events without auth.

## Current Status

### Done
- [x] Project scaffolded (Next.js + Tailwind + Supabase + OpenAI)
- [x] Full DB schema with RLS
- [x] TypeScript types (`types/`)
- [x] Supabase client utils (`lib/supabase/`)
- [x] Module stubs (all empty, ready to implement)
- [x] CLAUDE.md (this file)

### Next Steps (in order)
1. **Get credentials from owner:** Supabase URL, anon key, service role key, OpenAI API key
2. **Wire up `.env.local`**
3. **Run Supabase migration** (`001_initial_schema.sql`)
4. **Implement core modules:**
   - `modules/events/tracker.ts` — trackEvent()
   - `modules/restaurants/queries.ts` — resolve restaurant by slug
   - `modules/chat/prompts.ts` — system prompt builder
   - `modules/chat/engine.ts` — RAG engine
   - `modules/menu/embeddings.ts` — generate + store embeddings
   - `modules/menu/parser.ts` — PDF/image ingestion pipeline
5. **Build customer chat UI** — `/[slug]` page
6. **Build restaurant dashboard** — auth, onboarding, menu editor, analytics
7. **Push to GitHub**

## Owner Preferences
- Wants a real product, not a side project
- Strong UX is strategic, not optional
- Claude should challenge decisions and propose better solutions
- No micro-management on tech — build together
- Communicates in French (but code/comments in English)
