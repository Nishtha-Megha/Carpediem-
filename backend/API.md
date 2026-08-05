# Carpedium API

All responses use:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

## Auth

### Register

`POST /api/auth/register`

```json
{
  "full_name": "Student Name",
  "email": "student@example.com",
  "password": "StrongPass123",
  "confirm_password": "StrongPass123"
}
```

### Login

`POST /api/auth/login`

```json
{
  "email": "student@example.com",
  "password": "StrongPass123"
}
```

### Refresh

`POST /api/auth/refresh`

```json
{
  "refresh": "refresh-token"
}
```

## Events

`GET /api/events`

Optional query params: `search`, `event_type`, `status`.

`POST /api/events` requires an admin JWT.

```json
{
  "name": "Neon Hack Summit",
  "description": "A 24-hour innovation event.",
  "banner_image": "https://example.com/banner.jpg",
  "date": "2026-08-12",
  "time": "10:00",
  "venue": "Innovation Dome",
  "registration_deadline": "2026-08-08",
  "event_type": "team",
  "category": "Technology",
  "maximum_seats": 80,
  "available_seats": 80,
  "status": "upcoming"
}
```

## Registrations

`POST /api/registrations` requires a user JWT.

```json
{
  "event_id": "mongo-object-id",
  "enrollment_number": "ENR001",
  "branch": "CSE",
  "college_name": "Carpedium College",
  "location": "Ahmedabad",
  "team_members": [
    {
      "name": "Member Name",
      "email": "member@example.com",
      "enrollment_number": "ENR002",
      "branch": "CSE",
      "college_name": "Carpedium College",
      "location": "Ahmedabad"
    }
  ]
}
```

## Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/events`
- `GET /api/admin/participants`

Admin endpoints require a JWT for a user whose `role` is `admin`.
