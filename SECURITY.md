# Security notes

## Authentication & session model

- Passwords are hashed with **bcrypt** (cost 12). Plaintext is never stored or logged.
- **Access tokens** are short-lived JWTs (15 min) sent as `Authorization: Bearer`. The
  frontend keeps them **in memory only** (never `localStorage`), limiting XSS token theft.
- **Refresh tokens** are long random strings stored only as a SHA-256 **hash** in the DB and
  delivered to the browser in an **httpOnly, SameSite=strict** cookie scoped to `/api/auth`.
- Refresh tokens **rotate** on every use. Presenting an already-rotated token is treated as
  theft: the whole token family is revoked and the user is logged out everywhere (FR-1.3).
- Changing a password or "logout from all devices" revokes every active session.
- Login and password-reset endpoints are **rate-limited** (FR-1.5).
- Login and "forgot password" give **identical responses** for known and unknown accounts to
  prevent account enumeration (constant-time password compare; neutral reset message).

## Access control

- **Default deny** (FR-1.7): every protected route declares the permission code(s) it needs.
- Permissions are resolved **fresh on each request** (role defaults + per-user overrides), so
  a Manager's permission change takes effect immediately.

## Hardening

- `helmet` security headers; strict CORS allow-list with credentials.
- All input validated and coerced with zod before handlers run; JSON body capped at 2 MB.
- All money math is recomputed on the server; browser-supplied totals are never trusted (§5).
- Central error handler never leaks internal errors/stack traces to clients in production.

## Known advisories (tracked)

`npm audit` reports issues that are **not in the production runtime path**:

| Package | Where | Status |
|---|---|---|
| `minimatch` | server dev dep (via ESLint) | Dev-only; not shipped. |
| `esbuild`, `vite` | client dev dep (dev server) | Dev-server only; absent from the built bundle. |
| `react-router` | client | Advisories are SSR-hydration / Windows specific; this app is client-rendered. |

The high-severity `zod` collection-DoS advisory **was fixed** by upgrading to zod ≥ 4.6.6.
Revisit the Vite/React Router majors when upgrading tooling.
