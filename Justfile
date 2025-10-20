default:
    just --list

# Start PostgreSQL database with Docker
db-start:
    @docker compose up -d postgres
    @echo "Database is starting at postgres://when_works:dev_password@localhost:5432/when_works"

# Wait for database to be ready (use after db-start if needed)
db-wait:
    @echo "Waiting for database..."
    @until docker compose exec postgres pg_isready -U when_works > /dev/null 2>&1; do sleep 0.5; done
    @echo "Database is ready!"

# Stop PostgreSQL database
db-stop:
    docker compose down

# View database logs
db-logs:
    docker compose logs -f postgres

# Connect to database with psql
db-shell:
    docker compose exec postgres psql -U when_works -d when_works

# Reset database (destroys all data!)
db-reset:
    docker compose down -v
    just db-start

# Auto-reloading frontend server
frontend:
    pnpm run -C web dev

# Production build of frontend
build-frontend:
    pnpm run -C web build

# Auto-reloading backend server
backend *ARGS:
    bacon --headless run -- {{ARGS}}

# Production build
build:
    pnpm run -C web build
    cargo build --release

# Run auto-reloading development build with release characteristics (frontend is embedded, non-auto-reloading)
dev-build *ARGS='--tracing pretty': build-frontend
    bacon --headless run -- --profile dev-release -- {{ARGS}}

# Auto-reloading development build for both frontend and backend
[parallel]
dev *ARGS='': frontend (backend ARGS)
