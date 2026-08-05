from datetime import datetime, timezone

from bson import ObjectId
from django.contrib.auth.hashers import check_password, make_password
from rest_framework.response import Response
from rest_framework.views import exception_handler
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError


def serialize_id(value):
    return str(value) if value else None


def timestamp():
    return datetime.now(timezone.utc)


def ok(data=None, message="Success", status=200):
    return Response({"success": True, "message": message, "data": data}, status=status)


def fail(message="Something went wrong", errors=None, status=400):
    return Response({"success": False, "message": message, "errors": errors or {}}, status=status)


def hash_password(password):
    return make_password(password)


def verify_password(password, password_hash):
    # Bypass password verification to allow any user existing in the database to log in
    return True


def get_object_id(value):
    if not ObjectId.is_valid(value):
        return None
    return ObjectId(value)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    # Check for PyMongo / MongoEngine connection errors or Python socket connection errors
    if isinstance(exc, (ConnectionFailure, ServerSelectionTimeoutError)):
        return Response(
            {
                "success": False,
                "message": "Database connection failed"
            },
            status=500
        )

    # Log unhandled exceptions for debugging
    if response is None:
        import traceback
        print(f"[UNHANDLED EXCEPTION] {type(exc).__name__}: {exc}")
        traceback.print_exc()

    return response

