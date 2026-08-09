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
    
