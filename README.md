# Carpediem

Premium College Event Management System built with React, Vite, Tailwind CSS, Django REST Framework, JWT, and MongoDB.

## Stack

- Frontend: React, Vite, JavaScript, Tailwind CSS, Framer Motion, Lucide React
- Backend: Django, Django REST Framework
- Database: MongoDB via MongoEngine
- Auth: JWT tokens signed by the Django backend

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py runserver
```

Set `MONGO_URI` in `backend/.env`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://127.0.0.1:8000/api` in `frontend/.env`.

## Deploy with Render

This repository includes `render.yaml` for deploying the API and frontend as two Render services.

1. Create a MongoDB Atlas database and copy its connection string.
2. In Render, choose **New > Blueprint**, connect this repository, and apply `render.yaml`.
3. Set the `MONGO_URI` secret on `carpediem-api`.
4. After the services are created, update `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `VITE_API_URL` in `render.yaml` if Render assigns different service URLs, then redeploy.

The frontend is configured with an SPA rewrite so routes such as `/dashboard`, `/admin`, and `/entry/...` work on refresh. The backend runs with Gunicorn; uploaded media remains on the service filesystem and should be moved to object storage before production use if uploads must persist across deploys.

## Default API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/events`
- `POST /api/events`
- `POST /api/registrations`
- `GET /api/admin/dashboard`

## MongoDB Note

Django's native ORM does not officially support MongoDB. This project uses MongoEngine document models for application data while keeping Django and DRF for routing, validation, permissions, and API structure.
    
