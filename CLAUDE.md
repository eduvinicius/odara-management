# Odara Management

React 19 admin SPA for managing the Odara catalog (products, categories, feedbacks).

## Stack

Vite · React 19 · TypeScript 5 (strict) · React Router v7 · TanStack Query · Tailwind CSS 4 · Supabase (auth + full CRUD)

## Commands

```bash
npm run dev     # dev server → http://localhost:5173
npm run build   # type-check + production build
npm run lint    # ESLint
```

## Architecture

See `.claude/agents/admin-frontend-agent.md` for the full rules: folder conventions,
auth patterns, Supabase rules, TanStack Query patterns, Design System usage, and skills.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase project URL and anon key.

## Design System

Same visual language as the catalog. Tokens are inlined in `src/index.css` as CSS custom
properties. Source of truth: `../Odara Design System/`.
