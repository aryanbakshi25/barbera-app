# AGENTS.md

> Navigation guide for AI agents working in this codebase.

## Project Context

Barbera is a barber-client marketplace. Barbers manage portfolios, services, and availability. Customers discover barbers, book appointments, and pay via Stripe Connect. Built with Next.js 15 App Router, React 19, TypeScript, Supabase, and Stripe.

## Directory Map

```
src/
├── app/                    # Pages and API routes (App Router)
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout (fonts, metadata, Toaster)
│   ├── globals.css         # All custom CSS (not modular)
│   ├── [username]/         # Dynamic barber/customer profile (SERVER component)
│   ├── discover/           # Barber listing grid
│   ├── dashboard/          # Appointment history (role-aware)
│   ├── account/            # Profile editing, services, availability, Stripe setup
│   ├── login/ signup/      # Auth pages
│   ├── complete-profile/   # Post-signup profile completion gate
│   ├── reset-password/     # Request password reset
│   ├── update-password/    # Set new password after reset link
│   ├── ar-hair-filter/     # Placeholder (coming soon)
│   ├── payment-success/    # Post-payment confirmation
│   ├── stripe/return/      # Stripe Connect onboarding return
│   ├── auth/callback/      # Supabase auth code exchange
│   └── api/                # Route Handlers (REST endpoints)
│       ├── create-payment-intent/   # Stripe Connect destination charge
│       ├── create-checkout-session/ # Alternative Stripe Checkout flow
│       ├── create-appointment/      # Insert appointment after payment
│       ├── verify-session/          # Verify Stripe Checkout session
│       ├── webhook/                 # Stripe webhook handler
│       └── stripe-connect/          # onboard/ and dashboard/ for Connect
└── components/             # Reusable React components (all client)
    ├── BookingModal.tsx     # Multi-step booking wizard (service→date→time→pay)
    ├── PaymentForm.tsx      # Stripe Elements card form
    ├── PortfolioGrid.tsx    # Portfolio media display with lightbox
    ├── PortfolioUpload.tsx  # Multi-file upload to Supabase Storage
    ├── ServicesManager.tsx  # CRUD for barber services
    ├── AvailabilityManager.tsx # Weekly schedule editor
    ├── Navbar.tsx           # Global nav (auth-aware)
    ├── BarberCard.tsx       # Card for discover grid
    └── ...Wrapper/Button components
```

## Key Patterns

### Supabase Client Creation
- **Client components:** `createBrowserClient(URL, ANON_KEY)` from `@supabase/ssr`
- **Server components:** `createServerComponentClient({ cookies })` from `@supabase/auth-helpers-nextjs`
- **API routes (needs RLS bypass):** `createClient(URL, SERVICE_ROLE_KEY)` from `@supabase/supabase-js`

### Data Access
- Client components query Supabase directly (RLS enforces authorization)
- API routes use service role key to bypass RLS for cross-user operations
- No ORM or query builder abstraction — all raw Supabase client calls

### Styling
- `globals.css` contains all custom class-based styles (`.hero`, `.features-grid`, `.profile-container`, etc.)
- Tailwind utility classes used inline alongside custom classes
- Inline `style={{}}` objects used extensively in components (no CSS modules)

### Payment Flow
- Uses Stripe Connect **destination charges** — customer pays platform, platform transfers to barber minus fee
- Platform fee: `PLATFORM_FEE_PERCENT` env var (default 5%)
- Dual appointment creation: client-side POST after payment + webhook backup (deduplication via `payment_intent_id`)

## Database Tables

`profiles` · `services` · `availability` · `posts` · `appointments` · `reviews`

- `availability` uses `UNIQUE(user_id, day_of_week)` — one entry per barber per day
- `posts.images` is JSONB array (migrated from single `image_url` field)
- All UUIDs reference `auth.users(id)` as the identity source

## Deviations from Defaults

- **No Next.js middleware** — auth checks happen inside each page/component individually
- **No generated Supabase types** — interfaces are hand-written per component
- **Two Supabase auth packages coexist** — `@supabase/ssr` (newer) and `@supabase/auth-helpers-nextjs` (legacy, used only in `[username]/page.tsx`)
- **No test framework** — no Jest, Vitest, or testing-library installed
- **Stripe API version `2025-06-30.basil`** — newer/beta Stripe API version

## Config Files

| File | Notes |
|------|-------|
| `next.config.ts` | Image remote patterns (Supabase hostname), COEP header |
| `eslint.config.mjs` | Flat config, extends `next/core-web-vitals` + `next/typescript` |
| `postcss.config.mjs` | Only `@tailwindcss/postcss` plugin |
| `tsconfig.json` | Path alias `@/*` → `./src/*`, bundler module resolution |

## SQL Migrations

Located in project root (run manually in Supabase SQL editor):
- `database_migration.sql` — adds `images` JSONB column to posts
- `availability_table_update.sql` — creates availability table with RLS
- `stripe_payment_migration.sql` — adds payment tracking to appointments

## Detailed Documentation

For deeper information, see `.agents/summary/`:
- `index.md` — documentation navigation guide
- `architecture.md` — system design and rendering strategy
- `components.md` — all components with behaviors
- `interfaces.md` — API route schemas
- `data_models.md` — full ER diagram and constraints
- `workflows.md` — business flow diagrams
- `dependencies.md` — package analysis

## Custom Instructions

<!-- This section is maintained by developers and agents during day-to-day work.
     It is NOT auto-generated by codebase-summary and MUST be preserved during refreshes.
     Add project-specific conventions, gotchas, and workflow requirements here. -->
