# JeevanSetu — AI-Assisted Healthcare Referral & Coordination Platform

This repository contains the complete development stack for the JeevanSetu concept: a healthcare referral platform that connects a healthcare requirement with a suitable available facility using capability, availability, urgency and location, then tracks the referral through its workflow.

## Folders
- `frontend/` — React + Vite landing/application UI.
- `backend/` — Express API + Socket.IO real-time layer.
- `backend/prisma/schema.sql` — PostgreSQL production schema blueprint.
- `docker-compose.yml` — local PostgreSQL service.
- `docs/` — architecture and implementation notes.

## Start frontend
```bash
cd frontend
npm install
npm run dev
```

## Start backend
```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Backend: http://localhost:5000/api/health
Frontend: http://localhost:5173

The current backend includes a development in-memory data store so the API can be demonstrated without configuring PostgreSQL first. The SQL schema is provided for the production database layer.

## Important production work
This is a working prototype foundation, not a certified healthcare production system. Before deployment with real patient data, add verified hospital onboarding, production database persistence, encryption/key management, consent/privacy controls, audit logging, backups, monitoring, rate limiting, secure secrets, legal/regulatory review, and validated clinical referral logic.
