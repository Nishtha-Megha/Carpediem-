# pyrefly: ignore [missing-import]
import uuid

from rest_framework import serializers

from .documents import Event, Registration, Team, User
from .utils import serialize_id


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=140)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects(email=value.lower()).first():
            raise serializers.ValidationError("Email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=140, required=False)
    email = serializers.EmailField(required=False)
    enrollment_number = serializers.RegexField(regex=r"^\d{14}$", required=False)
    branch = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.RegexField(regex=r"^[6-9]\d{9}$", required=False)
    college_name = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=("male", "female"), required=False)
    profile_photo = serializers.CharField(required=False, allow_blank=True)
    semester = serializers.CharField(required=False, allow_blank=True)
    two_factor_enabled = serializers.BooleanField(required=False)
    session_timeout = serializers.IntegerField(min_value=5, required=False)
    theme = serializers.CharField(required=False, allow_blank=True)
    language = serializers.CharField(required=False, allow_blank=True)
    timezone = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        return value.lower()


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)


class AdminUserSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=140)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, required=False, allow_blank=True, write_only=True)
    phone = serializers.RegexField(regex=r"^[6-9]\d{9}$", required=False)
    enrollment_number = serializers.RegexField(regex=r"^\d{14}$", required=False)
    branch = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    college_name = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=("male", "female", "other"), required=False)
    role = serializers.ChoiceField(choices=("student", "super_admin", "admin", "event_manager", "volunteer", "viewer"), required=False, default="student")
    profile_photo = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False, default=True)
    semester = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        return value.lower()

    def validate(self, attrs):
        if attrs.get("department") and not attrs.get("branch"):
            attrs["branch"] = attrs["department"]
        attrs.pop("department", None)
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=8)


class EventSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=180)
    description = serializers.CharField()
    banner_image = serializers.CharField(required=False, allow_blank=True)
    date = serializers.CharField()
    time = serializers.CharField()
    venue = serializers.CharField()
    registration_deadline = serializers.DateTimeField(required=False, allow_null=True)
    event_type = serializers.ChoiceField(choices=("individual", "team"))
    category = serializers.CharField(required=False, allow_blank=True)
    coordinator = serializers.CharField(required=False, allow_blank=True)
    team_size = serializers.IntegerField(min_value=1, required=False, default=1)
    registration_fee = serializers.IntegerField(min_value=0, required=False, default=0)
    maximum_teams = serializers.IntegerField(min_value=0, required=False, default=0)
    maximum_seats = serializers.IntegerField(min_value=0)
    available_seats = serializers.IntegerField(min_value=0, required=False)
    rules = serializers.CharField(required=False, allow_blank=True)
    faq = serializers.CharField(required=False, allow_blank=True)
    prize_details = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=("upcoming", "ongoing", "completed"), default="upcoming")
    is_archived = serializers.BooleanField(required=False, default=False)
    is_published = serializers.BooleanField(required=False, default=True)

    def validate(self, attrs):
        import datetime

        def parse_date_value(value):
            if not value:
                return None
            if isinstance(value, (datetime.datetime, datetime.date)):
                return value.date() if isinstance(value, datetime.datetime) else value
            try:
                return datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00")).date()
            except ValueError:
                return None

        date_str = attrs.get("date")
        deadline_str = attrs.get("registration_deadline")

        date_val = parse_date_value(date_str)
        deadline_val = parse_date_value(deadline_str)
        if date_val and deadline_val and deadline_val > date_val:
            raise serializers.ValidationError({"registration_deadline": "Registration deadline must be before or on the event date."})
        return attrs


class TeamMemberSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    enrollment_number = serializers.CharField()
    branch = serializers.CharField()
    college_name = serializers.CharField(required=False, default="LJ University")
    location = serializers.CharField()


class RegistrationSerializer(serializers.Serializer):
    event_id = serializers.CharField()
    enrollment_number = serializers.CharField()
    branch = serializers.CharField()
    college_name = serializers.CharField(required=False, default="LJ University")
    location = serializers.CharField()
    team_members = TeamMemberSerializer(many=True, required=False)
    team_name = serializers.CharField(required=False, allow_blank=True)
    looking_for_players = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        event = Event.objects(id=attrs["event_id"]).first()
        if not event:
            raise serializers.ValidationError({"event_id": "Event not found."})
        if event.status and event.status.lower() in ("closed", "completed"):
            raise serializers.ValidationError({"event_id": "Registration is closed for this event."})
        if event.event_type == "team":
            team_name = attrs.get("team_name")
            if not team_name or not team_name.strip():
                raise serializers.ValidationError({"team_name": "Team name is required."})
            
            # Check for duplicate team name in the same event
            normalized_name = team_name.strip().lower()
            existing_team = Team.objects(
                eventId=event,
                teamName__iexact=normalized_name
            ).first()
            if existing_team:
                raise serializers.ValidationError({"team_name": f"A team named '{team_name}' is already registered for this event."})

            looking_for_players = attrs.get("looking_for_players", False)
            team_members = attrs.get("team_members", [])
            total_members = len(team_members) + 1
            if looking_for_players:
                if total_members > event.team_size:
                    raise serializers.ValidationError({"team_members": f"This team can have at most {event.team_size} members."})
            else:
                if total_members != event.team_size:
                    raise serializers.ValidationError({"team_members": f"This event requires exactly {event.team_size} total team members including captain. Or choose 'List Team on Team Finder' to register with less members."})
        attrs["event"] = event
        return attrs


def user_to_dict(user):
    return {
        "id": serialize_id(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "enrollment_number": str(user.enrollment_number),
        "branch": user.branch,
        "department": user.branch,
        "phone": user.phone,
        "college_name": user.college_name,
        "location": user.location,
        "gender": user.gender,
        "semester": user.semester,
        "profile_photo": user.profile_photo,
        "is_active": user.is_active,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "two_factor_enabled": user.two_factor_enabled,
        "session_timeout": user.session_timeout,
        "login_history": user.login_history[-8:] if user.login_history else [],
        "theme": user.theme,
        "language": user.language,
        "timezone": user.timezone,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def event_to_dict(event):
    return {
        "id": serialize_id(event.id),
        "name": event.name,
        "description": event.description,
        "banner_image": event.banner_image,
        "date": event.date,
        "time": event.time,
        "event_date": event.event_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
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
        "is_archived": event.is_archived,
        "is_published": event.is_published,
    }


def registration_to_dict(registration):
    from mongoengine.errors import DoesNotExist
    if not registration.qr_token:
        registration.qr_token = uuid.uuid4().hex
        registration.save()
    try:
        user_data = user_to_dict(registration.user) if registration.user else None
    except DoesNotExist:
        user_data = None

    try:
        event_data = event_to_dict(registration.event) if registration.event else None
    except DoesNotExist:
        event_data = None

    return {
        "id": serialize_id(registration.id),
        "user": user_data,
        # Keep the captain's gender explicit for Team Finder. This also lets
        # the frontend handle older/admin registration payloads consistently.
        "team_gender": (user_data or {}).get("gender"),
        "event": event_data,
        "registration_type": registration.registration_type,
        "enrollment_number": registration.enrollment_number,
        "branch": registration.branch,
        "college_name": registration.college_name,
        "location": registration.location,
        "team_members": [member.to_mongo().to_dict() if hasattr(member, "to_mongo") else member for member in registration.team_members],
        "team_name": registration.team_name,
        "attended": registration.attended,
        "status": registration.status,
        "waitlist_position": registration.waitlist_position,
        "looking_for_players": registration.looking_for_players,
        "join_requests": registration.join_requests,
        "qr_token": registration.qr_token,

        "created_at": registration.created_at.isoformat(),
    }


def notification_to_dict(notification):
    return {
        "id": serialize_id(notification.id),
        "category": notification.category,
        "title": notification.title,
        "message": notification.message,
        "entity": notification.entity,
        "entity_id": notification.entity_id,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(),
    }


def audit_log_to_dict(log):
    return {
        "id": serialize_id(log.id),
        "actor": user_to_dict(log.actor) if log.actor else None,
        "action": log.action,
        "entity": log.entity,
        "entity_id": log.entity_id,
        "metadata": log.metadata or [],
        "created_at": log.created_at.isoformat(),
    }
