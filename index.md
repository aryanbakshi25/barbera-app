# Barbera Documentation Index

## How to Use This Documentation

This directory contains structured documentation about the Barbera codebase. **This file (`index.md`) is the primary entry point** — it contains enough context for an AI assistant to determine which detailed file to consult for any given question.

### Quick Reference

| Question Type | Consult |
|---------------|---------|
| "How is the app structured?" | [architecture.md](./architecture.md) |
| "What does component X do?" | [components.md](./components.md) |
| "How does the API work?" | [interfaces.md](./interfaces.md) |
| "What's the database schema?" | [data_models.md](./data_models.md) |
| "How does booking/payment work?" | [workflows.md](./workflows.md) |
| "What libraries are used?" | [dependencies.md](./dependencies.md) |
| "Tech stack overview?" | [codebase_info.md](./codebase_info.md) |

---

## Project Summary

**Barbera** is a barber-client marketplace built with Next.js 15 (App Router), React 19, TypeScript, Supabase (auth + PostgreSQL + storage), Stripe Connect (payments), and Tailwind CSS. Deployed on Vercel.

**Two user roles:** Barbers (manage portfolios, services, availability, accept payments) and Customers (discover barbers, book appointments, pay).

---

## File Summaries

### codebase_info.md
High-level project metadata: tech stack table, directory tree (Mermaid), user roles, feature list, environment variables. Start here for orientation.

### architecture.md
System design and key decisions:
- Client/server rendering split (which pages are SSR vs CSR)
- Authentication architecture (Supabase SSR cookies, auth callback flow)
- Data access patterns (client-side RLS queries vs. service-role API routes)
- Payment architecture (Stripe Connect destination charges, platform fee model)
- Architectural decisions (no ORM, no middleware, inline styles + Tailwind mix)

### components.md
All React components with their paths, types (client/server), purposes, and key behaviors. Includes a component relationship diagram showing how BookingModal depends on PaymentForm, wrappers delegate to core components, etc.

### interfaces.md
Complete API route documentation:
- 7 API endpoints with request/response schemas
- Auth callback route
- Client-side Supabase table access patterns
- Which tables are accessed from which components

### data_models.md
Database schema (ER diagram):
- 6 tables: profiles, services, availability, posts, appointments, reviews
- Column types, constraints, RLS policies
- Relationships and foreign keys
- Supabase Storage bucket usage

### workflows.md
Business process flows (sequence and flowchart diagrams):
- Booking & payment flow (the core user journey)
- User registration and profile completion
- Barber onboarding (services + availability + Stripe Connect)
- Time slot calculation algorithm
- Portfolio upload flow
- Password reset flow

### dependencies.md
All npm packages with versions and purposes, external services map, dependency relationships, and notable patterns (no tests, no state management, dual Supabase auth patterns).

---

## Key Entry Points for Development

| Task | Start At |
|------|----------|
| Add a new page | `src/app/` (create directory with `page.tsx`) |
| Add a new API endpoint | `src/app/api/` (create directory with `route.ts`) |
| Create a reusable component | `src/components/` |
| Modify database schema | SQL migration file in project root + Supabase SQL editor |
| Change styling | `src/app/globals.css` or Tailwind classes inline |
| Configure environment | `.env.local` (see codebase_info.md for variable list) |
| Stripe integration changes | `src/app/api/` routes + `src/components/PaymentForm.tsx` |
