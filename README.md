# Warm Outbound Command Center

A sales orchestration platform that manages the 5-step warm outbound playbook for B2B sales teams. Built to track prospects through pipeline stages, manage VA task queues, enforce QC workflows for message review, and provide analytics on conversion rates.

## The 5-Step Warm Outbound Playbook

1. **Identify** - Find and qualify potential prospects
2. **Warm** - Engage with their content on social media (like, comment, share)
3. **First Touch** - Send personalized outreach message
4. **Video** - Send a personalized video message
5. **Book** - Schedule a meeting/call

## Features

### Pipeline Management
- **Kanban Board** - Visual drag-and-drop interface to move prospects between stages
- **Stage Tracking** - Automatic timestamp logging when prospects move stages
- **Prospect Details** - Full contact information, company data, and activity history

### Task Management
- **VA Task Queue** - Assign warming and outreach tasks to virtual assistants
- **Priority Levels** - Organize tasks by urgency
- **Due Dates** - Track task deadlines and overdue items
- **Task Completion** - Mark tasks complete with automatic pipeline updates

### QC (Quality Control) Queue
- **Message Review** - Review outreach messages before they're sent
- **Approval Workflow** - Approve or reject messages with feedback
- **Template Compliance** - Ensure messages follow approved templates

### Templates
- **Message Templates** - Pre-built templates for DMs, comments, and videos
- **Variable Placeholders** - Personalization tokens for prospect data
- **Template Categories** - Organize by stage and message type

### CSV Import
- **Bulk Upload** - Import prospects from CSV files
- **Source Support** - Clay, LinkedIn Sales Navigator, Phantombuster, Apollo.io
- **Column Mapping** - Automatically detect and map columns
- **Preview** - Review data before importing

### Analytics Dashboard
- **Pipeline Metrics** - Prospects per stage, conversion rates
- **Activity Tracking** - Messages sent, tasks completed
- **Team Performance** - Track VA productivity
- **Time Metrics** - Average time in each stage

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching and caching
- **wouter** - Client-side routing
- **@dnd-kit** - Drag and drop functionality
- **Recharts** - Charts and graphs
- **Framer Motion** - Animations

### Backend
- **Express.js** - Node.js web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database queries
- **PostgreSQL** - Database
- **Zod** - Schema validation

### Authentication
- **Replit Auth** - OAuth authentication (Google, GitHub, email)

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── layout/     # Layout components (Sidebar, etc.)
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and query client
│   │   └── pages/          # Page components
│   │       ├── Dashboard.tsx
│   │       ├── Pipeline.tsx
│   │       ├── Tasks.tsx
│   │       ├── QCQueue.tsx
│   │       ├── Templates.tsx
│   │       ├── Analytics.tsx
│   │       └── Import.tsx
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── replit_integrations/
│       └── auth/          # Replit Auth integration
├── shared/                 # Shared code between frontend/backend
│   ├── schema.ts          # Database schema (Drizzle)
│   └── routes.ts          # API route definitions (Zod)
└── drizzle/               # Database migrations
```

## Database Schema

### Core Tables
- **users** - User accounts (managed by Replit Auth)
- **teams** - Sales teams
- **team_members** - Team membership
- **prospects** - Prospect/lead records
- **tasks** - VA tasks
- **templates** - Message templates
- **qc_queue_items** - Messages pending QC review
- **activities** - Activity log for prospects

### Prospect Stages
```typescript
enum ProspectStage {
  IDENTIFIED = "IDENTIFIED",
  WARMING = "WARMING",
  FIRST_TOUCH_SENT = "FIRST_TOUCH_SENT",
  VIDEO_SENT = "VIDEO_SENT",
  CALL_BOOKED = "CALL_BOOKED",
  WON = "WON",
  LOST = "LOST"
}
```

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/logout` - Log out

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team

### Prospects
- `GET /api/prospects` - List prospects (with filters)
- `POST /api/prospects` - Create prospect
- `GET /api/prospects/:id` - Get prospect
- `PATCH /api/prospects/:id` - Update prospect
- `DELETE /api/prospects/:id` - Delete prospect
- `POST /api/prospects/import` - Bulk import from CSV

### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `POST /api/tasks/:id/complete` - Complete task

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PATCH /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### QC Queue
- `GET /api/qc-queue` - List QC items
- `POST /api/qc-queue` - Create QC item
- `PATCH /api/qc-queue/:id` - Review QC item (approve/reject)

### Analytics
- `GET /api/analytics/overview` - Get analytics data

## Environment Variables

```env
DATABASE_URL=postgresql://...    # PostgreSQL connection string
SESSION_SECRET=...               # Session encryption key
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/warm-outbound-command-center.git
cd warm-outbound-command-center
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Create .env file with DATABASE_URL and SESSION_SECRET
```

4. Run database migrations
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Development

### Running locally
```bash
npm run dev
```

### Database migrations
```bash
npm run db:push     # Push schema changes
npm run db:studio   # Open Drizzle Studio
```

### Type checking
```bash
npx tsc --noEmit
```

## Deployment

This application is designed to be deployed on Replit. Simply click the "Deploy" button in the Replit interface to publish your app.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [Replit](https://replit.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
