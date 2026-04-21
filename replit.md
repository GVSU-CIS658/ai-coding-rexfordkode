# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### StockWatch (`artifacts/stockwatch`)

A live stock market tracking web app built with **Vue 3 + Vue Router + Pinia**.

**Frontend features:**
- Vue 3 (Composition API with `<script setup>`)
- Vue Router 4 for client-side routing
- Pinia for state management
- TailwindCSS for styling
- Mobile-responsive with bottom navigation on mobile
- Dark theme financial dashboard

**Pages:**
- `/` — Market Overview (gainers, losers, trending stocks)
- `/search` — Search stocks by ticker or name
- `/watchlist` — Personal watchlist with live quotes
- `/portfolio` — Portfolio tracker with P&L calculations
- `/stock/:symbol` — Stock detail page with full stats

**Backend (`artifacts/api-server`):**
- Express 5 API server
- Yahoo Finance data (with intelligent fallback for server-side blocking)
- PostgreSQL database for watchlist + portfolio persistence
- Routes: `/api/stocks/quote`, `/api/stocks/quotes`, `/api/stocks/search`, `/api/stocks/trending`, `/api/stocks/movers`, `/api/watchlist`, `/api/portfolio`, `/api/portfolio/summary`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
