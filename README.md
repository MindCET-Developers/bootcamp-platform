# GESAwards Bootcamp Platform

Free, self-hosted content and data platform for the GESAwards Bootcamp app.

## Stack

- Next.js 16 frontend and server
- Payload CMS 3 admin panel and APIs
- PostgreSQL 17 in Docker
- Seoul Signal design direction (prototype direction 02)

Payload and PostgreSQL are open source. Local development requires no paid account or API key.

## Start locally

```bash
docker compose up -d postgres
pnpm dev
```

Open:

- App: http://localhost:3000
- Content admin: http://localhost:3000/admin
- REST API: http://localhost:3000/api
- GraphQL playground: http://localhost:3000/api/graphql-playground

If port 3000 is already occupied, Next.js prints the alternative port (usually 3001).

## Development login

- Email: `admin@gesawards.local`
- Password: `change-me-now`

Change both values before any shared or production deployment.

This login is only for the small CMS team. Attendees never create accounts. During local
development, the shared attendee code is `GESA26` (or `SEED_EVENT_CODE` from `.env`).

## Editable areas

- Program: Events, Event days, Sessions
- People: Speakers, Participants
- Engagement: Announcements, Feedback responses
- App: active event, directory and feedback toggles, Seoul Signal colors
- System: Media and admin users with admin/editor roles

Sessions and event days can be reordered by drag and drop. Events and sessions support drafts and version history.

## Attendee app

The root route is the production Next.js version of design direction 02, Seoul Signal. It reads live data from Payload and includes:

- Mobile-first Home, Agenda, People, and Me screens
- Countdown and current/upcoming session signal
- Multi-day timeline with session and speaker details
- Searchable participant directory
- Device-local attendee profiles submitted to Payload for approval
- Anonymous session feedback stored in PostgreSQL
- Keyboard focus states and reduced-motion support

Content edits made in `/admin` are reflected in the attendee app on the next request.
The shared event code can be changed in App settings. Only its salted hash is stored.
Attendee profile edit tokens stay in that device's local storage; there is intentionally no
recovery or cross-device sync.

## Seed from the HTML prototype

The seed command reads the data already embedded in `../bootcamp-app.html` and imports it safely. It is idempotent, so it can be run more than once.

```bash
pnpm seed
```

Current seed content: 1 event, 3 days, 18 sessions, 10 speakers, and 12 participants.

## Useful commands

```bash
pnpm generate:types
pnpm exec tsc --noEmit
pnpm lint
docker compose down
```

Use `docker compose down` to stop local services without deleting content. Add `-v` only when intentionally resetting the development database.

## Production note

The code does not require Payload Cloud. For a zero-cost pilot, connect `DATABASE_URL` to a PostgreSQL provider with a suitable free tier and deploy the Next.js server to a compatible free host. Free-tier terms change, so verify current limits before choosing a provider.
