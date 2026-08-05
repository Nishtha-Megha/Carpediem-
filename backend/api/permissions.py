from rest_framework.permissions import BasePermission


ROLE_PERMISSIONS = {
    "super_admin": {"*"},
    "admin": {
        "dashboard.view",
        "events.view",
        "events.manage",
        "participants.view",
        "participants.manage",
        "reports.view",
        "users.manage",
        "roles.manage",
        "audit.view",
        "settings.manage",
    },
    "event_manager": {
        "dashboard.view",
        "events.view",
        "events.manage",
        "participants.view",
        "participants.manage",
        "reports.view",
        "audit.view",
    },
    "volunteer": {
        "dashboard.view",
        "participants.view",
        "participants.manage",
    },
    "viewer": {
        "dashboard.view",
        "events.view",
        "participants.view",
        "reports.view",
        "audit.view",
    },
}

ADMIN_ROLES = set(ROLE_PERMISSIONS)


def has_permission(user, permission):
    if not user:
        return False
    permissions = ROLE_PERMISSIONS.get(user.role, set())
    return "*" in permissions or permission in permissions


class IsAuthenticatedMongo(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user)


class IsAdminMongo(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role in ADMIN_ROLES)


class RBACPermission(BasePermission):
    def has_permission(self, request, view):
        required_permission = getattr(view, "required_permission", None)
        if not required_permission:
            return bool(request.user)
        return has_permission(request.user, required_permission)
