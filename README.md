# Job Portal

A full-stack job portal starter built with a Node.js/Express backend and a Next.js frontend. The project currently includes authentication, protected routes, role-based access, and a foundation for recruiter-only job operations.

## Overview

This project is designed as a modern full-stack application for connecting job seekers and recruiters. It currently focuses on the core authentication foundation and the API structure needed for future job and application features.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Express.js, TypeScript, MongoDB, Mongoose
- Auth: JWT access/refresh tokens with httpOnly cookies

## Features

- User registration and login
- Protected dashboard routes
- Access token + refresh token flow
- Token rotation and refresh revocation support
- Role-based middleware for jobseeker, recruiter, and admin users
- Example recruiter-only API route for job creation

## Project Structure

```text
job-portal/
├── backend/      Express + TypeScript + MongoDB API
└── frontend/     Next.js + TypeScript UI
```

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend runs at http://localhost:5000.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at http://localhost:3000.

### Environment Variables

Create a local backend environment file from the example and set your own values:

```bash
cd backend
cp .env.example .env
```

You will need:
- `MONGO_URI` with your own MongoDB connection string
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Authentication Flow

- Access tokens are short-lived and stored in memory on the client.
- Refresh tokens are stored in httpOnly cookies.
- The frontend silently refreshes the session when needed.
- Protected routes require valid authentication and may enforce roles.

## Roadmap

- Full job CRUD flow
- Job applications and applicant tracking
- Recruiter dashboard enhancements
- Search and filtering
- Notifications and email integration
