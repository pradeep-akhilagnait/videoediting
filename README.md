# Varna UPVC — Window Design & Quotation App

Internal web app for a UPVC window/door fabrication business (KN Fabricator). Staff draw
windows to size, get an automatic cut list from the supplier's cutting rules, and send a
priced GST quotation; later converting it to proforma → order → tax invoice → warranty.

See [`REQUIREMENTS.md`](./REQUIREMENTS.md) for the full feature specification.

## Tech stack

| Layer      | Choice                                                        |
|------------|---------------------------------------------------------------|
| Frontend   | React + TypeScript + Vite                                     |
| Backend    | Node.js + TypeScript + Express                                |
| Database   | MySQL (`varna_upvc_app`)                                       |
| ORM        | Prisma                                                         |
| Auth       | JWT access token + rotating refresh token, bcrypt password hash |

## Repository layout

```
server/   Node + Express + Prisma API (layered: config / lib / middleware / modules)
client/   React + Vite single-page app
data/     Reference data (village / pincode workbooks) — used later for address lookups
scripts/  One-off data-prep scripts
```

## Getting started

### 1. Backend

```bash
cd server
cp .env.example .env         # then fill in DATABASE_URL and the JWT secrets
npm install
npx prisma generate
npm run dev                  # starts the API on http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                  # starts the SPA on http://localhost:5173
```

## Working with the existing database

The production schema already lives in MySQL (`varna_upvc_app`). Prisma is configured to
**introspect** that database rather than own the schema:

```bash
cd server
npx prisma db pull           # regenerates prisma/schema.prisma from the live DB
npx prisma generate
```

Until the live database is reachable, `prisma/schema.prisma` ships with a small
**provisional** set of models (users, sessions, roles, permissions, audit log) so the API
compiles and runs. Running `prisma db pull` replaces them with the real tables.

## Project conventions

- **Server is the source of truth for all money math.** Values sent from the browser are
  recomputed on the server before anything is saved (see `REQUIREMENTS.md` §5).
- **Default deny.** Every protected route declares the permission code it needs; missing a
  permission is a 403.
- **Soft delete** for business records; master data is deactivated, never deleted.
- Money is stored and returned as decimal strings (never JS floats) to avoid rounding drift.
