# VidVault AI — Second Brain for Videos

## Overview

A full-stack AI-powered video knowledge management web application. Users paste YouTube URLs, save them as smart cards, organize into folders/tags, and use AI to transform video content into notes, flashcards, MCQs, summaries, and more.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (dark mode, glassmorphism, Framer Motion)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Replit Auth (OIDC with PKCE)
- **AI**: OpenAI via Replit AI Integrations (no user API key needed)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **UI**: Tailwind CSS + ShadCN components

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── vidvault-ai/        # React+Vite frontend (dark mode SaaS UI)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── replit-auth-web/    # Browser auth hook (useAuth)
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `users` — Replit auth users
- `sessions` — auth sessions
- `folders` — user-created folders (nested support)
- `tags` — labels for organizing videos
- `videos` — saved YouTube videos with metadata
- `video_tags` — many-to-many video↔tag relationship
- `notes` — timestamped notes on videos
- `ai_outputs` — AI-generated content (summaries, notes, MCQs, flashcards, etc.)

## API Routes

All routes are prefixed with `/api`:

- `GET /auth/user` — current user info
- `GET /login`, `GET /callback`, `GET /logout` — OIDC auth flow
- `GET/POST /videos` — list/add videos
- `GET/PATCH/DELETE /videos/:id` — manage video
- `POST /videos/:id/favorite` — toggle favorite
- `GET/POST /folders` — list/create folders
- `PATCH/DELETE /folders/:id` — manage folder
- `GET/POST /tags` — list/create tags
- `POST/DELETE /videos/:id/tags/:tagId` — tag management
- `GET/POST /videos/:id/notes` — video notes
- `PATCH/DELETE /notes/:id` — manage note
- `POST /videos/:id/ai/generate` — generate AI content (type: summary|notes|ppt_outline|mcq|flashcards|blog_article|key_insights)
- `GET /videos/:id/ai/outputs` — list AI outputs
- `POST /ai/chat` — chat with AI about videos
- `GET /stats` — dashboard stats

## AI Features

AI generation uses Replit AI Integrations (OpenAI) — no user API key required. Charges to Replit credits.
- Summarize videos
- Generate study notes
- Create MCQs
- Generate flashcards
- Write blog articles
- Create PPT outlines
- Extract key insights

## Development

```bash
# Run API server
pnpm --filter @workspace/api-server run dev

# Run frontend
pnpm --filter @workspace/vidvault-ai run dev

# Update OpenAPI spec then run:
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes
pnpm --filter @workspace/db run push
```
