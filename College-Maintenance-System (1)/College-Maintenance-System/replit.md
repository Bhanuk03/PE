# CampusFix

## Overview

CampusFix is a campus maintenance ticket management system built as a React Native (Expo) mobile application with an Express.js backend. It allows students and staff to raise maintenance tickets (electrical, plumbing, carpentry issues) for campus buildings, and enables maintenance administrators to manage, assign workers to, and track those tickets through their lifecycle (new → pending → closed).

The app supports three user roles:
- **Students** — raise tickets and close them after resolution
- **Staff** — same capabilities as students
- **Maintenance Head (Admin)** — views all tickets, assigns workers, manages ticket statuses

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Screens**: Login (`index.tsx`), Student/Staff Dashboard (`dashboard.tsx`), Admin Dashboard (`admin-dashboard.tsx`), Raise Ticket (`raise-ticket.tsx`), Close Ticket (`close-ticket.tsx`), Ticket Detail (`ticket-detail.tsx`), Assign Worker (`assign-worker.tsx`)
- **State Management**: React Context API for auth (`lib/auth-context.tsx`) and tickets (`lib/ticket-context.tsx`), with TanStack React Query available for server-state
- **Local Storage**: AsyncStorage is used for persisting auth state and ticket data on-device
- **Styling**: Plain React Native StyleSheet with a centralized color theme in `constants/colors.ts`
- **UI Libraries**: expo-linear-gradient, expo-haptics, expo-image, expo-image-picker, react-native-gesture-handler, react-native-reanimated, react-native-keyboard-controller
- **Fonts**: Inter (400, 500, 600, 700) via @expo-google-fonts

### Backend (Express.js)
- **Location**: `server/` directory
- **Entry point**: `server/index.ts` — Express app with CORS setup supporting Replit domains and localhost
- **Routes**: `server/routes.ts` — currently a skeleton; routes should be prefixed with `/api`
- **Storage**: `server/storage.ts` — currently uses in-memory storage (`MemStorage`) with a `Map`; designed with an `IStorage` interface for easy swapping to database-backed storage
- **CORS**: Dynamically configured based on `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS` environment variables

### Database Schema (Drizzle ORM + PostgreSQL)
- **Schema file**: `shared/schema.ts` — defines a `users` table with `id` (UUID), `username`, and `password`
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Validation**: drizzle-zod for generating Zod schemas from Drizzle table definitions
- **Config**: `drizzle.config.ts` — reads `DATABASE_URL` env var, outputs migrations to `./migrations`
- **Current state**: The schema only has a basic users table. The ticket model currently lives entirely in the frontend context (`lib/ticket-context.tsx`) using AsyncStorage. The tickets schema needs to be migrated to the database for production use.
- **Push command**: `npm run db:push` runs `drizzle-kit push`

### Key Architectural Decisions

1. **Ticket data is currently client-side only** — Tickets are stored in AsyncStorage via React Context. This means data is not shared across devices/users. To make the admin dashboard functional in a multi-user environment, tickets need to be moved to the PostgreSQL database with proper API endpoints.

2. **Auth is client-side only** — The login flow stores user info in AsyncStorage without server-side session management. Admin login uses a hardcoded password check (client-side). For production, auth should be server-validated.

3. **Shared directory pattern** — `shared/schema.ts` contains database schemas and types shared between frontend and backend. Path alias `@shared/*` maps to `./shared/*`.

4. **Path aliases** — `@/*` maps to project root, `@shared/*` maps to `./shared/*` (configured in `tsconfig.json`).

5. **Build pipeline** — Custom build script at `scripts/build.js` handles static web builds. Server is built with esbuild (`server:build` script) and runs from `server_dist/`.

### Development Scripts
- `npm run expo:dev` — Start Expo dev server (configured for Replit)
- `npm run server:dev` — Start Express server in dev mode with tsx
- `npm run db:push` — Push Drizzle schema to PostgreSQL
- `npm run server:build` — Bundle server with esbuild
- `npm run server:prod` — Run production server

## External Dependencies

- **PostgreSQL** — Database (connected via `DATABASE_URL` env var), used with Drizzle ORM
- **AsyncStorage** — Local device storage for auth state and tickets (temporary solution)
- **Expo Services** — Image picker, haptics, crypto, location, splash screen, fonts
- **Replit Environment** — Uses `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, `REPLIT_INTERNAL_APP_DOMAIN` for CORS and URL configuration
- **TanStack React Query** — Available for server-state management (client configured in `lib/query-client.ts` with `getApiUrl()` helper)
- **Zod** — Schema validation, integrated with Drizzle via drizzle-zod