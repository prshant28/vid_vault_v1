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

### 🤖 AI Features (via OPENAI_API_KEY)
- Video summarization
- Study notes extraction
- Multiple choice question generation
- Flashcard creation
- Blog article writing
- PowerPoint outline generation
- Key insights extraction
- Interactive AI chat
- **AI Output Full View**: dedicated page `/videos/:id/output/:type` with Copy/Markdown/HTML/PDF export
- **Auto-analysis**: summary + key_insights generated automatically on video save

### 📺 YouTube Integration (via YOUTUBE_API_KEY)
- Video metadata fetch (title, thumbnail, duration, views)
- Playlist import (extract all videos from a playlist URL)
- YouTube search in global AI chat

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

## Mobile App (Expo / React Native)

Located at `artifacts/vidvault-mobile/`. Full-featured companion app mirroring the web app.

### Design System — Brutalist Dark
- **Palette**: `#0a0a0f` background, `#13131a` card, `#8b5cf6` purple primary, `borderRadius: 4` (sharp)
- **Fonts**: Raleway_900Black (headings), JetBrainsMono_400Regular (labels/badges), Inter (body)
- **Grid background**: SVG `rgba(139,92,246,0.07)` lines at 56px cell — used on dashboard, loading, onboarding
- **Etched-slab stat cards**: code numbers "01/02/03", accent radial glow, Raleway_900Black values
- **PolygonButton**: clip-path polygon CTA button used in login + onboarding

### Design System — AlegreyaSansSC + Eczar
- **Fonts**: AlegreyaSansSC (all headers/titles), Eczar (all body/labels/buttons)
- **Palette**: `#09090c` dark bg, `#f5f5ff` light bg, `#6366f1` purple, `#06b6d4` cyan, `#10b981` green, `#f59e0b` amber, `#ec4899` pink
- **Cards**: borderRadius 14–18, thin 1px borders with color + opacity suffix, subtle gradient washes
- **Tab bar**: Custom premium bar on Android/web; native BlurView on iOS; NativeTabs on iOS 26+

### Key Screens
- `_layout.tsx` — branded loading + auth restore; streak tracking on login; reminder rescheduling
- `splash.tsx` — native animated splash
- `onboarding.tsx` — onboarding with slides
- `login.tsx` — email/password + JWT auth
- `(tabs)/index.tsx` — home dashboard: streak card, quick access (7 items), clickable stats grid, XP/level, AI tools hub, recent AI, latest captures, favorites, daily tip
- `(tabs)/videos.tsx` — full library with search + tag/folder/favorites filter, add-video modal
- `(tabs)/folders.tsx` — folder management + Smart Collections + Playlist Import
- `(tabs)/ai-studio.tsx` — global AI chat with recall + YouTube search + session history
- `(tabs)/discover.tsx` — categorized tool launcher: Core Vault, AI Intelligence, Study & Practice, Templates, Knowledge Graph
- `(tabs)/profile.tsx` — settings + daily reminder toggle + streak display + theme toggle + achievements
- `video/[id].tsx` — in-app YouTube player, AI output panel with 7 export options (Copy, Share Text, Share Card, Markdown, HTML, PDF, Email), timestamped notes, study timer
- `collection.tsx` — Smart Collections (starred/hasAi/watched/recent)
- `search.tsx` — global search across videos, notes, AI outputs
- `review.tsx` — spaced repetition flashcard review (SM-2 algorithm)
- `chat-history.tsx` — all past AI Studio chats, searchable, expandable inline
- `cross-video-ai.tsx` — cross-vault AI chat using all AI outputs as context
- `key-terms.tsx` — AI-generated personal glossary of recurring concepts
- `watch-later.tsx` — queue videos via URL preview before committing to vault

### Auth
- JWT stored in SecureStore, sent as `Authorization: Bearer <token>` header
- `setApiToken(token)` in `services/api.ts` wires the token to all requests

### Key Dependencies
- `react-native-webview` — in-app YouTube embed player
- `react-native-svg` — SVG grid backgrounds
- `expo-haptics` — haptic feedback on all interactive elements
- `expo-blur` — BlurView tab bar on iOS
- `expo-secure-store` — secure JWT storage
- `expo-notifications` — daily reminders with streak messages
- `expo-print` + `expo-file-system` + `expo-sharing` — PDF/HTML export pipeline
- `expo-clipboard` — clipboard copy for AI outputs
- `react-native-view-shot` — ShareCard image capture + share

### Notification & Streak System
- `lib/notifications.ts` — unified streak tracking (key: `vv_streak_v1`), daily notification scheduling
- Streak updates on every app launch via `updateStreak()` in `_layout.tsx`
- Profile screen: live toggle with Switch, streak display (🔥 Day N), scheduled time shown
- Home screen: streak count shown in hero + StreakCard with day dots and progress bar

### AI Backend Routes (mobile-facing)
- `POST /api/ai/global-chat` — AI Studio global chat
- `POST /api/ai/cross-video` — cross-vault AI (uses all user AI outputs as context)
- `POST /api/ai/key-terms` — extract recurring concepts from vault
- `GET /api/preview?url=` — YouTube URL metadata preview (Watch Later)

## Notes

- YouTube API key required for full metadata (duration, view count, exact titles)
- Playlist imports use YouTube Data API v3 to fetch all video IDs
- AI features use Replit's OpenAI integration (billed to Replit credits)
- Dark mode enabled by default with glassmorphism UI on web; brutalist dark on mobile
- Responsive design for mobile, tablet, desktop
- Framer Motion animations for smooth interactions on web
