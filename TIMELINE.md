# what-time Development Timeline

## Project Vision

A modern, open-source scheduling application for finding common meeting times. Built with a focus on elegant, responsive design, real-time collaboration, and mobile-first interaction.

**Core Principles:**
- Anonymous-first (no login required)
- Real-time updates via WebTransport/WebSockets
- Exceptional drag-and-drop availability interface
- Mobile-friendly from day one
- Clean, distinct heatmap visualization

---

## Phase 1: Core MVP
**Goal:** Basic functional app deployable to Railway

### Features
- [ ] Event creation form
  - Name (optional)
  - Date range (required)
  - Time range (required)
  - Timezone (optional, defaults to browser)
  - Quick templates: "Next weekend", "Next week", "Monday to Friday"
- [ ] Availability grid interface
  - 15-minute time blocks
  - Days as columns, times as rows
  - Click-and-drag selection (contextual based on initial cell state)
  - Visual preview while dragging
  - Changes apply on mouse release
- [ ] Participant submission
  - Name field (required)
  - Submit availability
- [ ] Basic heatmap visualization
  - Distinct color phases showing participant overlap
  - No real-time updates yet (refresh to see changes)
- [ ] Event view page
  - Display all participants
  - Show aggregated heatmap
- [ ] Basic responsive layout
  - Works on desktop and mobile (refinement comes later)
- [ ] Railway deployment
  - Production build
  - Database migrations
  - Environment configuration

### Technical Tasks
- [ ] Database schema for events, participants, availability slots
- [ ] API endpoints: create event, submit availability, fetch event data
- [ ] Frontend routing (event creation, event view)
- [ ] Event creation templates logic (date/time presets)
- [ ] Grid component with drag selection logic
- [ ] Heatmap calculation algorithm
- [ ] Railway deployment configuration

---

## Phase 2: Real-Time & Sharing
**Goal:** Live collaboration and easy sharing

### Features
- [ ] Real-time updates
  - WebTransport-first with WebSocket fallback
  - Heatmap updates instantly when participants submit
  - Connection state handling
- [ ] Short URL generation
  - Format: `/gjJG44xF2` (required) or `/2023-meetup-gjJG44xF2` (optional slug)
  - Copy link functionality
- [ ] QR code generation
  - Easy mobile sharing
  - Downloadable QR code image
- [ ] Participant list
  - Show who has responded
  - Real-time participant count

### Technical Tasks
- [ ] Implement WebTransport server support (Axum)
- [ ] WebSocket fallback implementation
- [ ] Real-time message protocol (subscribe to event, broadcast updates)
- [ ] Client-side connection management
- [ ] URL slug generation (nanoid or similar)
- [ ] QR code library integration (backend or frontend)

---

## Phase 3: Mobile Refinement
**Goal:** Excellent mobile experience

### Features
- [ ] Optimized vertical layout
  - Large, scrollable day columns
  - Each column takes most of screen width
  - Horizontal swipe between days
- [ ] Touch interaction refinement
  - Smooth drag on touch devices
  - Prevent scroll-while-dragging conflicts
  - Touch feedback
- [ ] Mobile-specific UI adjustments
  - Larger touch targets
  - Optimized typography
  - Compact header/controls
- [ ] Performance optimization
  - Lazy rendering for large grids
  - Efficient re-renders
  - Bundle size optimization

### Technical Tasks
- [ ] Mobile-first CSS refinements
- [ ] Touch event handling (separate from mouse)
- [ ] Virtual scrolling for time grid
- [ ] Performance profiling and optimization
- [ ] Cross-device testing

---

## Phase 4: Enhanced Participant Features
**Goal:** Editability and better participant experience

### Features
- [ ] Event creator editing
  - Edit event name, date range, time range
  - Changes propagate to all participants
  - Version tracking for major changes
- [ ] Edit submitted availability
  - Re-access via browser storage (primary method)
  - Optional PIN code for access
  - Screenshot-friendly PIN display
- [ ] Delete participant response
  - Confirmation dialog
  - Remove from heatmap
- [ ] Participant color picker
  - Choose unique color for identification
  - Only show available colors
  - Display color on heatmap hover
- [ ] Export functionality
  - Export results to CSV
  - Summary of best times
- [ ] Best times suggestions
  - Ranked list of top 3-5 time slots
  - Show participant count for each slot

### Technical Tasks
- [ ] Event editing API endpoints and UI
- [ ] Change propagation to participants (real-time notification)
- [ ] Browser localStorage for participant sessions
- [ ] PIN code generation and validation
- [ ] Participant color assignment logic
- [ ] CSV export implementation
- [ ] Best times algorithm (find optimal overlaps)
- [ ] Results summary component

---

## Phase 5: Production Hardening
**Goal:** Reliability, testing, and CI/CD

### Features
- [ ] Event archival policy
  - Anonymous events: auto-archive after 1 year
  - Authenticated events: keep forever (or configurable)
  - Soft delete with recovery window
- [ ] Participant limits (free tier)
  - Unauthenticated events: 10 participants max
  - Authenticated events: 100 participants max
  - Clear messaging when limit reached
- [ ] Rate limiting
  - Per-IP limits on event creation
  - Per-event limits on submissions
  - WebSocket connection limits
- [ ] Comprehensive testing
  - Backend unit tests
  - Frontend component tests
  - Integration tests with testcontainers
  - Basic E2E tests (Playwright)
- [ ] CI/CD pipeline
  - GitHub Actions workflow
  - Automated tests on PR
  - Automated Railway deployment
- [ ] Staging environment
  - Separate Railway deployment
  - Branch-based deploys
  - Staging subdomain

### Technical Tasks
- [ ] Archival cron job/background task
- [ ] Soft delete implementation with recovery
- [ ] Participant limit enforcement in API
- [ ] Implement rate limiting middleware (tower-governor or similar)
- [ ] Set up cargo test suite
- [ ] Set up frontend tests (Vitest + Testing Library)
- [ ] Testcontainers for PostgreSQL in tests
- [ ] Playwright E2E test setup
- [ ] GitHub Actions workflow configuration
- [ ] Railway staging environment setup
- [ ] Error boundary components

---

## Phase 6: Analytics & Observability
**Goal:** Understanding usage and debugging

### Features
- [ ] PostHog analytics integration
  - Client-side event tracking
  - Cloudflare Workers proxy (avoid adblockers)
  - Privacy-conscious tracking
- [ ] Event tracking
  - Event creation
  - Participant submission
  - Feature usage (exports, QR codes, etc.)
- [ ] Error reporting
  - Frontend error tracking
  - Backend error logging
  - Client-side sampling
- [ ] Performance monitoring
  - Real-time connection health
  - API response times

### Technical Tasks
- [ ] PostHog SDK integration (frontend + backend)
- [ ] Cloudflare Workers proxy setup
- [ ] Event tracking implementation
- [ ] Error boundary with reporting
- [ ] Backend structured logging (tracing)
- [ ] Performance metrics collection

---

## Phase 7: Future Enhancements
**Goal:** Advanced features and customization

### Features
- [ ] Push notifications
  - Browser-based Web Push API
  - Notification preferences: "All updates" vs "Important only"
  - Notify on: new participant, event edited, best time selected
  - Opt-in with clear privacy messaging
- [ ] Internationalization (i18n)
  - Multiple language support
  - Crowd-sourced translations
  - RTL language support
- [ ] Configurable time granularity
  - 15min, 30min, 1hr options
  - Per-event setting
- [ ] Color scheme customization
  - Colorblind-friendly modes
  - Custom heatmap palettes
  - Dark mode
- [ ] Advanced export options
  - Calendar invite generation (.ics)
  - Integration with Google Calendar, Outlook
  - PDF summary
- [ ] Quick-fill patterns
  - "All weekday mornings"
  - "All weekday evenings"
  - Custom patterns
- [ ] Undo/redo functionality
  - For availability selection

### Technical Tasks
- [ ] Web Push API integration (backend + frontend)
- [ ] Push notification subscription management
- [ ] Notification preferences storage and UI
- [ ] i18n framework integration (i18next or similar)
- [ ] Translation management system
- [ ] Dynamic time granularity in grid component
- [ ] Theme system with multiple color schemes
- [ ] iCalendar (.ics) generation
- [ ] Pattern-based availability selection
- [ ] Command pattern for undo/redo

---

## Heatmap Color Palette Proposals

The heatmap needs distinct color phases (not just opacity) that are gentle, playful, and accessible.

### Option 1: Cool to Warm Progression
- **0-20%**: `#E8F4F8` (Very light blue)
- **20-40%**: `#B3E5F0` (Light cyan)
- **40-60%**: `#FFE6B3` (Soft yellow)
- **60-80%**: `#FFB366` (Gentle orange)
- **80-100%**: `#FF8C42` (Warm orange)

### Option 2: Vibrant but Gentle
- **0-20%**: `#F3E5F5` (Light lavender)
- **20-40%**: `#E1BEE7` (Soft purple)
- **40-60%**: `#FFB3BA` (Pink)
- **60-80%**: `#FFCC99` (Peach)
- **80-100%**: `#FFE699` (Soft gold)

### Option 3: Nature-Inspired (Recommended)
- **0-20%**: `#F0F4F8` (Very light gray-blue)
- **20-40%**: `#B8E6E6` (Mint)
- **40-60%**: `#8FD9A8` (Light green)
- **60-80%**: `#6BCF8E` (Medium green)
- **80-100%**: `#48BB78` (Vibrant green)

### Option 4: Playful Gradient
- **0-20%**: `#E3F2FD` (Ice blue)
- **20-40%**: `#B3E0FF` (Sky blue)
- **40-60%**: `#A7F3D0` (Mint green)
- **60-80%**: `#FDE68A` (Butter yellow)
- **80-100%**: `#FCA5A5` (Coral pink)

**Recommendation:** Option 3 (Nature-Inspired) provides clear visual distinction while being gentle and accessible. The progression from gray-blue through greens feels intuitive (cold/unavailable → warm/available).

---

## Technical Architecture Notes

### Real-Time Implementation
Research Linear's real-time approach for inspiration, but keep it simple for MVP:
- Server maintains event subscription pools
- Clients subscribe to event ID on connection
- On availability update: validate → save → broadcast to all subscribers
- Client applies optimistic updates for own changes
- Handle reconnection gracefully (no "X people viewing" for now)

### URL Structure
- Primary ID: 8-character nanoid (e.g., `gjJG44xF2`)
- Optional slug: user-provided or auto-generated from event name
- Both stored in database, slug is unique constraint
- Frontend routes accept both: `/:eventId` and `/:slug-:eventId`

### Mobile Grid Strategy
- Use CSS Grid with `scroll-snap` for day columns
- Each day column: `width: 85vw` on mobile
- Horizontal scroll with snap points
- Virtual scrolling for time rows if > 50 time blocks

### Testing Strategy
- Unit tests: Core logic (heatmap calculation, URL generation, time slot math)
- Integration tests: API endpoints with testcontainers PostgreSQL
- Component tests: Grid drag logic, heatmap rendering
- E2E tests: Full user flow (create → share → submit → view results)

---

## Success Metrics (Future)

Once analytics are in place, track:
- Events created per week
- Participants per event (avg, median)
- Submission completion rate
- Mobile vs desktop usage
- Real-time connection success rate
- Time to first participant submission
- Feature usage (QR codes, exports, etc.)

---

## Potential Pro/Paid Features

Future revenue model to sustain the project while keeping core features free:

### Free Tier (Default)
- All core functionality (event creation, real-time updates, sharing, QR codes)
- Unauthenticated events: 10 participants max
- Authenticated events: 100 participants max
- 1-year retention for anonymous events

### Pro Tier (Potential Future)
- [ ] Unlimited participants
- [ ] Forever retention (no archival)
- [ ] Magic link access controls
  - Password-protected events
  - Invitation-only events
  - Access expiration dates
- [ ] Advanced customization
  - Custom branding/logo
  - Custom color schemes
  - Remove "powered by" footer
- [ ] Priority support
- [ ] Advanced analytics dashboard
  - Response rate tracking
  - Time zone distribution
  - Optimal time recommendations with reasoning

### Enterprise Tier (Long-term)
- [ ] Self-hosted option
- [ ] SSO integration
- [ ] API access
- [ ] Webhook notifications
- [ ] Custom integrations
- [ ] SLA guarantees

---

## Resolved Design Decisions

**Event Editing:** Yes, creators can edit event details after creation. Changes propagate to all participants.

**Archival Policy:** Dynamic based on authentication:
- Anonymous events: 1 year retention
- Authenticated events: Forever (or configurable)

**Notifications:** Browser-based push notifications with granular preferences:
- "All updates" vs "Important only"
- Opt-in with clear privacy messaging

**Privacy:** All events are private by default. Magic links and access controls are potential pro features.

**Templates:** Simple date/time presets during event creation ("Next weekend", "Next week", "Monday to Friday").

**Calendar Integration:** Deferred - uncertain user need. May explore .ics export in Phase 7.

---

## Open Questions

- Should recurring event patterns be supported (e.g., "every Monday at 3pm")?
- What's the UX for notifying participants when the creator selects the final meeting time?
- Should there be a "finalize" action that locks the event?
