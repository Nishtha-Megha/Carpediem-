from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .documents import User


def create_token(user, token_type="access"):
    if token_type == "refresh":
        expires = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_DAYS)
    else:
        expires = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_MINUTES)

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "type": token_type,
        "exp": expires,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token, expected_type="access"):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationFailed("Token has expired") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationFailed("Invalid token") from exc

    if payload.get("type") != expected_type:
        raise AuthenticationFailed("Invalid token type")
    return payload


class MongoJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        user = User.objects(id=payload["sub"], is_active=True).first()
        if not user:
            raise AuthenticationFailed("User not found or blocked")
        return (user, None)
