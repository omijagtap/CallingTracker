# Project structure and conventions

This document explains where files live and how to extend the project safely.

Top-level folders
- src/            Application code
- src/app/        Next.js App Router (routes, layouts, pages)
- src/components/ UI components
  - ui/           Re-usable UI primitives (buttons, inputs, dialogs)
  - app/          Feature-specific UI used by this app
- src/lib/        Shared utilities, types, server actions
- src/hooks/      React hooks
- src/ai/         Genkit/AI-related code
- public/         Static assets served as-is
- .next/          Build/dev output (ignored)
- email_report.py Python CLI for CSV processing and email sending (no Node required)
- docs/           Documentation

Recommended file placement
- New pages: src/app/<route>/page.tsx (Optionally layout.tsx for nested layouts)
- New re-usable component: src/components/ui/<name>.tsx
- Feature-specific component: src/components/app/<feature>/<name>.tsx
- Shared utilities: src/lib/utils.ts (or split by domain in src/lib/<domain>/...)
- Types: src/lib/types.ts (or split by domain)
- Server actions (use server): src/lib/actions.ts or src/lib/server/<feature>.ts
- Hooks: src/hooks/use-<thing>.ts(x)

Import conventions
- Use the @ alias for absolute imports from src/:
  import { Button } from "@/components/ui/button";
  import { sendEmailReport } from "@/lib/actions";

Environment variables
- Next.js server features use env vars (do not expose secrets to the client):
  - SENDER_EMAIL, APP_PASSWORD
- Create .env.local for Next.js and .env for Python as needed. Never commit .env files.

Python email workflow (no Node required)
- See README for quick steps or run: npm run email:python

Formatting & linting
- Run formatting: npm run format
- Check formatting: npm run format:check
- Lint: npm run lint

FAQ
- Where do I add a new Cohort-processing utility?
  - Prefer src/lib/<domain>/, e.g., src/lib/csv/parse.ts
- Can I import server code in a client component?
  - No. Keep server code in server-only files and call via server actions or API routes.
- Can we host without Node?
  - UI can be exported statically; server features (email) require a server or the Python CLI.
