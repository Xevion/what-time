# when-works

A scheduling application for finding common meeting times, inspired by When2Meet.

## Tech Stack

**Backend:**

- Rust with Axum web framework
- PostgreSQL database with sqlx
- Asset embedding with rust-embed

**Frontend:**

- React 19 with TypeScript
- TanStack Router for routing
- Radix UI for components
- Vite for build tooling

## Development Setup

### Prerequisites

- Rust (latest stable)
- Node.js & pnpm
- PostgreSQL
- Just (command runner)

### Getting Started

1. **Clone and setup environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

2. **Install dependencies:**

   ```bash
   pnpm install -C web
   ```

3. **Setup database:**

   ```bash
   # Create a PostgreSQL database
   createdb when_works

   # Migrations will run automatically on server start
   ```

4. **Run development server:**

   ```bash
   just dev
   ```

   This runs both frontend (http://localhost:3000) and backend (http://localhost:8080) in parallel with auto-reload.

## Available Commands

```bash
just dev              # Run auto-reloading dev servers (frontend + backend)
just frontend         # Run frontend dev server only
just backend          # Run backend dev server only
just build            # Production build
just build-frontend   # Build frontend only
```

## Project Structure

```
when-works/
├── src/              # Rust backend source
│   ├── config/       # Configuration management
│   ├── web/          # Web server and routes
│   └── main.rs       # Application entry point
├── web/              # React frontend
│   ├── src/
│   │   ├── routes/   # Page components
│   │   └── components/ # Reusable components
│   └── dist/         # Build output (embedded in backend)
├── migrations/       # Database migrations
└── Dockerfile        # Multi-stage Docker build
```

## Database Schema

- **users**: Authenticated user accounts
- **events**: Scheduling events with date/time ranges
- **participants**: Event participants (authenticated or anonymous)
- **availability_slots**: Time slot selections per participant

## License

GPL v3
