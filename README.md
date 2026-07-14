# Job Portal — Phase 1 (Auth Foundation)

Two independent services:

```
job-portal/
├── backend/     Express + TypeScript + MongoDB REST API
└── frontend/    Next.js + TypeScript + Tailwind
```

## Auth flow (how it works)

- **Access token**: short-lived (15 min), returned in the JSON response body,
  kept in memory on the client (a module variable in `apiClient.ts`) — never
  in `localStorage`, so it isn't readable by an XSS payload.
- **Refresh token**: long-lived (7 days), stored in an `httpOnly` cookie
  scoped to `/api/auth`. JavaScript on the client can never read it. Only sent
  automatically by the browser to `/api/auth/refresh` and `/api/auth/logout`.
- **On page load**: the access token is gone (memory reset), so the frontend
  silently calls `/api/auth/refresh` using the cookie to get a new one —
  this is what makes "stay logged in after refresh" work.
- **On 401**: `apiFetch` automatically calls `/api/auth/refresh` once and
  retries the original request. Concurrent 401s are de-duped into a single
  refresh call.
- **Token rotation**: every successful refresh issues a *new* refresh token
  and overwrites the cookie, limiting the window in which a stolen token is
  useful.
- **Revocation**: `User.tokenVersion` is checked against the refresh token's
  embedded version. Bump `tokenVersion` (e.g. on password change or a
  "log out everywhere" action) to invalidate every outstanding refresh token
  for that user instantly.
- **Roles**: `requireAuth` middleware verifies the access token;
  `requireRole(...roles)` gates specific routes (see `jobRoutes.ts` for an
  example of a recruiter-only endpoint).

## Running locally

### Backend
```bash
cd backend
cp .env.example .env     # fill in MONGO_URI with your own Atlas connection string and JWT secrets
npm install
npm run dev               # http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev               # http://localhost:3000
```

You'll need a free MongoDB Atlas cluster — create one, whitelist your IP
(or 0.0.0.0/0 for dev), and paste your own Atlas connection string into `MONGO_URI`.

## What's implemented

- [x] Register / login / logout
- [x] Access + refresh token flow with rotation and revocation
- [x] Role-based middleware (`jobseeker` / `recruiter` / `admin`)
- [x] Protected dashboard page with client-side redirect guard
- [x] Example role-gated route (`POST /api/jobs` — recruiters only)

## What's next

- Job model + full CRUD (replace the stub in `jobRoutes.ts`)
- Application model + apply flow, resume upload (Cloudinary/S3)
- Recruiter dashboard: view applicants, update status
- AI match scoring on application (Claude API, structured JSON output)
- Search/filter on job listing page
- Email notifications on status change
