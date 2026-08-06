from collections import Counter
from datetime import datetime, timedelta

from mongoengine import Q
from rest_framework.views import APIView

from rest_framework.response import Response
from rest_framework import status

from .auth import create_token, decode_token
from .documents import AuditLog, DashboardBanner, Event, Notification, Registration, TeamMember, User
from .permissions import ROLE_PERMISSIONS, IsAdminMongo, IsAuthenticatedMongo, RBACPermission, has_permission
from .serializers import (
    AdminUserSerializer,
    ChangePasswordSerializer,
    EventSerializer,
    LoginSerializer,
    PasswordResetSerializer,
    ProfileSerializer,
    RegisterSerializer,
    RegistrationSerializer,
    audit_log_to_dict,
    event_to_dict,
    notification_to_dict,
    registration_to_dict,
    user_to_dict,
)
from .utils import fail, hash_password, ok, timestamp, verify_password


def create_notification(user, category, title, message, entity="", entity_id=""):
    if not user:
        return None
    return Notification(
        user=user,
        category=category,
        title=title,
        message=message,
        entity=entity,
        entity_id=str(entity_id) if entity_id else "",
    ).save()


def notify_staff(category, title, message, permission="dashboard.view", entity="", entity_id=""):
    for staff in User.objects(role__in=list(ROLE_PERMISSIONS.keys()), is_active=True):
        if has_permission(staff, permission):
            create_notification(staff, category, title, message, entity, entity_id)


def log_audit(actor, action, entity, entity_id="", metadata=None):
    try:
        meta_list = []
        if metadata:
            for item in metadata:
                meta_list.append(str(item))
        AuditLog(
            actor=actor,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id else "",
            metadata=meta_list
        ).save()
    except Exception as e:
        pass


def sync_user_registrations(user, old_enrollment, old_email, updated_fields):
    """
    Keep stored enrollment references in sync with a user's profile.
    """
    if "enrollment_number" not in updated_fields or not old_enrollment:
        return

    # Registration profile values are derived from their referenced User document,
    # so only direct enrollment references need to be changed here.
    for member in TeamMember.objects(enrollment=old_enrollment):
        member.enrollment = user.enrollment_number
        member.save()

    for reg in Registration.objects(join_requests=old_enrollment):
        reg.join_requests = [
            user.enrollment_number if enrollment == old_enrollment else enrollment
            for enrollment in (reg.join_requests or [])
        ]
        reg.save()
    return

def update_team_completion_status(registration):
    if registration.registration_type == "team" and registration.event:
        max_size = registration.event.team_size
        active_count = 1 + sum(1 for m in registration.team_members if (m.invite_status if hasattr(m, "invite_status") else m.get("invite_status")) != "rejected")
        if active_count >= max_size:
            registration.looking_for_players = False


def _normalise_gender(value):
    """Return the canonical gender value used for team matching."""
    return str(value or "").strip().lower()


def _can_join_team(registration, player):
    """Teams recruiting players are single-gender teams."""
    # A registration can outlive its captain if the user was deleted. Treat
    # that orphaned team as unavailable instead of failing the whole listing.
    try:
        captain = registration.user
    except Exception:
        return False

    captain_gender = _normalise_gender(captain.gender if captain else "")
    player_gender = _normalise_gender(player.gender if player else "")
    return captain_gender in ("male", "female") and captain_gender == player_gender


def get_recent_activities():
    try:
        from .documents import AuditLog
        logs = AuditLog.objects.order_by("-created_at")[:30]
        recent_activities = []
        for log in logs:
            action = log.action
            entity = log.entity
            meta = log.metadata or []
            
            action_label = f"{entity.replace('_', ' ').title()} {action.title()}"
            item_name = meta[0] if meta else ""
            
            if action == "login":
                action_label = "Login"
                item_name = "User Session"
            elif action == "register":
                if entity == "team":
                    action_label = "Team Registered"
                    item_name = f"{meta[1]} ({meta[0]})" if len(meta) > 1 else meta[0]
                else:
                    action_label = "Student Registered"
                    item_name = meta[0] if meta else ""
            elif action == "archive":
                action_label = f"{entity.title()} Archived"
            elif action == "restore":
                action_label = f"{entity.title()} Restored"
                
            from mongoengine.errors import DoesNotExist
            actor_name = "System"
            try:
                if log.actor:
                    actor_name = log.actor.full_name
                elif meta and action == "login":
                    actor_name = meta[0]
            except DoesNotExist:
                if meta and action == "login":
                    actor_name = meta[0]

            recent_activities.append({
                "id": str(log.id),
                "action": action_label,
                "item_name": item_name,
                "user": actor_name,
                "timestamp": log.created_at.isoformat()
            })
        return recent_activities
    except Exception as e:
        return []


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return fail("Validation failed", serializer.errors)

        data = serializer.validated_data
        user = User(
            full_name=data["full_name"],
            email=data["email"],
            password_hash=hash_password(data["password"]),
            role="student",
        ).save()
        create_notification(user, "system", "Account created", "Welcome to Carpedium. Your account is ready.", "student", user.id)
        return ok(
            {
                "user": user_to_dict(user),
                "access": create_token(user),
                "refresh": create_token(user, "refresh"),
            },
            "Account created",
            201,
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return fail("Validation failed", serializer.errors)

        user = User.objects(email=serializer.validated_data["email"].lower()).first()
        if not user or not verify_password(serializer.validated_data["password"], user.password_hash):
            return fail("Invalid email or password", status=401)
        if not user.is_active:
            return fail("Your account is blocked", status=403)
        user.last_login = timestamp()
        history = list(user.login_history or [])
        history.append(timestamp().isoformat())
        user.login_history = history[-20:]
        user.save()
        log_audit(user, "login", "auth", user.id, [user.email])

        return ok(
            {
                "user": user_to_dict(user),
                "access": create_token(user),
                "refresh": create_token(user, "refresh"),
            },
            "Logged in",
        )


class RefreshView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return fail("Refresh token is required")
        payload = decode_token(refresh, "refresh")
        user = User.objects(id=payload["sub"], is_active=True).first()
        if not user:
            return fail("User not found", status=401)
        return ok({"access": create_token(user)})


class LogoutView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request):
        log_audit(request.user, "logout", "auth", request.user.id, [request.user.email])
        return ok(message="Logged out")


class ProfileView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        return ok(user_to_dict(request.user))

    def put(self, request):
        serializer = ProfileSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return fail("Validation failed", serializer.errors)
        email = serializer.validated_data.get("email")
        if email and email != request.user.email and User.objects(email=email).first():
            return fail("Email already exists", {"email": ["Email already exists."]})
        
        enrollment_number = serializer.validated_data.get("enrollment_number")
        if enrollment_number and enrollment_number != request.user.enrollment_number:
            if User.objects(enrollment_number__iexact=enrollment_number.strip()).first():
                return fail("Enrollment number already exists", {"enrollment_number": ["Enrollment number already exists."]})
        
        old_enrollment = request.user.enrollment_number
        old_email = request.user.email

        for field, value in serializer.validated_data.items():
            setattr(request.user, field, value)
        request.user.updated_at = timestamp()
        request.user.save()

        # Synchronize details to all associated Registration documents
        sync_user_registrations(request.user, old_enrollment, old_email, list(serializer.validated_data.keys()))

        log_audit(request.user, "settings_update", "user", request.user.id, list(serializer.validated_data.keys()))
        return ok(user_to_dict(request.user), "Profile updated")


class UserEnrollmentListView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        # Player accounts may be stored as either `student` (new signups) or
        # `user` (imported/legacy accounts). Include both in team registration.
        users = User.objects(
            role__in=("student", "user"),
            is_active=True,
        ).order_by("enrollment_number")
        return ok([user_to_dict(user) for user in users])


class NotificationListView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        unread = request.query_params.get("unread")
        notifications = Notification.objects(user=request.user)
        if unread in ("true", "false"):
            notifications = notifications.filter(is_read=unread == "false")
        notifications = notifications.order_by("-created_at")
        return ok(
            {
                "items": [notification_to_dict(item) for item in notifications[:40]],
                "unread_count": Notification.objects(user=request.user, is_read=False).count(),
            }
        )


class NotificationActionView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request, action):
        if action == "read-all":
            Notification.objects(user=request.user, is_read=False).update(set__is_read=True)
            return ok({"unread_count": 0}, "All notifications marked read")
        return fail("Unsupported notification action", status=400)


class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get_notification(self, request, notification_id):
        return Notification.objects(id=notification_id, user=request.user).first()

    def post(self, request, notification_id, action):
        notification = self.get_notification(request, notification_id)
        if not notification:
            return fail("Notification not found", status=404)
        if action == "read":
            notification.is_read = True
            notification.save()
            return ok(notification_to_dict(notification), "Notification marked read")
        return fail("Unsupported notification action", status=400)

    def delete(self, request, notification_id):
        notification = self.get_notification(request, notification_id)
        if not notification:
            return fail("Notification not found", status=404)
        notification.delete()
        return ok(message="Notification deleted")


class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return ok({"query": query, "results": []})

        results = []

        events = Event.objects(
            Q(name__icontains=query)
            | Q(category__icontains=query)
            | Q(venue__icontains=query)
            | Q(coordinator__icontains=query)
        ).order_by("date")[:6]
        for event in events:
            results.append(
                {
                    "id": str(event.id),
                    "type": "event",
                    "title": event.name,
                    "subtitle": f"{event.category} - {event.venue}",
                    "url": f"/admin/events/{event.id}" if request.user.role in ROLE_PERMISSIONS else "/dashboard",
                }
            )

        if has_permission(request.user, "users.manage"):
            users = User.objects(
                Q(full_name__icontains=query)
                | Q(email__icontains=query)
                | Q(phone__icontains=query)
                | Q(branch__icontains=query)
                | Q(college_name__icontains=query)
            ).order_by("full_name")[:6]
            for user in users:
                results.append(
                    {
                        "id": str(user.id),
                        "type": "user",
                        "title": user.full_name,
                        "subtitle": f"{user.email} - {user.role}",
                        "url": "/admin",
                    }
                )

        if has_permission(request.user, "participants.view"):
            registrations = Registration.objects(
                Q(enrollment_number__icontains=query)
                | Q(branch__icontains=query)
                | Q(college_name__icontains=query)
                | Q(location__icontains=query)
            ).order_by("-created_at")[:6]
            for registration in registrations:
                results.append(
                    {
                        "id": str(registration.id),
                        "type": "participant",
                        "title": registration.user.full_name,
                        "subtitle": f"{registration.event.name} - {registration.branch}",
                        "url": "/admin",
                    }
                )

        if has_permission(request.user, "reports.view"):
            report_items = [
                ("Registration Trend", "Daily registrations over selected date range"),
                ("Attendance Trend", "Present participants compared with registrations"),
                ("Branch Comparison", "Registrations grouped by branch"),
                ("College Comparison", "Registrations grouped by college"),
                ("Top Events", "Events ranked by registration count"),
                ("Category Distribution", "Events grouped by category"),
            ]
            for title, subtitle in report_items:
                if query.lower() in f"{title} {subtitle}".lower():
                    results.append(
                        {
                            "id": title.lower().replace(" ", "-"),
                            "type": "report",
                            "title": title,
                            "subtitle": subtitle,
                            "url": "/admin",
                        }
                    )

        return ok({"query": query, "results": results[:20]})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return fail("Validation failed", serializer.errors)
        data = serializer.validated_data
        if not verify_password(data["current_password"], request.user.password_hash):
            return fail("Current password is incorrect", status=400)
        request.user.password_hash = hash_password(data["new_password"])
        request.user.updated_at = timestamp()
        request.user.save()
        create_notification(request.user, "system", "Password changed", "Your account password was updated.", "user", request.user.id)
        log_audit(request.user, "settings_update", "password", request.user.id, ["password_changed"])
        return ok(message="Password changed")


class AdminSystemSettingsView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "settings.manage"

    def get(self, request):
        return ok(
            {
                "api": "127.0.0.1:8000/api",
                "database": "MongoDB",
                "storage": "MongoDB documents and browser-generated exports",
                "email": "Not configured",
            }
        )


class DashboardBannerView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        banner = DashboardBanner.objects.first()
        if not banner:
            banner = DashboardBanner().save()
        return ok({
            "title": banner.title,
            "event_dates": banner.event_dates,
            "venue": banner.venue,
            "registration_deadline": banner.registration_deadline,
        })

    def put(self, request):
        if not has_permission(request.user, "settings.manage"):
            return fail("Admin access required", status=403)
        banner = DashboardBanner.objects.first() or DashboardBanner()
        for field in ("title", "event_dates", "venue", "registration_deadline"):
            if field in request.data:
                setattr(banner, field, str(request.data.get(field) or "").strip())
        banner.updated_at = timestamp()
        banner.save()
        return ok({
            "title": banner.title,
            "event_dates": banner.event_dates,
            "venue": banner.venue,
            "registration_deadline": banner.registration_deadline,
        }, "Dashboard banner updated")


class AdminRolesView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "roles.manage"

    def get(self, request):
        labels = {
            "super_admin": "Super Admin",
            "admin": "Admin",
            "event_manager": "Event Manager",
            "volunteer": "Volunteer",
            "viewer": "Viewer",
        }
        return ok(
            [
                {
                    "id": role,
                    "name": labels.get(role, role.title()),
                    "permissions": sorted(list(permissions)),
                    "users": User.objects(role=role).count(),
                }
                for role, permissions in ROLE_PERMISSIONS.items()
            ]
        )



class EventListCreateView(APIView):
    def get(self, request):
        query = request.query_params.get("search", "")
        event_type = request.query_params.get("event_type")
        status = request.query_params.get("status")
        category = request.query_params.get("category")
        archived = request.query_params.get("archived")
        published = request.query_params.get("published")
        sort = request.query_params.get("sort", "date")
        events = Event.objects
        if query:
            events = events.filter(
                Q(name__icontains=query)
                | Q(venue__icontains=query)
                | Q(category__icontains=query)
                | Q(coordinator__icontains=query)
            )
        if event_type:
            events = events.filter(event_type=event_type)
        if status:
            events = events.filter(status=status)
        if category:
            events = events.filter(category__icontains=category)
        if archived in ("true", "false"):
            events = events.filter(is_archived=archived == "true")
        if published in ("true", "false"):
            events = events.filter(is_published=published == "true")
        allowed_sorts = {"date", "-date", "name", "-name", "created_at", "-created_at", "available_seats", "-available_seats"}
        if sort not in allowed_sorts:
            sort = "date"
        return ok([event_to_dict(event) for event in events.order_by(sort)])

    def post(self, request):
        if not has_permission(request.user, "events.manage"):
            return fail("Admin access required", status=403)
        serializer = EventSerializer(data=request.data)
        if not serializer.is_valid():
            return fail("Validation failed", serializer.errors)
        data = serializer.validated_data
        data["available_seats"] = data.get("available_seats", data["maximum_seats"])
        data["team_size"] = data.get("team_size", 1 if data["event_type"] == "individual" else 2)
        data["maximum_teams"] = data.get("maximum_teams", 0)
        event = Event(**data, created_by=request.user).save()
        notify_staff("event", "Event created", f"{event.name} was created.", "events.view", "event", event.id)
        entity_type = "sport" if event.category in ("Boys", "Girls", "Both") else "event"
        log_audit(request.user, "create", entity_type, event.id, [event.name])
        return ok(event_to_dict(event), "Event created", 201)


class EventDetailView(APIView):
    def get_event(self, event_id):
        return Event.objects(id=event_id).first()

    def get(self, request, event_id):
        event = self.get_event(event_id)
        if not event:
            return fail("Event not found", status=404)
        return ok(event_to_dict(event))

    def put(self, request, event_id):
        if not has_permission(request.user, "events.manage"):
            return fail("Admin access required", status=403)
        event = self.get_event(event_id)
        if not event:
            return fail("Event not found", status=404)
        # Normalize incoming data to avoid common validation errors (strings for ints/bools)
        incoming = dict(request.data) if request.data is not None else {}
        # Coerce integer fields
        int_fields = ["team_size", "registration_fee", "maximum_teams", "maximum_seats", "available_seats"]
        for f in int_fields:
            if f in incoming:
                try:
                    val = incoming.get(f)
                    if isinstance(val, str) and val.strip() == "":
                        # remove empty strings to allow partial updates
                        incoming.pop(f, None)
                    else:
                        incoming[f] = int(val)
                except Exception:
                    # leave original value; serializer will report exact error
                    pass
        # Coerce boolean fields
        bool_fields = ["is_archived", "is_published"]
        for f in bool_fields:
            if f in incoming:
                v = incoming.get(f)
                if isinstance(v, str):
                    incoming[f] = v.lower() == "true"
                else:
                    incoming[f] = bool(v)
        # Normalize event_type casing
        if "event_type" in incoming and isinstance(incoming["event_type"], str):
            incoming["event_type"] = incoming["event_type"].lower()

        # Convert explicit nulls for optional text fields to empty string to satisfy CharField (allow_blank=True)
        optional_text_fields = [
            "banner_image",
            "registration_deadline",
            "category",
            "coordinator",
            "rules",
            "faq",
            "prize_details",
        ]
        for f in optional_text_fields:
            if f in incoming and incoming[f] is None:
                incoming[f] = ""

        serializer = EventSerializer(data=incoming, partial=True)
        if not serializer.is_valid():
            # Log validation errors to server console for debugging
            try:
                print("[Event update] Validation errors:", serializer.errors)
            except Exception:
                pass
            return fail("Validation failed", serializer.errors)
        for field, value in serializer.validated_data.items():
            setattr(event, field, value)
        event.updated_at = timestamp()
        event.save()
        notify_staff("event", "Event updated", f"{event.name} was updated.", "events.view", "event", event.id)
        entity_type = "sport" if event.category in ("Boys", "Girls", "Both") else "event"
        log_audit(request.user, "update", entity_type, event.id, [event.name])
        return ok(event_to_dict(event), "Event updated")

    def delete(self, request, event_id):
        if not has_permission(request.user, "events.manage"):
            return fail("Admin access required", status=403)
        event = self.get_event(event_id)
        if not event:
            return fail("Event not found", status=404)
        entity_type = "sport" if event.category in ("Boys", "Girls", "Both") else "event"
        event_name = event.name
        event.delete()
        notify_staff("event", "Event deleted", f"{event_name} was deleted.", "events.view", "event", event_id)
        log_audit(request.user, "delete", entity_type, event_id, [event_name])
        return ok(message="Event deleted")


class EventFullDetailView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "events.view"

    def get(self, request, event_id):
        event = Event.objects(id=event_id).first()
        if not event:
            return fail("Event not found", status=404)

        registrations = list(Registration.objects(event=event).order_by("-created_at"))
        total_registrations = len(registrations)
        total_participants = sum(1 + len(item.team_members) for item in registrations)
        team_registrations = [item for item in registrations if item.registration_type == "team"]
        attended_registrations = [item for item in registrations if item.attended]
        attended_people = sum(1 + len(item.team_members) for item in attended_registrations)
        revenue = sum(event.registration_fee for _ in registrations)
        occupancy = round((total_participants / event.maximum_seats) * 100, 1) if event.maximum_seats else 0
        attendance_percent = round((attended_people / total_participants) * 100, 1) if total_participants else 0
        branch_counts = Counter(item.branch or "Unknown" for item in registrations)
        college_counts = Counter(item.college_name or "Unknown" for item in registrations)

        teams = []
        for item in team_registrations:
            teams.append(
                {
                    "id": str(item.id),
                    "name": f"{item.user.full_name}'s Team",
                    "captain": user_to_dict(item.user),
                    "members": [member.to_mongo().to_dict() for member in item.team_members],
                    "size": 1 + len(item.team_members),
                    "attended": item.attended,
                    "created_at": item.created_at.isoformat(),
                }
            )

        certificates = []

        gallery = []
        if event.banner_image:
            gallery.append({"id": "banner", "title": "Event Banner", "image": event.banner_image})

        schedule = [
            {"label": "Registration Deadline", "date": event.registration_deadline or event.date, "time": "23:59"},
            {"label": "Participant Check-in", "date": event.date, "time": event.time},
            {"label": "Event Starts", "date": event.date, "time": event.time},
        ]

        rules = [line.strip() for line in (event.rules or "").splitlines() if line.strip()]
        if not rules and event.rules:
            rules = [event.rules]

        return ok(
            {
                "overview": event_to_dict(event),
                "participants": [registration_to_dict(item) for item in registrations],
                "teams": teams,
                "analytics": {
                    "total_registrations": total_registrations,
                    "total_participants": total_participants,
                    "team_count": len(team_registrations),
                    "individual_count": total_registrations - len(team_registrations),
                    "revenue": revenue,
                    "occupancy_rate": occupancy,
                    "available_seats": event.available_seats,
                    "branch_distribution": [{"name": key, "value": value} for key, value in branch_counts.most_common(8)],
                    "college_distribution": [{"name": key, "value": value} for key, value in college_counts.most_common(8)],
                },
                "attendance": {
                    "attended_registrations": len(attended_registrations),
                    "attended_people": attended_people,
                    "attendance_percent": attendance_percent,
                    "absent_people": max(total_participants - attended_people, 0),
                },
                "certificates": certificates,
                "gallery": gallery,
                "schedule": schedule,
                "rules": rules,
            }
        )


class EventActionView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "events.manage"

    def post(self, request, event_id, action):
        event = Event.objects(id=event_id).first()
        if not event:
            return fail("Event not found", status=404)

        if action == "duplicate":
            payload = {
                "name": f"{event.name} Copy",
                "description": event.description,
                "banner_image": event.banner_image,
                "date": event.date,
                "time": event.time,
                "venue": event.venue,
                "registration_deadline": event.registration_deadline,
                "event_type": event.event_type,
                "category": event.category,
                "coordinator": event.coordinator,
                "team_size": event.team_size,
                "registration_fee": event.registration_fee,
                "maximum_teams": event.maximum_teams,
                "maximum_seats": event.maximum_seats,
                "available_seats": event.available_seats,
                "rules": event.rules,
                "faq": event.faq,
                "prize_details": event.prize_details,
                "status": event.status,
                "is_archived": False,
                "is_published": event.is_published,
                "created_by": request.user,
                "created_at": timestamp(),
                "updated_at": timestamp(),
            }
            duplicate = Event(**payload).save()
            notify_staff("event", "Event duplicated", f"{duplicate.name} was created from {event.name}.", "events.view", "event", duplicate.id)
            log_audit(request.user, "create", "event", duplicate.id, ["duplicated", event.name])
            return ok(event_to_dict(duplicate), "Event duplicated", 201)

        if action == "archive":
            event.is_archived = True
            event.is_published = False
            event.updated_at = timestamp()
            event.save()
            notify_staff("event", "Event archived", f"{event.name} was archived.", "events.view", "event", event.id)
            entity_type = "sport" if event.category in ("Boys", "Girls", "Both") else "event"
            log_audit(request.user, "archive", entity_type, event.id, [event.name])
            return ok(event_to_dict(event), "Event archived")

        if action == "restore":
            event.is_archived = False
            event.updated_at = timestamp()
            event.save()
            notify_staff("event", "Event restored", f"{event.name} was restored.", "events.view", "event", event.id)
            entity_type = "sport" if event.category in ("Boys", "Girls", "Both") else "event"
            log_audit(request.user, "restore", entity_type, event.id, [event.name])
            return ok(event_to_dict(event), "Event restored")

        if action == "publish":
            event.is_published = True
            event.is_archived = False
            event.updated_at = timestamp()
            event.save()
            notify_staff("event", "Event published", f"{event.name} is now published.", "events.view", "event", event.id)
            log_audit(request.user, "update", "event", event.id, ["published"])
            return ok(event_to_dict(event), "Event published")

        if action == "close-registration":
            event.available_seats = 0
            event.updated_at = timestamp()
            event.save()
            notify_staff("event", "Registration closed", f"Registration was closed for {event.name}.", "events.view", "event", event.id)
            log_audit(request.user, "update", "event", event.id, ["registration_closed"])
            return ok(event_to_dict(event), "Registration closed")

        return fail("Unsupported event action", status=400)


class EventBulkActionView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "events.manage"

    def post(self, request, action):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list) or not ids:
            return fail("Select at least one event.")

        events = Event.objects(id__in=ids)
        count = events.count()
        if action == "delete":
            events.delete()
            log_audit(request.user, "delete", "event", "bulk", [f"{count} events"])
            return ok({"count": count}, "Events deleted")
        if action == "publish":
            events.update(set__is_published=True, set__is_archived=False, set__updated_at=timestamp())
            log_audit(request.user, "update", "event", "bulk", [f"{count} events published"])
            return ok({"count": count}, "Events published")
        return fail("Unsupported bulk action", status=400)


class RegistrationListCreateView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def get(self, request):
        from mongoengine import Q
        from mongoengine.errors import DoesNotExist

        looking_for_players = request.query_params.get("looking_for_players")

        if looking_for_players is not None:
            is_looking = looking_for_players.lower() in ("true", "1")
            registrations = Registration.objects(
                looking_for_players=is_looking
            )

            # Team Finder must only expose teams made by users of the same
            # gender as the currently logged-in player.
            if is_looking:
                registrations = [
                    registration
                    for registration in registrations
                    if _can_join_team(registration, request.user)
                ]
        else:
            registrations = Registration.objects

            if request.user.role not in ROLE_PERMISSIONS:
                my_teams = []

                for m in TeamMember.objects(userId=request.user):
                    try:
                        if m.teamId:
                            my_teams.append(m.teamId)
                    except DoesNotExist:
                        pass

                registrations = registrations.filter(
                    Q(user=request.user) | Q(team__in=my_teams)
                )

        if hasattr(registrations, "order_by"):
            registrations = registrations.order_by("-created_at")
        else:
            registrations = sorted(
                registrations,
                key=lambda registration: registration.created_at,
                reverse=True,
            )

        return ok([registration_to_dict(item) for item in registrations])

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)

        if not serializer.is_valid():
            return fail("Validation failed", serializer.errors)

        u = request.user

        if not (
            u.enrollment_number
            and u.branch
            and u.phone
            and u.location
            and u.gender
        ):
            return fail(
                "Please complete your profile details (Enrollment Number, Branch, Phone, Location, and Gender) before registering."
            )

        data = serializer.validated_data
        event = data["event"]

        # Do not allow a known opposite-gender player to be added directly to
        # a team. Legacy records with an unknown/Other gender remain eligible.
        if event.event_type == "team":
            captain_gender = _normalise_gender(u.gender)
            if captain_gender in ("male", "female"):
                for member in data.get("team_members", []):
                    member_user = User.objects(
                        enrollment_number=member["enrollment_number"]
                    ).first()
                    member_gender = _normalise_gender(member_user.gender if member_user else "")
                    if member_gender in ("male", "female") and member_gender != captain_gender:
                        return fail("A team can only contain players of the same gender.", status=403)

        if Registration.objects(user=request.user, event=event).first():
            return fail("You are already registered for this event")

        from mongoengine import Q
        from mongoengine.errors import DoesNotExist

        my_teams = []

        for m in TeamMember.objects(userId=request.user):
            try:
                if m.teamId:
                    my_teams.append(m.teamId)
            except DoesNotExist:
                pass

        existing_regs = Registration.objects(
            Q(user=request.user) | Q(team__in=my_teams)
        )

        for r in existing_regs:
            if str(r.status or "").lower() in ("rejected", "cancelled"):
                continue
            e = r.event

            if e and e.id != event.id:

                e_date = (
                    e.date.strftime("%Y-%m-%d")
                    if hasattr(e.date, "strftime")
                    else str(e.date or "")
                )

                event_date = (
                    event.date.strftime("%Y-%m-%d")
                    if hasattr(event.date, "strftime")
                    else str(event.date or "")
                )

                e_time = (e.time or "").strip().lower()
                event_time = (event.time or "").strip().lower()

                if e_date == event_date and e_time == event_time:
                    return fail(
                        f"Schedule conflict: You are already registered for '{e.name}'."
                    )

        is_waitlisted = False
        waitlist_pos = 0

        if event.available_seats <= 0:
            is_waitlisted = True
            waitlist_pos = (
                Registration.objects(
                    event=event,
                    status="waitlisted"
                ).count()
                + 1
            )

        registration = Registration(
            user=request.user,
            event=event,
            registration_type=event.event_type,
            looking_for_players=data.get("looking_for_players", False),
            waitlist_position=waitlist_pos,
            status="waitlisted" if is_waitlisted else "Pending",
        )

        registration.team_name = data.get("team_name")

        registration.save()

        update_team_completion_status(registration)
        registration.save()

        if not is_waitlisted:
            event.available_seats = max(event.available_seats - 1, 0)
            event.updated_at = timestamp()
            event.save()

        log_audit(
            request.user,
            "register",
            "registration",
            registration.id,
            [event.name]
        )

        create_notification(
            request.user,
            "registration",
            "Registration Successful",
            f"You registered for {event.name}.",
            "registration",
            registration.id,
        )

        notify_staff(
            "registration",
            "New Registration",
            f"{request.user.full_name} registered for {event.name}.",
            "participants.view",
            "registration",
            registration.id,
        )

        return ok(
            registration_to_dict(registration),
            "Registration successful",
            201,
        )
            
class RegistrationDetailView(APIView):
        permission_classes = [IsAuthenticatedMongo]

        def delete(self, request, registration_id):
            registration = Registration.objects(id=registration_id).first()
            if not registration:
                return fail("Registration not found", status=404)
            if request.user.role not in ROLE_PERMISSIONS and registration.user.id != request.user.id:
                return fail("You cannot delete this registration", status=403)
            
            event = registration.event
            was_registered = (registration.status == "registered")
            registration_name = event.name
            registration.delete()

            if was_registered:
                # Check for next waitlisted team/individual for this event
                next_waitlisted = Registration.objects(event=event, status="waitlisted").order_by("waitlist_position").first()
                if next_waitlisted:
                    next_waitlisted.status = "registered"
                    next_waitlisted.waitlist_position = 0
                    next_waitlisted.save()
                    
                    # Notify the user
                    create_notification(
                        next_waitlisted.user,
                        "registration",
                        "Waitlist Promotion",
                        f"Good news! You have been promoted from waitlist to registered for {event.name}.",
                        "registration",
                        str(next_waitlisted.id)
                    )
                    # Re-index remaining waitlist positions
                    remaining = Registration.objects(event=event, status="waitlisted").order_by("waitlist_position")
                    for pos, r in enumerate(remaining, start=1):
                        r.waitlist_position = pos
                        r.save()
                else:
                    event.available_seats += 1
                    event.save()

            log_audit(request.user, "delete", "registration", registration_id, [registration_name])
            return ok(message="Registration deleted")

        def put(self, request, registration_id):
            registration = Registration.objects(id=registration_id).first()

            if not registration:
                return fail("Registration not found", status=404)

            if (
                request.user.role not in ROLE_PERMISSIONS
                and registration.user.id != request.user.id
            ):
                return fail("You cannot update this registration", status=403)

            looking_for_players = request.data.get("looking_for_players")
            if looking_for_players is not None:
                registration.looking_for_players = bool(looking_for_players)

            team_members_data = request.data.get("team_members")

            if team_members_data is not None and registration.team:

                existing_members = {
                    m.enrollment: m
                    for m in TeamMember.objects(teamId=registration.team)
                }

                for member in team_members_data:

                    enrollment = member.get("enrollment_number")
                    if not enrollment:
                        continue

                    invite_status = member.get("invite_status", "pending")

                    existing_member = existing_members.get(enrollment)

                    if existing_member:
                        existing_member.invite_status = invite_status
                        existing_member.college_name = member.get(
                            "college_name",
                            existing_member.college_name,
                        )
                        existing_member.location = member.get(
                            "location",
                            existing_member.location,
                        )
                        existing_member.save()

                    else:
                        invited_user = User.objects(
                            enrollment_number=enrollment
                        ).first()

                        TeamMember(
                            teamId=registration.team,
                            userId=invited_user,
                            enrollment=enrollment,
                            isCaptain=False,
                            college_name=member.get(
                                "college_name",
                                "LJ University",
                            ),
                            location=member.get(
                                "location",
                                "",
                            ),
                            invite_status=invite_status,
                        ).save()

            update_team_completion_status(registration)
            registration.save()

            return ok(
                registration_to_dict(registration),
                "Registration updated successfully",
            )

class AdminDashboardView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "dashboard.view"

    def get(self, request):
        total_users = User.objects(role="student").count()
        total_events = Event.objects.count()
        registrations = Registration.objects.count()
        available_seats = sum(event.available_seats for event in Event.objects)
        return ok(
            {
                "total_users": total_users,
                "total_events": total_events,
                "total_registrations": registrations,
                "available_seats": available_seats,
                "upcoming_events": Event.objects(status="upcoming").count(),
                "completed_events": Event.objects(status="completed").count(),
                "recent_activities": get_recent_activities(),
            }
        )


class AdminAnalyticsView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "reports.view"

    def get(self, request):
        def aware(value):
            if value.tzinfo is None:
                return value.replace(tzinfo=now.tzinfo)
            return value

        def parse_date(value, fallback):
            if not value:
                return fallback
            try:
                return datetime.fromisoformat(value).replace(tzinfo=fallback.tzinfo)
            except ValueError:
                return fallback

        now = timestamp()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)
        yesterday_start = today_start - timedelta(days=1)
        range_start = parse_date(request.query_params.get("start"), today_start - timedelta(days=6))
        range_end = parse_date(request.query_params.get("end"), today_start)
        range_start = range_start.replace(hour=0, minute=0, second=0, microsecond=0)
        range_end = range_end.replace(hour=23, minute=59, second=59, microsecond=999999)
        if range_end < range_start:
            range_start, range_end = range_end, range_start

        events = list(Event.objects)
        
        # Safely load registrations while ignoring any orphan references
        all_registrations = []
        from mongoengine.errors import DoesNotExist
        for item in Registration.objects.order_by("-created_at"):
            try:
                if item.event and item.user:
                    all_registrations.append(item)
            except DoesNotExist:
                pass

        registrations = [item for item in all_registrations if range_start <= aware(item.created_at) <= range_end]
        todays_registrations = [item for item in all_registrations if today_start <= aware(item.created_at) < tomorrow_start]
        yesterday_registrations = [item for item in all_registrations if yesterday_start <= aware(item.created_at) < today_start]

        total_capacity = sum(event.maximum_seats for event in events)
        occupied_seats = sum(max(event.maximum_seats - event.available_seats, 0) for event in events)
        occupancy_rate = round((occupied_seats / total_capacity) * 100, 1) if total_capacity else 0

        if yesterday_registrations:
            growth = ((len(todays_registrations) - len(yesterday_registrations)) / len(yesterday_registrations)) * 100
        else:
            growth = 100 if todays_registrations else 0

        trend = []
        attendance_trend = []
        total_days = min((range_end.date() - range_start.date()).days, 30)
        for offset in range(total_days + 1):
            day_start = range_start.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=offset)
            day_end = day_start + timedelta(days=1)
            day_registrations = [item for item in registrations if day_start <= aware(item.created_at) < day_end]
            trend.append(
                {
                    "label": day_start.strftime("%d %b"),
                    "registrations": len(day_registrations),
                }
            )
            attendance_trend.append(
                {
                    "label": day_start.strftime("%d %b"),
                    "registrations": len(day_registrations),
                    "attended": sum(1 for item in day_registrations if item.attended),
                }
            )

        per_hour = []
        for hour in range(24):
            per_hour.append(
                {
                    "label": f"{hour:02d}:00",
                    "registrations": sum(1 for item in todays_registrations if aware(item.created_at).hour == hour),
                }
            )

        event_counts = Counter(str(item.event.id) for item in registrations)
        event_lookup = {str(event.id): event for event in events}
        ranked_events = sorted(event_counts.items(), key=lambda pair: pair[1], reverse=True)
        top_events = [
            {"id": event_id, "name": event_lookup[event_id].name, "registrations": count}
            for event_id, count in ranked_events[:5]
            if event_id in event_lookup
        ]
        lowest_event = None
        if ranked_events:
            event_id, count = ranked_events[-1]
            if event_id in event_lookup:
                lowest_event = {"id": event_id, "name": event_lookup[event_id].name, "registrations": count}

        status_counts = Counter(event.status for event in events)
        category_counts = Counter(event.category for event in events)
        branch_counts = Counter(item.branch or "Unknown" for item in registrations)
        college_counts = Counter(item.college_name or "Unknown" for item in registrations)
        gender_counts = Counter((item.user.gender or "other") for item in registrations)
        attended_count = sum(1 for item in registrations if item.attended)
        revenue = sum(item.event.registration_fee for item in registrations)

        recent_activities = get_recent_activities()

        return ok(
            {
                "cards": {
                    "todays_registrations": len(todays_registrations),
                    "ongoing_events": Event.objects(status="ongoing").count(),
                    "registration_growth_percent": round(growth, 1),
                    "occupancy_rate": occupancy_rate,
                    "attendance_percent": round((attended_count / len(registrations)) * 100, 1) if registrations else 0,
                    "revenue": revenue,
                    "top_event": top_events[0] if top_events else None,
                    "lowest_event": lowest_event,
                },
                "date_range": {
                    "start": range_start.date().isoformat(),
                    "end": range_end.date().isoformat(),
                },
                "registration_trend": trend,
                "attendance_trend": attendance_trend,
                "registrations_per_hour": per_hour,
                "event_status": [{"name": key.title(), "value": value} for key, value in status_counts.items()],
                "top_events": top_events,
                "branch_comparison": [{"name": key, "value": value} for key, value in branch_counts.most_common(8)],
                "college_comparison": [{"name": key, "value": value} for key, value in college_counts.most_common(8)],
                "gender_ratio": [{"name": key.title(), "value": value} for key, value in gender_counts.items()],
                "category_distribution": [{"name": key, "value": value} for key, value in category_counts.most_common(8)],
                "recent_activities": recent_activities,
                "recent_registrations": [registration_to_dict(item) for item in registrations[:8]],
            }
        )


class AdminUsersView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "users.manage"

    def get(self, request):
        query = request.query_params.get("search", "")
        role = request.query_params.get("role")
        status = request.query_params.get("status")
        sort = request.query_params.get("sort", "-created_at")
        users = User.objects
        if query:
            users = users.filter(
                Q(full_name__icontains=query)
                | Q(email__icontains=query)
                | Q(phone__icontains=query)
                | Q(branch__icontains=query)
                | Q(college_name__icontains=query)
            )
        if role in ("student", "super_admin", "admin", "event_manager", "volunteer", "viewer"):
            users = users.filter(role=role)
        if status == "active":
            users = users.filter(is_active=True)
        if status == "suspended":
            users = users.filter(is_active=False)
        allowed_sorts = {"full_name", "-full_name", "email", "-email", "role", "-role", "created_at", "-created_at", "last_login", "-last_login"}
        if sort not in allowed_sorts:
            sort = "-created_at"
        return ok([user_to_dict(user) for user in users.order_by(sort)])

    def post(self, request):
        serializer = AdminUserSerializer(data=request.data)
        if not serializer.is_valid():
            return fail("Validation failed", serializer.errors)
        data = serializer.validated_data
        if User.objects(email=data["email"]).first():
            return fail("Email already exists", {"email": ["Email already exists."]})
        password = data.pop("password", "") or "User@12345"
        user = User(**data, password_hash=hash_password(password)).save()
        log_audit(request.user, "create", "user", user.id, [user.email, user.role])
        return ok(user_to_dict(user), "User created", 201)


class AdminUserDetailView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "users.manage"

    def get_user(self, user_id):
        return User.objects(id=user_id).first()

    def put(self, request, user_id):
        user = self.get_user(user_id)
        if not user:
            return fail("User not found", status=404)
        serializer = AdminUserSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return fail("Validation failed", serializer.errors)
        data = serializer.validated_data
        password = data.pop("password", None)
        if "email" in data and data["email"] != user.email and User.objects(email=data["email"]).first():
            return fail("Email already exists", {"email": ["Email already exists."]})
        
        old_enrollment = user.enrollment_number
        old_email = user.email

        for field, value in data.items():
            setattr(user, field, value)
        if password:
            user.password_hash = hash_password(password)
        user.updated_at = timestamp()
        user.save()

        # Synchronize details to all associated Registration documents
        sync_user_registrations(user, old_enrollment, old_email, list(data.keys()))

        log_audit(request.user, "update", "user", user.id, [user.email])
        return ok(user_to_dict(user), "User updated")

    def delete(self, request, user_id):
        user = self.get_user(user_id)
        if not user:
            return fail("User not found", status=404)
        if str(user.id) == str(request.user.id):
            return fail("You cannot delete your own admin account", status=400)
        user.delete()
        log_audit(request.user, "delete", "user", user_id, [user.email])
        return ok(message="User deleted")


class AdminUserActionView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "users.manage"

    def post(self, request, user_id, action):
        user = User.objects(id=user_id).first()
        if not user:
            return fail("User not found", status=404)
        if str(user.id) == str(request.user.id) and action in ("suspend", "role"):
            return fail("You cannot lock yourself out", status=400)

        if action == "suspend":
            user.is_active = False
        elif action == "activate":
            user.is_active = True
        elif action == "role":
            role = request.data.get("role")
            if role not in ("student", "super_admin", "admin", "event_manager", "volunteer", "viewer"):
                return fail("Invalid role")
            user.role = role
        elif action == "reset-password":
            serializer = PasswordResetSerializer(data=request.data)
            if not serializer.is_valid():
                return fail("Validation failed", serializer.errors)
            user.password_hash = hash_password(serializer.validated_data["password"])
        else:
            return fail("Unsupported user action", status=400)

        user.updated_at = timestamp()
        user.save()
        log_audit(request.user, "update", "user", user.id, [action])
        return ok(user_to_dict(user), "User updated")


class AdminUserBulkActionView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "users.manage"

    def post(self, request, action):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list) or not ids:
            return fail("Select at least one user.")
        ids = [user_id for user_id in ids if str(user_id) != str(request.user.id)]
        users = User.objects(id__in=ids)
        count = users.count()
        if action == "delete":
            users.delete()
            log_audit(request.user, "delete", "user", "bulk", [f"{count} users"])
            return ok({"count": count}, "Users deleted")
        if action == "role":
            role = request.data.get("role")
            if role not in ("student", "super_admin", "admin", "event_manager", "volunteer", "viewer"):
                return fail("Invalid role")
            users.update(set__role=role, set__updated_at=timestamp())
            log_audit(request.user, "update", "user", "bulk", [f"{count} users", f"role={role}"])
            return ok({"count": count}, "Roles updated")
        return fail("Unsupported bulk action", status=400)


class AdminParticipantsView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "participants.view"

    def get(self, request):
        search = request.query_params.get("search", "")
        event_id = request.query_params.get("event")
        branch = request.query_params.get("branch")
        college = request.query_params.get("college")
        attendance = request.query_params.get("attendance")
        registrations = Registration.objects
        if search:
            registrations = registrations.filter(
                Q(enrollment_number__icontains=search)
                | Q(branch__icontains=search)
                | Q(college_name__icontains=search)
                | Q(location__icontains=search)
            )
        if event_id:
            registrations = registrations.filter(event=event_id)
        if branch:
            registrations = registrations.filter(branch__icontains=branch)
        if college:
            registrations = registrations.filter(college_name__icontains=college)
        if attendance == "present":
            registrations = registrations.filter(attended=True)
        if attendance == "absent":
            registrations = registrations.filter(attended=False)
        status='paid'
        return ok([
            registration_to_dict(item)
            for item in registrations.order_by("-created_at")
            if not (item.enrollment_number or "").upper().startswith("ENR")
        ])


class AdminParticipantActionView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "participants.manage"

    def post(self, request, registration_id, action):
        registration = Registration.objects(id=registration_id).first()

        if not registration:
            return fail("Registration not found", status=404)

        if action == "approve":
            registration.status = "Approved"

        elif action == "reject":
            registration.status = "Rejected"

        else:
            return fail("Invalid action", status=400)

        registration.save()

        return ok(
            registration_to_dict(registration),
            "Registration updated successfully"
        )

class AdminParticipantBulkActionView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "participants.manage"

    def post(self, request, action):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list) or not ids:
            return fail("Select at least one participant.")
        registrations = list(Registration.objects(id__in=ids))
        if action == "attendance":
            attended = bool(request.data.get("attended", True))
            for registration in registrations:
                registration.attended = attended
                registration.save()
            log_audit(request.user, "update", "registration", "bulk", [f"{len(registrations)} attendance"])
            return ok({"count": len(registrations)}, "Attendance updated")
        return fail("Unsupported bulk action", status=400)


import csv
import os
from django.conf import settings
from django.http import HttpResponse


class ImageUploadView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "events.manage"

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return fail("No file uploaded")
        os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
        name = file_obj.name
        safe_name = "".join(c for c in name if c.isalnum() or c in (".", "_", "-")).strip()
        if not safe_name:
            safe_name = "upload.jpg"
        file_path = os.path.join(settings.MEDIA_ROOT, safe_name)
        with open(file_path, "wb+") as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
        url = request.build_absolute_uri(settings.MEDIA_URL + safe_name)
        return ok({"url": url}, "Image uploaded successfully")


class AdminAnalyticsExportView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "reports.view"

    def get(self, request, format):
        def parse_date(value, fallback):
            if not value:
                return fallback
            try:
                return datetime.fromisoformat(value).replace(tzinfo=fallback.tzinfo)
            except ValueError:
                return fallback

        now = timestamp()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        range_start = parse_date(request.query_params.get("start"), today_start - timedelta(days=6))
        range_end = parse_date(request.query_params.get("end"), today_start)
        range_start = range_start.replace(hour=0, minute=0, second=0, microsecond=0)
        range_end = range_end.replace(hour=23, minute=59, second=59, microsecond=999999)

        events = list(Event.objects)
        all_registrations = list(Registration.objects.order_by("-created_at"))
        registrations = [item for item in all_registrations if range_start <= item.created_at.replace(tzinfo=range_start.tzinfo) <= range_end]

        response = HttpResponse(content_type="text/csv")
        filename = f"analytics_report_{range_start.date()}_to_{range_end.date()}.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow(["CARPEDIEM ANALYTICS REPORT"])
        writer.writerow(["Date Range", f"{range_start.date()} to {range_end.date()}"])
        writer.writerow([])
        writer.writerow(["OVERVIEW STATS"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Users", User.objects(role="student").count()])
        writer.writerow(["Total Events", len(events)])
        writer.writerow(["Total Registrations", len(all_registrations)])
        
        total_capacity = sum(event.maximum_seats for event in events)
        occupied_seats = sum(max(event.maximum_seats - event.available_seats, 0) for event in events)
        occupancy_rate = round((occupied_seats / total_capacity) * 100, 1) if total_capacity else 0
        writer.writerow(["Occupancy Rate (%)", occupancy_rate])
        writer.writerow([])
        
        writer.writerow(["TOP EVENTS"])
        writer.writerow(["Event Name", "Category", "Event Type", "Maximum Seats", "Available Seats"])
        for e in sorted(events, key=lambda x: x.maximum_seats - x.available_seats, reverse=True)[:5]:
            writer.writerow([e.name, e.category, e.event_type, e.maximum_seats, e.available_seats])
        writer.writerow([])
        
        writer.writerow(["RECENT REGISTRATIONS"])
        writer.writerow(["Date", "User Name", "Email", "Event", "Attended", "Registration Status"])
        for r in registrations[:50]:
            status_label = r.status
            writer.writerow([
                r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                r.user.full_name,
                r.user.email,
                r.event.name,
                "Yes" if r.attended else "No",
                status_label
            ])

        return response


class AdminParticipantExportView(APIView):
    permission_classes = [RBACPermission]
    required_permission = "participants.view"

    def get(self, request, format):
        event_id = request.query_params.get("event_id")
        registrations = Registration.objects
        if event_id and event_id != "all":
            event = Event.objects(id=event_id).first()
            if event:
                registrations = registrations.filter(event=event)
                
        registrations = registrations.order_by("-created_at")

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="participants.csv"'

        writer = csv.writer(response)
        writer.writerow(["Participant Registration List"])
        writer.writerow([])
        writer.writerow([
            "ID", "User Name", "Email", "Event Name", "Registration Type",
            "Enrollment Number", "Branch", "College Name", "Location", "Attended", "Registration Status"
        ])
        for r in registrations:
            status_label = r.status
            writer.writerow([
                str(r.id),
                r.user.full_name,
                r.user.email,
                r.event.name,
                r.registration_type,
                r.enrollment_number,
                r.branch,
                r.college_name,
                r.location,
                "Yes" if r.attended else "No",
                status_label
            ])

        return response


class AdminAnnouncementView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request):
        if request.user.role not in ("admin", "super_admin", "event_manager"):
            return fail("Unauthorized access", status=403)
        title = request.data.get("title", "Announcement")
        message = request.data.get("message")
        if not message:
            return fail("Message is required")
        
        users = User.objects(role="student")
        notifications = []
        for user in users:
            notifications.append(
                Notification(
                    user=user,
                    category="system",
                    title=title,
                    message=message,
                    entity="announcement",
                )
            )
        if notifications:
            Notification.objects.insert(notifications)
        
        return ok(message=f"Announcement sent to {len(notifications)} students")


class RegistrationInviteActionView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request, registration_id):
        registration = Registration.objects(id=registration_id).first()
        if not registration:
            return fail("Registration not found", status=404)
        
        action = request.data.get("status")
        if action not in ("accepted", "rejected"):
            return fail("Invalid status response.")

        found_member = None
        for member in registration.team_members:
            if member.enrollment_number == request.user.enrollment_number:
                member.invite_status = action
                found_member = member
                break
        
        if not found_member:
            return fail("You are not invited to this team.", status=403)

        update_team_completion_status(registration)
        registration.save()

        # Notify the captain
        create_notification(
            registration.user,
            "registration",
            "Invitation Response",
            f"{request.user.full_name} has {action} your invitation to join {registration.team_name or 'your team'} for {registration.event.name}.",
            "registration",
            str(registration.id)
        )

        return ok(registration_to_dict(registration), f"Invitation response saved as {action}.")


class RegistrationJoinRequestView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request, registration_id):
        registration = Registration.objects(id=registration_id).first()

        if not registration:
            return fail("Registration not found", status=404)

        enrollment = request.user.enrollment_number

        print("=== JOIN REQUEST DEBUG ===")
        print("registration.looking_for_players =", registration.looking_for_players)
        print("user enrollment =", enrollment)
        print("join_requests =", registration.join_requests)
        print("registration enrollment =", registration.enrollment_number)
        print("team_members =", registration.team_members)

        if not registration.looking_for_players:
            return fail("This team is not currently looking for players.", status=400)

        if not _can_join_team(registration, request.user):
            return fail("You can only join a team created by someone of the same gender.", status=403)

        if not enrollment:
            return fail("You must have an enrollment number set on your profile to request to join a team.")

        if enrollment in registration.join_requests:
            return fail("You have already requested to join this team.")

        if (
            enrollment == registration.enrollment_number
            or any(m.get("enrollment_number") == enrollment for m in registration.team_members)
        ):
            return fail("You are already part of this team.")

        registration.join_requests.append(enrollment)
        registration.save()

        create_notification(
            registration.user,
            "registration",
            "New Join Request",
            f"{request.user.full_name} has requested to join your team '{registration.team_name}' for {registration.event.name}.",
            "registration",
            str(registration.id)
        )

        return ok(registration_to_dict(registration), "Join request submitted successfully.")


class RegistrationLeaveTeamView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request, registration_id):
        registration = Registration.objects(id=registration_id).first()
        if not registration or not registration.team:
            return fail("Team registration not found", status=404)

        if registration.user.id == request.user.id:
            return fail("The captain cannot leave the team. Remove the team instead.", status=400)

        member = TeamMember.objects(teamId=registration.team, userId=request.user).first()
        if not member:
            return fail("You are not a member of this team.", status=403)

        member.delete()
        update_team_completion_status(registration)
        registration.save()

        create_notification(
            registration.user,
            "registration",
            "Teammate Left",
            f"{request.user.full_name} has left your team '{registration.team_name}'.",
            "registration",
            str(registration.id),
        )
        return ok(registration_to_dict(registration), "You have been removed from the team.")


class RegistrationJoinAcceptView(APIView):
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request, registration_id):
        registration = Registration.objects(id=registration_id).first()
        if not registration:
            return fail("Registration not found", status=404)

        if registration.user.id != request.user.id:
            return fail("Only the captain can approve join requests.", status=403)

        enrollment = request.data.get("enrollment_number")
        action = request.data.get("action") # accept, decline

        if not enrollment or action not in ("accept", "decline"):
            return fail("Enrollment number and action (accept/decline) are required.")

        if enrollment not in registration.join_requests:
            return fail("This student did not request to join this team.")

        # Remove from request list
        registration.join_requests.remove(enrollment)

        target_user = User.objects(enrollment_number=enrollment).first()
        if not target_user:
            registration.save()
            return fail("Student account not found.")

        if action == "accept":
            if not _can_join_team(registration, target_user):
                return fail("A player can only join a team created by someone of the same gender.", status=403)

            # Add to team_members
            new_member = TeamMember(
                teamId=registration.team,
                userId=target_user,
                enrollment=target_user.enrollment_number,
                isCaptain=False,
                college_name=target_user.college_name or "LJ University",
                location=target_user.location or "Ahmedabad",
                invite_status="accepted"
            )
            new_member.save()

            # If roster filled, turn off looking_for_players
            update_team_completion_status(registration)

            # Notify student
            create_notification(
                target_user,
                "registration",
                "Join Request Approved",
                f"Your request to join team '{registration.team_name}' for {registration.event.name} has been approved!",
                "registration",
                str(registration.id)
            )
            toast_message = "Joined request approved and member added."
        else:
            # Notify student
            create_notification(
                target_user,
                "registration",
                "Join Request Declined",
                f"Your request to join team '{registration.team_name}' for {registration.event.name} was declined.",
                "registration",
                str(registration.id)
            )
            toast_message = "Join request declined."

        registration.save()
        return ok(registration_to_dict(registration), toast_message)
