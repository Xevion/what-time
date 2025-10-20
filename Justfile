default:
    just --list

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
