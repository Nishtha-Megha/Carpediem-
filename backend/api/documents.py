from datetime import datetime, timezone

from mongoengine import (
    BooleanField,
    DateTimeField,
    Document,
    EmailField,
    EmbeddedDocument,
    EmbeddedDocumentField,
    EmbeddedDocumentListField,
    IntField,
    ListField,
    ReferenceField,
    StringField,
)


def now():
    return datetime.now(timezone.utc)


class User(Document):
    full_name = StringField(db_field="fullName", required=True, max_length=140)
    email = EmailField(required=True, unique=True)
    password_hash = StringField(db_field="password", required=True)
    enrollment_number = StringField(db_field="enrollment")
    phone = StringField(db_field="mobile")
    gender = StringField(choices=("male", "female", "other", "Male", "Female", "Other"), default="Other")
    branch = StringField(db_field="department")
    semester = IntField(default=1)
    batch = IntField(default=2024)
    profile_photo = StringField(db_field="profileImage")
    role = StringField(required=True, choices=("student", "admin", "super_admin", "event_manager", "volunteer", "viewer", "user"), default="student")
    is_active = BooleanField(db_field="isVerified", default=True)
    college_name = StringField(db_field="collegeName")
    location = StringField()
    last_login = DateTimeField(db_field="lastLogin")
    two_factor_enabled = BooleanField(db_field="twoFactorEnabled", default=False)
    session_timeout = IntField(db_field="sessionTimeout", default=30, min_value=5)
    login_history = ListField(StringField(), db_field="loginHistory")
    theme = StringField(default="dark")
    language = StringField(default="English")
    timezone = StringField(default="Asia/Kolkata")
    created_at = DateTimeField(db_field="createdAt", default=now)
    updated_at = DateTimeField(db_field="updatedAt", default=now)

    meta = {"collection": "users", "indexes": ["email", "role"]}


class DashboardBanner(Document):
    title = StringField(default="Carpedium Sports 2026")
    event_dates = StringField(default="Oct 12 - Oct 18, 2026")
    venue = StringField(default="LJ University Grounds")
    registration_deadline = StringField(default="Oct 05, 2026 (23:59)")
    updated_at = DateTimeField(default=now)

    meta = {"collection": "dashboardBanner"}


class Event(Document):
    name = StringField(db_field="title", required=True, max_length=180)
    description = StringField(required=True)
    year = IntField(default=2026)
    banner_image = StringField(db_field="banner")
    registration_start = DateTimeField(db_field="registrationStart", default=now)
    registration_deadline = DateTimeField(db_field="registrationEnd")
    date = DateTimeField(db_field="eventStart")
    event_end = DateTimeField(db_field="eventEnd")
    venue = StringField(required=True)
    status = StringField(required=True, choices=("upcoming", "open", "closed", "completed", "Upcoming", "Open", "Closed", "Completed"), default="upcoming")
    time = StringField(db_field="time")
    event_date = StringField(db_field="eventDate")
    start_time = StringField(db_field="startTime")
    end_time = StringField(db_field="endTime")
    event_type = StringField(db_field="eventType", choices=("individual", "team"), default="individual")
    category = StringField(db_field="category", default="General")
    coordinator = StringField(db_field="coordinator")
    team_size = IntField(db_field="teamSize", default=1)
    registration_fee = IntField(db_field="registrationFee", default=0)
    maximum_teams = IntField(db_field="maximumTeams", default=0)
    maximum_seats = IntField(db_field="maximumSeats", default=100)
    available_seats = IntField(db_field="availableSeats", default=100)
    rules = StringField(db_field="rules")
    faq = StringField(db_field="faq")
    prize_details = StringField(db_field="prizeDetails")
    is_archived = BooleanField(db_field="isArchived", default=False)
    is_published = BooleanField(db_field="isPublished", default=True)
    created_by = ReferenceField(User, db_field="createdBy")
    created_at = DateTimeField(db_field="createdAt", default=now)
    updated_at = DateTimeField(db_field="updatedAt", default=now)

    meta = {"collection": "events", "indexes": ["name", "status"]}


class Sport(Document):
    eventId = ReferenceField(Event, db_field="eventId", required=True)
    sportName = StringField(db_field="sportName", required=True)
    category = StringField(choices=("Indoor", "Outdoor"), default="Outdoor")
    sportType = StringField(db_field="sportType", choices=("Individual", "Team"), default="Individual")
    gender = StringField(choices=("Male", "Female", "Mixed"), default="Mixed")
    minPlayers = IntField(db_field="minPlayers", default=1)
    maxPlayers = IntField(db_field="maxPlayers", default=1)
    location = StringField()
    rules = StringField()
    image = StringField()
    registrationFee = IntField(db_field="registrationFee", default=0)
    status = StringField(choices=("Active", "Inactive"), default="Active")
    createdAt = DateTimeField(db_field="createdAt", default=now)

    meta = {"collection": "sports", "indexes": ["eventId", "sportName"]}


class Team(Document):
    sportId = ReferenceField(Sport, db_field="sportId", required=True)
    eventId = ReferenceField(Event, db_field="eventId", required=True)
    teamName = StringField(db_field="teamName", required=True)
    captainId = ReferenceField(User, db_field="captainId", required=True)
    department = StringField()
    totalMembers = IntField(db_field="totalMembers", default=1)
    status = StringField(choices=("Pending", "Approved", "Rejected", "Cancelled"), default="Pending")
    createdAt = DateTimeField(db_field="createdAt", default=now)

    meta = {"collection": "teams", "indexes": ["sportId", "eventId", "captainId"]}


class TeamMember(Document):
    teamId = ReferenceField(Team, db_field="teamId", required=True)
    userId = ReferenceField(User, db_field="userId")
    enrollment = StringField(required=True)
    isCaptain = BooleanField(db_field="isCaptain", default=False)
    joinedAt = DateTimeField(db_field="joinedAt", default=now)

    college_name = StringField(db_field="collegeName")
    location = StringField()

    invite_status = StringField(
        db_field="inviteStatus",
        choices=["pending", "accepted", "rejected"],
        default="pending"
    )

    meta = {
        "collection": "teamMembers",
        "indexes": ["teamId", "userId", "enrollment"]
    }


class Registration(Document):
    user = ReferenceField(User, db_field="userId", required=True)
    sport = ReferenceField(Sport, db_field="sportId")
    team = ReferenceField(Team, db_field="teamId")
    event = ReferenceField(Event, db_field="eventId", required=True)
    registration_type = StringField(db_field="registrationType", choices=("individual", "team", "Individual", "Team"), required=True)
    status = StringField(
    choices=(
        "Pending",
        "Approved",
        "Rejected",
        "Cancelled",
        "pending",
        "registered",
        "waitlisted"
    ),
    default="Pending"
)
    created_at = DateTimeField(db_field="registeredAt", default=now)
    attended = BooleanField(db_field="attended", default=False)
    waitlist_position = IntField(db_field="waitlistPosition", default=0)
    looking_for_players = BooleanField(db_field="lookingForPlayers", default=False)
    join_requests = ListField(StringField(), db_field="joinRequests", default=list)
    

    # Temporary properties and fields for backwards compatibility
    _team_name = None
    _team_members_temp = None

    @property
    def enrollment_number(self):
        from mongoengine.errors import DoesNotExist
        try:
            return self.user.enrollment_number if self.user else ""
        except DoesNotExist:
            return ""

    @property
    def branch(self):
        from mongoengine.errors import DoesNotExist
        try:
            return self.user.branch if self.user else ""
        except DoesNotExist:
            return ""

    @property
    def college_name(self):
        from mongoengine.errors import DoesNotExist
        try:
            return self.user.college_name if self.user else "LJ University"
        except DoesNotExist:
            return "LJ University"

    @property
    def location(self):
        from mongoengine.errors import DoesNotExist
        try:
            return self.user.location if self.user else ""
        except DoesNotExist:
            return ""

    @property
    def team_name(self):
        from mongoengine.errors import DoesNotExist
        try:
            return self.team.teamName if self.team else self._team_name
        except DoesNotExist:
            return self._team_name

    @team_name.setter
    def team_name(self, value):
        from mongoengine.errors import DoesNotExist
        self._team_name = value
        try:
            if self.team:
                self.team.teamName = value
                self.team.save()
        except DoesNotExist:
            pass

    @property
    def team_members(self):
        from mongoengine.errors import DoesNotExist
        try:
            if not self.team:
                return self._team_members_temp or []
            members = TeamMember.objects(teamId=self.team)
        except DoesNotExist:
            return self._team_members_temp or []

        res = []
        for m in members:
            if m.isCaptain:
                continue
            try:
                user_ref = m.userId
                name = user_ref.full_name if user_ref else ""
                email = user_ref.email if user_ref else ""
                branch = user_ref.branch if user_ref else ""
                college = user_ref.college_name if user_ref else "LJ University"
                location = user_ref.location if user_ref else ""
            except DoesNotExist:
                name = ""
                email = ""
                branch = ""
                college = "LJ University"
                location = ""

            res.append({
                "name": name,
                "email": email,
                "enrollment_number": m.enrollment,
                "branch": branch,
                "college_name": college,
                "location": location,
                "invite_status": getattr(m, "invite_status", "accepted")
            })
        return res

    @team_members.setter
    def team_members(self, value):
        self._team_members_temp = value

    def save(self, *args, **kwargs):
    # Get or create Sport
        sport = Sport.objects(eventId=self.event).first()

        if not sport and self.event:
            sport = Sport(
                eventId=self.event,
                sportName=self.event.name,
                sportType="Team" if self.registration_type == "team" else "Individual",
                location=self.event.venue,
                minPlayers=getattr(self.event, "team_size", 1) or 1,
                maxPlayers=getattr(self.event, "team_size", 1) or 1,
                registrationFee=getattr(self.event, "registration_fee", 0) or 0,
                rules=getattr(self.event, "rules", "") or "",
            )
            sport.save()

        self.sport = sport

        # Create Team only once
        if self.registration_type == "team" and not self.team:
            team = Team(
                sportId=sport,
                eventId=self.event,
                teamName=self._team_name or "Team",
                captainId=self.user,
                department=self.user.branch if self.user else "General",
                status="Approved" if self.status in ("registered", "Approved") else "Pending",
            ).save()

            self.team = team

            # Create ONLY captain
            TeamMember(
                teamId=team,
                userId=self.user,
                enrollment=self.user.enrollment_number,
                isCaptain=True,
                invite_status="accepted",
                college_name=self.user.college_name or "LJ University",
                location=self.user.location or "",
            ).save()

        return super(Registration, self).save(*args, **kwargs)
    meta = {
        "collection": "registrations",
        "indexes": ["user", "event", "created_at"],
    }


def update_team_completion_status(registration):
    if registration.registration_type != "team":
        return

    if not registration.team:
        return

    captain_count = TeamMember.objects(
        teamId=registration.team,
        isCaptain=True
    ).count()

    accepted_count = TeamMember.objects(
        teamId=registration.team,
        invite_status="accepted",
        isCaptain=False
    ).count()

    total_players = captain_count + accepted_count

    registration.looking_for_players = (
        total_players < registration.event.team_size
    )


class Notification(Document):
    user = ReferenceField(User, db_field="userId", required=True)
    title = StringField(required=True)
    message = StringField(required=True)
    category = StringField(db_field="type", required=True, choices=("registration", "payment", "event", "system", "Registration", "Match", "Announcement", "System"), default="system")
    is_read = BooleanField(db_field="isRead", default=False)
    created_at = DateTimeField(db_field="createdAt", default=now)

    # Temporary properties and fields for backwards compatibility
    entity = StringField()
    entity_id = StringField()

    meta = {
        "collection": "notifications",
        "indexes": ["user", "is_read", "created_at"],
    }


class AuditLog(Document):
    actor = ReferenceField(User, db_field="adminId")
    action = StringField(required=True)
    entity = StringField(db_field="collection", required=True)
    entity_id = StringField(db_field="documentId")
    metadata = ListField(StringField())
    created_at = DateTimeField(db_field="createdAt", default=now)

    meta = {"collection": "audit_logs", "indexes": ["actor", "created_at"]}


class Match(Document):
    sportId = ReferenceField(Sport, db_field="sportId", required=True)
    eventId = ReferenceField(Event, db_field="eventId", required=True)
    team1 = ReferenceField(Team, db_field="team1", required=True)
    team2 = ReferenceField(Team, db_field="team2", required=True)
    matchDate = DateTimeField(db_field="matchDate", required=True)
    venue = StringField(required=True)
    winner = ReferenceField(Team, db_field="winner")
    status = StringField(choices=("Scheduled", "Running", "Completed"), default="Scheduled")

    meta = {"collection": "matches", "indexes": ["sportId", "eventId", "status"]}


class Result(Document):
    matchId = ReferenceField(Match, db_field="matchId", required=True)
    sportId = ReferenceField(Sport, db_field="sportId", required=True)
    firstPosition = ReferenceField(Team, db_field="firstPosition", required=True)
    secondPosition = ReferenceField(Team, db_field="secondPosition", required=True)
    thirdPosition = ReferenceField(Team, db_field="thirdPosition", required=True)
    createdAt = DateTimeField(db_field="createdAt", default=now)

    meta = {"collection": "results"}


class Announcement(Document):
    title = StringField(required=True)
    message = StringField(required=True)
    eventId = ReferenceField(Event, db_field="eventId")
    image = StringField()
    createdBy = ReferenceField(User, db_field="createdBy")
    createdAt = DateTimeField(db_field="createdAt", default=now)

    meta = {"collection": "announcements"}


class Gallery(Document):
    eventId = ReferenceField(Event, db_field="eventId")
    sportId = ReferenceField(Sport, db_field="sportId")
    image = StringField(required=True)
    caption = StringField()
    uploadedBy = ReferenceField(User, db_field="uploadedBy")
    uploadedAt = DateTimeField(db_field="uploadedAt", default=now)

    meta = {"collection": "gallery"}
