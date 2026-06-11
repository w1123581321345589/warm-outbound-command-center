# Warm Outbound Command Center

A sales orchestration platform for B2B teams running a warm outbound playbook. Tracks prospects through pipeline stages, manages VA task queues, enforces message QC workflows, and provides conversion analytics.

## The 5-Step Playbook

1. **Identify** — Find and qualify prospects
2. **Warm** — Engage with their content (likes, comments, shares)
3. **First Touch** — Send a personalized outreach message
4. **Video** — Send a personalized video
5. **Book** — Schedule a call

## Features

### Pipeline
Drag-and-drop Kanban board with automatic timestamp logging when prospects change stages. Full contact and company details per card.

### Task Queue
Assign warming and outreach tasks to VAs with priority levels, due dates, and one-click completion.

### QC Queue
Review outreach messages before they're sent. Approve, reject, or request revisions with feedback.

### Templates
Pre-built message templates with `{variable}` placeholders for personalization, organized by stage and type.

### CSV Import
4-step import flow (upload → column mapping → preview → confirm) supporting Clay, LinkedIn Sales Navigator, Phantombuster, and Apollo.io exports.

### Analytics
Pipeline conversion metrics, stage velocity, task throughput, and reply rate tracking.

## Tech Stack

**Frontend** — React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, wouter, @dnd-kit, Recharts

**Backend** — Express.js, TypeScript, Drizzle ORM, PostgreSQL, Zod

**Auth** — OpenID Connect (OIDC) with session management via PostgreSQL

## Project Structure

```
├── client/src/
│   ├── components/
│   │   ├── layout/       # Sidebar, nav
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/
│   ├── lib/
│   └── pages/            # Dashboard, Pipeline, Tasks, QCQueue, Templates, Analytics, Import
├── server/
│   ├── db.ts
│   ├── index.ts
│   ├── routes.ts
│   └── storage.ts
├── shared/
│   ├── schema.ts          # Drizzle schema + Zod types
│   └── routes.ts          # API route definitions
└── drizzle/               # Migrations
```

## Database Schema

- **users** — Accounts
- **teams** — Sales teams
- **team_members** — Team roles (ADMIN, MANAGER, REP, VA)
- **prospects** — Lead records with stage and timing fields
- **tasks** — VA task queue
- **templates** — Message templates
- **qc_queue** — Messages pending review
- **activities** — Audit log per prospect

### Prospect Stages

```
IDENTIFIED → WARMING → FIRST_TOUCH_READY → FIRST_TOUCH_SENT
         → VIDEO_READY → VIDEO_SENT → CALL_BOOKED → WON / LOST
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/teams` | List teams |
| POST | `/api/teams` | Create team |
| GET | `/api/prospects` | List prospects |
| POST | `/api/prospects` | Create prospect |
| PATCH | `/api/prospects/:id` | Update / move stage |
| DELETE | `/api/prospects/:id` | Delete prospect |
| POST | `/api/prospects/import` | Bulk CSV import |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| POST | `/api/tasks/:id/complete` | Complete task |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| GET | `/api/qc-queue` | List QC items |
| PATCH | `/api/qc-queue/:id` | Approve / reject |
| GET | `/api/analytics/overview` | Pipeline stats |

## Environment Variables

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=...
```

## Getting Started

```bash
git clone https://github.com/yourusername/warm-outbound-command-center.git
cd warm-outbound-command-center
npm install
npm run db:push
npm run dev
```

App runs at `http://localhost:5000`.

## License

MIT
