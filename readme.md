# Pravakar Rijal — Linux Desktop Portfolio

An interactive Linux desktop portfolio built as a full-stack web app.

## Architecture

```
/
├── client/          React + Vite frontend (port 5000 in dev)
├── server/          Express.js API (port 3001)
└── package.json     Root with concurrently dev script
```

## Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS (Inter + JetBrains Mono fonts), React Router v6, TanStack Query, react-markdown
- **Backend**: Node.js 20, Express.js (ES modules), pg (PostgreSQL driver)
- **Database**: Replit PostgreSQL (DATABASE_URL in env)
- **Auth**: JWT (jsonwebtoken) + bcrypt password hashing
- **Dev**: concurrently runs both client (5000) and server (3001) simultaneously

## Desktop Apps (8 total)

| App | File | Notes |
|-----|------|-------|
| Terminal | `apps/Terminal.tsx` | 30+ commands, tab completion, `pravakar@prav-pc` prompt, no "Portfolio OS" branding |
| Browser | `apps/Browser.tsx` | Portfolio / Blog (login-gated) / LinkedIn / GitHub / Resume (login-gated) / Tech News |
| Files | `apps/FileManager.tsx` | PLACES sidebar, folder navigation, preview panel |
| Notes | `apps/Notes.tsx` | PIN-locked (default 1234), localStorage, markdown editor |
| Pomodoro | `apps/Pomodoro.tsx` | 25/5/15 timer, SVG ring, Web Audio bell, configurable |
| Tasks | `apps/TodoApp.tsx` | Priorities, categories, starred, due-today, localStorage |
| README.md | inline | Simple text editor |
| Resume.pdf | Browser | Opens resume page with login guard |

## Browser Pages

- `portfolio.dev` — main portfolio (dark, cyan accent)
- `blog.pravakar.dev` — **login-gated** Blog CMS (admin JWT required)
- `linkedin.com/...` — LinkedIn profile preview
- `github.com/...` — GitHub profile preview
- `resume.pravakar.dev` — **login-gated** resume builder + Print-to-PDF export
- `news.ycombinator.com` — Tech News (HackerNews Algolia + Dev.to, live APIs, no auth)

## Terminal Commands

Core: `ls`, `cd`, `cat`, `pwd`, `tree`, `grep`, `head`, `tail`, `wc`, `touch`, `mkdir`, `rm`, `cp`, `mv`
System: `date`, `cal`, `uname`, `uptime`, `hostname`, `whoami`, `env`, `echo`, `export`, `history`, `which`, `man`
Network: `ping`, `curl`
Portfolio: `neofetch`, `skills`, `projects`, `contact`, `open <app>`
AI: `ai "question"`

## Blog CMS

- **Admin Panel** (`/admin`) — full CMS in admin area
- **Browser Blog** — login-gated blog inside the desktop browser using admin JWT

## HuggingFace AI

`ai "question"` in terminal calls `/api/ai/chat` (uses `HUGGINGFACE_API_KEY` if set, else smart fallback)

## Database Tables

- `admin_users` — username + bcrypt password hash
- `blog_posts` — title, slug, content (markdown), excerpt, tags, published, cover_image
- `profile_sections` — JSONB storage for: about, skills, experience, projects, education, certifications, settings
- `medium_articles` — cached RSS articles from Medium

## Environment Variables / Secrets

- `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — set automatically by Replit
- `JWT_SECRET` — (optional) override default JWT secret for production
- `HUGGINGFACE_API_KEY` — (optional) enables real AI responses in terminal
- `SERVER_PORT` — defaults to 3001

## Development

```bash
npm run dev        # starts both client (5000) + server (3001) concurrently
```

Vite proxies `/api/*` → Express on port 3001.

## Deployment

The workflow `Start application` runs `npm run dev` and serves the app on port 5000.
For production, `npm run build` compiles the React app to `client/dist/`, then Express serves it statically.

## Admin Access

First visit `/admin` → first-time setup page → create username + password (min 8 chars).
Login at `/admin/login`. JWT stored in localStorage, expires in 7 days.

## Profile Data

Pre-seeded with Pravakar Rijal's actual CV data:
- Name: Pravakar Rijal
- Email: pravakarrijal11@gmail.com  
- Phone: +977-9815185130
- Location: Kathmandu, Nepal
- Current role: Backend .NET Trainee at Vertex Special Technology (Feb 2025–Present)
- LinkedIn: linkedin.com/in/pravakar-rijal/
