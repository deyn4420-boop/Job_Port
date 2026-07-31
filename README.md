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
cp .env.example .env     # fill in MONGO_URI and JWT secrets
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
(or 0.0.0.0/0 for dev), and paste the connection string into `MONGO_URI`.

## What's implemented

- [x] Register / login / logout
- [x] Access + refresh token flow with rotation and revocation
- [x] Role-based middleware (`jobseeker` / `recruiter` / `admin`)
- [x] Protected dashboard page with client-side redirect guard
- [x] Job CRUD with search, filters, and pagination
- [x] Ownership checks (only the recruiter who posted a job, or an admin, can edit/delete it)
- [x] Frontend: job listing page (search, filters, pagination), job detail page,
      recruiter "post a job" form, recruiter dashboard showing their own postings
- [x] Application model + apply flow: resume upload (local disk in dev), cover note,
      one-application-per-candidate-per-job enforced at the DB level
- [x] Recruiter applicant view per job, with status updates (applied → shortlisted/rejected/hired)
- [x] Job seeker's own application history with live status on the dashboard
- [x] AI match scoring: on apply, the resume is parsed and scored against the job
      description via Claude, producing a 0-100 match score, matched/missing skills,
      and a one-line summary — shown to the recruiter, sorted highest match first

### Application API

| Method | Route                              | Access              | Notes                                    |
|--------|-------------------------------------|----------------------|--------------------------------------------|
| POST   | `/api/applications/jobs/:jobId/apply` | Jobseeker           | `multipart/form-data`: `resume` (file, required), `coverNote` (optional) |
| GET    | `/api/applications/me`              | Jobseeker            | Own application history                    |
| GET    | `/api/applications/jobs/:jobId/applicants` | Owner recruiter/Admin | All applicants for one job posting  |
| PATCH  | `/api/applications/:id/status`      | Owner recruiter/Admin | Update status                              |

Resumes are stored on local disk under `backend/uploads/resumes/` in development
and served at `/uploads/resumes/<file>`. Swap `middleware/upload.ts`'s storage
engine for a Cloudinary/S3 multer adapter before deploying — nothing else in the
app needs to change since everything else only touches `resumeUrl`.

### AI match scoring — how it works

1. Candidate applies → the API responds immediately (201) once the `Application`
   is saved, so the upload isn't blocked on an LLM call.
2. In the background, `resumeParser.ts` extracts plain text from the uploaded
   PDF/DOCX (`pdf-parse` / `mammoth`).
3. `aiMatcher.ts` sends the resume text + job description + required skills to
   Claude with a system prompt demanding a structured JSON response (score,
   matched skills, missing skills, one-line summary). The response is validated
   before being trusted — malformed output is discarded, not guessed at.
4. The `Application` doc is updated with `matchScore`, `matchedSkills`,
   `missingSkills`, `matchSummary`.
5. Recruiters see applicants sorted by match score (highest first) on the
   applicants page, with a "Scoring..." badge for ones still processing (hit
   Refresh after a few seconds).

Requires `ANTHROPIC_API_KEY` in `backend/.env`. If it's missing, applications
still work fine — they just never get a score, and the recruiter view treats
that the same as "still scoring."

### Job API

| Method | Route              | Access                  | Notes                                      |
|--------|---------------------|--------------------------|---------------------------------------------|
| GET    | `/api/jobs`          | Public                  | Filters: `search`, `location`, `jobType`, `workMode`, `skills` (csv), `salaryMin`, `page`, `limit` |
| GET    | `/api/jobs/my-jobs`  | Recruiter/Admin          | Recruiter's own postings, including closed ones |
| GET    | `/api/jobs/:id`      | Public                  | Single job detail                           |
| POST   | `/api/jobs`          | Recruiter/Admin          | Create a job posting                        |
| PATCH  | `/api/jobs/:id`      | Owner recruiter/Admin    | Partial update, ownership-checked           |
| DELETE | `/api/jobs/:id`      | Owner recruiter/Admin    | Ownership-checked                           |

`search` uses a MongoDB text index across `title`, `description`, `skills`.

## What's next

- Edit-job form on the frontend (backend `PATCH /api/jobs/:id` already supports it)
- Email notifications on status change
- Swap local disk storage for Cloudinary/S3 before deploying
- Rate limiting / cost guard on the AI matching pipeline (currently one call per
  application — fine for a portfolio demo, worth capping before any real traffic)
