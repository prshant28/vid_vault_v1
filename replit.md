# VidVault AI — Second Brain for Videos

## Overview

A full-stack AI-powered video knowledge management web application. Users save YouTube videos or entire playlists, organize into folders/tags, take timestamped notes, and use AI to transform video content into summaries, notes, flashcards, MCQs, and more.

## Design System — Monolithic Brutalist

**Color**: `#0a0a0b` background, white text, `#8b5cf6` purple accent
**Typography**: Inter (900 weight, uppercase) for headings; JetBrains Mono for all UI labels/badges (uppercase, tracked)
**CSS Classes**: `etched-slab` (dark card with inset shadow), `btn-monolith` (clip-path polygon button), `grid-mesh` (40px grid overlay), `grain-overlay` (noise texture), `badge-mono` (purple monospace badge), `font-mono-ui` (JetBrains Mono)
**Motion**: Framer Motion with stagger reveals, y-offset slide-ups, and tween transitions (no spring for panels)

## Key Features

### ✅ Core Functionality
- **Single Video Saving** — Paste any YouTube URL to instantly save with metadata (title, channel, thumbnail, duration)
- **Playlist Import** — Paste a playlist URL to automatically extract all videos into a new folder (named after playlist or custom name)
- **Smart Organization** — Organize videos into folders and tags
- **Timestamped Notes** — Add notes to specific moments in videos
- **AI-Powered Content Generation** — Summaries, study notes, MCQs, flashcards, blog articles, PPT outlines, key insights

### 🔐 Authentication
- **Replit Auth (OIDC)** — One-click sign-in via Replit account
- **Email/Password Auth** — Manual registration and login with bcryptjs password hashing
- **Session Management** — Secure session handling with PostgreSQL

### 🤖 AI Features (via Replit OpenAI)
- Video summarization
- Study notes extraction
- Multiple choice question generation
- Flashcard creation
- Blog article writing
- PowerPoint outline generation
- Key insights extraction
- Interactive AI chat

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Frontend**: React + Vite (dark mode, glassmorphism, Framer Motion animations)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Replit Auth (OIDC) + Manual (bcryptjs)
- **AI**: OpenAI via Replit AI Integrations
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **UI**: Tailwind CSS + ShadCN components

## Structure

```
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── vidvault-ai/        # React+Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   ├── db/                 # Drizzle ORM schema + DB
│   └── replit-auth-web/    # Browser auth hook
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Database Schema

- `users` — Replit auth users + manual auth (with password hash)
- `sessions` — auth sessions
- `folders` — user-created folders (including auto-generated playlist folders)
- `tags` — labels for organizing videos
- `videos` — saved YouTube videos with metadata
- `video_tags` — many-to-many video↔tag relationship
- `notes` — timestamped notes on videos
- `ai_outputs` — AI-generated content

## API Routes

### Videos
- `GET/POST /videos` — list/add videos
- `GET/PATCH/DELETE /videos/:id` — manage video
- `POST /videos/playlist` — import entire playlist (creates folder + extracts videos)
- `POST /videos/:id/favorite` — toggle favorite

### Playlists
- `POST /videos/playlist` — Import playlist
  - Input: Playlist URL + optional folder name
  - Output: Auto-creates folder, extracts all videos, returns import summary
  - Auto-detects playlist name from YouTube if not custom named

### Folders
- `GET/POST /folders` — list/create folders
- `PATCH/DELETE /folders/:id` — manage folder

### Tags & Notes
- `GET/POST /tags` — list/create tags
- `POST/DELETE /videos/:id/tags/:tagId` — tag management
- `GET/POST /videos/:id/notes` — video notes
- `PATCH/DELETE /notes/:id` — manage note

### AI
- `POST /videos/:id/ai/generate` — generate AI content (type: summary|notes|ppt_outline|mcq|flashcards|blog_article|key_insights)
- `GET /videos/:id/ai/outputs` — list AI outputs
- `POST /ai/chat` — chat with AI about videos

### Auth
- Replit: `GET /login`, `GET /callback`, `GET /logout`
- Manual: `POST /register`, `POST /login-manual`
- Current user: `GET /auth/user`

### Stats
- `GET /stats` — dashboard stats (total videos/folders/tags, recent videos, favorites)

## Environment Variables

```
DATABASE_URL=postgresql://...         # PostgreSQL connection
YOUTUBE_API_KEY=AIzaSy...            # YouTube Data API v3 key
AI_INTEGRATIONS_OPENAI_API_KEY=...   # Set by Replit (auto)
AI_INTEGRATIONS_OPENAI_BASE_URL=...  # Set by Replit (auto)
```

## Development

```bash
# Run all services
pnpm install
pnpm --filter @workspace/api-server run dev  # API: port 8080
pnpm --filter @workspace/vidvault-ai run dev  # Frontend: port 21232

# Update API spec & regenerate clients
pnpm --filter @workspace/api-spec run codegen

# Push database migrations
pnpm --filter @workspace/db run push
```

## Playlist Import Feature

### How It Works
1. User pastes a YouTube playlist URL in the modal
2. System extracts all videos from the playlist (up to 500 videos per playlist)
3. Auto-creates a folder named after the playlist (or custom name)
4. Fetches metadata for each video (title, thumbnail, duration, channel)
5. Inserts all videos into the database in a single folder
6. Returns summary of imported videos

### URL Formats Supported
- `https://www.youtube.com/playlist?list=PLxxxxx`
- `https://www.youtube.com/watch?v=xxxxx&list=PLxxxxx` (video with playlist)

### Frontend
- Modal auto-detects playlist vs. single video URLs
- Shows different UI for each:
  - **Single Video**: Simple URL input → save video
  - **Playlist**: URL + optional folder name → imports all videos

## Notes

- YouTube API key required for full metadata (duration, view count, exact titles)
- Playlist imports use YouTube Data API v3 to fetch all video IDs
- AI features use Replit's OpenAI integration (billed to Replit credits)
- Dark mode enabled by default with glassmorphism UI
- Responsive design for mobile, tablet, desktop
- Framer Motion animations for smooth interactions
