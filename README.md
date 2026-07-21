# Online Answer Sheet Valuation and Evaluation Management System

This project is a production-ready skeleton for an online answer sheet valuation and evaluation management platform.

## Features
- Admin authentication with JWT
- Excel import for students, exams, answer sheets, answer keys, and evaluations
- Manual and equal distribution strategies for question allocation
- Unlock workflow for question evaluations
- Dashboard, reports, and audit logs

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT
- Multer + xlsx

## Run locally
1. Copy .env.example to .env
2. Start MongoDB (docker compose up -d)
3. npm install
4. npm run dev

## API Overview
- POST /api/admin/login
- GET /api/admin/dashboard
- POST /api/admin/excel/upload
- GET /api/admin/audit-logs
- POST /api/admin/evaluation/unlock
- POST /api/admin/configuration/distribution
- GET /api/admin/reports
