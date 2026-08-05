import csv
import os
from datetime import datetime
from bson import ObjectId
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from api.documents import User, Event, Sport, Team, TeamMember, Registration, Notification, AuditLog


def parse_date(date_str):
    if not date_str or date_str == "":
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            pass
    return None


class Command(BaseCommand):
    help = "Migrate and seed MongoDB database to normalized schema from CSV backups."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting schema migration and seeding..."))

        # Paths to backup CSV files on D:\
        users_csv = r"d:\carpedium.users.csv"
        events_csv = r"d:\carpedium.events.csv"
        regs_csv = r"d:\carpedium.registrations.csv"
        notifs_csv = r"d:\carpedium.notifications.csv"
        logs_csv = r"d:\carpedium.audit_logs.csv"

        # 1. Clear existing collections (just in case)
        User.objects.delete()
        Event.objects.delete()
        Sport.objects.delete()
        Team.objects.delete()
        TeamMember.objects.delete()
        Registration.objects.delete()
        Notification.objects.delete()
        AuditLog.objects.delete()

        # 2. Migrate Users
        self.stdout.write("Migrating users...")
        user_map = {}
        if os.path.exists(users_csv):
            with open(users_csv, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    uid = row.get("_id")
                    if not uid:
                        continue
                    role_str = row.get("role", "student").strip()
                    if role_str == "user":
                        role_str = "student"
                    
                    gender_val = row.get("gender", "").strip()
                    if not gender_val:
                        gender_val = "Other"

                    user = User(
                        id=ObjectId(uid),
                        full_name=row.get("full_name", "").strip(),
                        email=row.get("email", "").strip().lower(),
                        password_hash=make_password("Student@123"),
                        enrollment_number=row.get("enrollment_number", "").strip(),
                        phone=row.get("phone", "").strip(),
                        gender=gender_val,
                        branch=row.get("branch", "").strip(),
                        profile_photo=row.get("profile_photo", "").strip(),
                        role=role_str,
                        is_active=row.get("is_active", "true").lower() == "true",
                        created_at=parse_date(row.get("created_at")),
                        updated_at=parse_date(row.get("updated_at"))
                    )
                    try:
                        user.semester = int(row.get("semester", "1"))
                    except ValueError:
                        user.semester = 1
                    try:
                        user.batch = int(row.get("batch", "2024"))
                    except ValueError:
                        user.batch = 2024

                    user.save()
                    user_map[uid] = user
            self.stdout.write(self.style.SUCCESS(f"Migrated {len(user_map)} users."))
        else:
            self.stdout.write(self.style.WARNING("Users CSV not found! Seeding a default admin."))
            admin = User(
                full_name="Carpedium Admin",
                email="admin@carpedium.dev",
                password_hash=make_password("Student@123"),
                role="admin",
            ).save()
            user_map["default_admin"] = admin

        # 3. Migrate Events and create Sports
        self.stdout.write("Migrating events and creating sports...")
        event_map = {}
        sport_map = {}
        if os.path.exists(events_csv):
            with open(events_csv, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    eid = row.get("_id")
                    if not eid:
                        continue
                    creator_id = row.get("created_by")
                    creator = user_map.get(creator_id) or User.objects.first()

                    # Event Status mapper
                    ev_status = row.get("status", "upcoming").strip().lower()
                    if ev_status == "ongoing":
                        ev_status = "open"

                    # Year parser
                    year_val = 2026
                    try:
                        date_parsed = parse_date(row.get("date"))
                        if date_parsed:
                            year_val = date_parsed.year
                    except Exception:
                        pass

                    event = Event(
                        id=ObjectId(eid),
                        name=row.get("name", "").strip(),
                        description=row.get("description", "").strip(),
                        year=year_val,
                        banner_image=row.get("banner_image", "").strip(),
                        registration_start=parse_date(row.get("created_at")),
                        registration_deadline=parse_date(row.get("registration_deadline")),
                        date=parse_date(row.get("date")),
                        event_end=parse_date(row.get("date")),
                        venue=row.get("venue", "").strip(),
                        status=ev_status,
                        time=row.get("time", "").strip(),
                        event_type=row.get("event_type", "individual").strip().lower(),
                        category=row.get("category", "General").strip(),
                        coordinator=row.get("coordinator", "").strip(),
                        rules=row.get("rules", "").strip(),
                        faq=row.get("faq", "").strip(),
                        prize_details=row.get("prize_details", "").strip(),
                        is_archived=row.get("is_archived", "false").strip().lower() == "true",
                        is_published=row.get("is_published", "true").strip().lower() == "true",
                        created_by=creator,
                        created_at=parse_date(row.get("created_at")),
                        updated_at=parse_date(row.get("updated_at"))
                    )
                    try:
                        event.team_size = int(row.get("team_size", "1"))
                    except ValueError:
                        pass
                    try:
                        event.registration_fee = int(row.get("registration_fee", "0"))
                    except ValueError:
                        pass
                    try:
                        event.maximum_teams = int(row.get("maximum_teams", "0"))
                    except ValueError:
                        pass
                    try:
                        event.maximum_seats = int(row.get("maximum_seats", "100"))
                    except ValueError:
                        pass
                    try:
                        event.available_seats = int(row.get("available_seats", "100"))
                    except ValueError:
                        pass

                    event.save()
                    event_map[eid] = event

                    # Create corresponding Sport document for normalized schema
                    gender_mapped = "Mixed"
                    cat_csv = row.get("category", "General").strip().lower()
                    if "boys" in cat_csv:
                        gender_mapped = "Male"
                    elif "girls" in cat_csv:
                        gender_mapped = "Female"

                    sport_type_mapped = "Individual"
                    ev_type = row.get("event_type", "individual").strip().lower()
                    if ev_type == "team":
                        sport_type_mapped = "Team"

                    team_size_val = 1
                    try:
                        team_size_val = int(row.get("team_size", "1"))
                    except ValueError:
                        pass

                    reg_fee_val = 0
                    try:
                        reg_fee_val = int(row.get("registration_fee", "0"))
                    except ValueError:
                        pass

                    sport = Sport(
                        eventId=event,
                        sportName=event.name,
                        category="Outdoor", # Safe default
                        sportType=sport_type_mapped,
                        gender=gender_mapped,
                        minPlayers=team_size_val,
                        maxPlayers=team_size_val,
                        location=event.venue,
                        rules=row.get("rules", "").strip(),
                        image=event.banner_image,
                        registrationFee=reg_fee_val,
                        status="Active",
                        createdAt=event.created_at
                    ).save()
                    sport_map[eid] = sport

            self.stdout.write(self.style.SUCCESS(f"Migrated {len(event_map)} events and sports."))
        else:
            self.stdout.write(self.style.WARNING("Events CSV not found!"))

        # 4. Migrate Registrations (and create Teams & TeamMembers)
        self.stdout.write("Migrating registrations...")
        reg_count = 0
        if os.path.exists(regs_csv):
            with open(regs_csv, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rid = row.get("_id")
                    if not rid:
                        continue
                    u_id = row.get("user")
                    e_id = row.get("event")
                    user = user_map.get(u_id)
                    event = event_map.get(e_id)
                    sport = sport_map.get(e_id)

                    if not user or not event or not sport:
                        continue

                    reg_type = row.get("registration_type", "individual").strip().lower()
                    status_str = row.get("status", "registered").strip().lower()
                    mapped_status = "Approved"
                    if status_str == "waitlisted":
                        mapped_status = "Pending"
                    elif status_str == "failed":
                        mapped_status = "Rejected"

                    reg = Registration(
                        id=ObjectId(rid),
                        user=user,
                        sport=sport,
                        event=event,
                        registration_type=reg_type,
                        status=mapped_status,
                        created_at=parse_date(row.get("created_at")),
                        attended=row.get("attended", "false").strip().lower() == "true",
                        looking_for_players=row.get("looking_for_players", "false").strip().lower() == "true",
                        payment_status=row.get("payment_status", "paid").strip().lower(),
                        qr_code=row.get("qr_code", "").strip()
                    )
                    try:
                        reg.waitlist_position = int(row.get("waitlist_position", "0"))
                    except ValueError:
                        pass

                    # Manage Teams & Members for team registrations
                    if reg_type == "team":
                        t_name = row.get("team_name", "Team").strip()
                        
                        team = Team(
                            sportId=sport,
                            eventId=event,
                            teamName=t_name,
                            captainId=user,
                            department=user.branch or "General",
                            status=mapped_status,
                            createdAt=reg.created_at
                        ).save()
                        reg.team = team

                        # Add Captain as Member
                        TeamMember(
                            teamId=team,
                            userId=user,
                            enrollment=user.enrollment_number or row.get("enrollment_number", "").strip(),
                            isCaptain=True,
                            joinedAt=reg.created_at
                        ).save()

                        # Parse up to 10 team members
                        for idx in range(10):
                            m_name = row.get(f"team_members[{idx}].name")
                            m_email = row.get(f"team_members[{idx}].email")
                            m_enroll = row.get(f"team_members[{idx}].enrollment_number")
                            
                            if m_name and m_name.strip() and m_enroll and m_enroll.strip():
                                m_enroll = m_enroll.strip()
                                m_email = m_email.strip().lower() if m_email else ""
                                m_branch = row.get(f"team_members[{idx}].branch", "").strip()
                                m_loc = row.get(f"team_members[{idx}].location", "").strip()

                                # Find or create a User for the member
                                member_user = User.objects(enrollment_number=m_enroll).first()
                                if not member_user:
                                    member_user = User.objects(email=m_email).first()
                                if not member_user:
                                    # Create dummy user
                                    member_user = User(
                                        full_name=m_name.strip(),
                                        email=m_email or f"{m_enroll}@carpedium.dev",
                                        password_hash=make_password("Student@123"),
                                        enrollment_number=m_enroll,
                                        branch=m_branch,
                                        location=m_loc,
                                        role="student",
                                        is_active=True
                                    ).save()

                                TeamMember(
                                    teamId=team,
                                    userId=member_user,
                                    enrollment=m_enroll,
                                    isCaptain=False,
                                    joinedAt=reg.created_at
                               ).save()

                    reg.save()
                    reg_count += 1
            self.stdout.write(self.style.SUCCESS(f"Migrated {reg_count} registrations."))
        else:
            self.stdout.write(self.style.WARNING("Registrations CSV not found!"))

        # 5. Migrate Notifications
        self.stdout.write("Migrating notifications...")
        notif_count = 0
        if os.path.exists(notifs_csv):
            with open(notifs_csv, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    nid = row.get("_id")
                    if not nid:
                        continue
                    u_id = row.get("user")
                    user = user_map.get(u_id)
                    if not user:
                        continue

                    notif = Notification(
                        id=ObjectId(nid),
                        user=user,
                        title=row.get("title", "").strip(),
                        message=row.get("message", "").strip(),
                        category=row.get("category", "system").strip().lower(),
                        is_read=row.get("is_read", "false").lower() == "true",
                        created_at=parse_date(row.get("created_at"))
                    )
                    notif.save()
                    notif_count += 1
            self.stdout.write(self.style.SUCCESS(f"Migrated {notif_count} notifications."))
        else:
            self.stdout.write(self.style.WARNING("Notifications CSV not found!"))

        # 6. Migrate Audit Logs
        self.stdout.write("Migrating audit logs...")
        log_count = 0
        if os.path.exists(logs_csv):
            with open(logs_csv, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    lid = row.get("_id")
                    if not lid:
                        continue
                    actor_id = row.get("actor")
                    actor = user_map.get(actor_id)

                    audit = AuditLog(
                        id=ObjectId(lid),
                        actor=actor,
                        action=row.get("action", "").strip(),
                        entity=row.get("entity", "").strip(),
                        entity_id=row.get("entity_id", "").strip(),
                        created_at=parse_date(row.get("created_at"))
                    )
                    
                    meta_val = row.get("metadata", "")
                    if meta_val:
                        audit.metadata = [meta_val]

                    audit.save()
                    log_count += 1
            self.stdout.write(self.style.SUCCESS(f"Migrated {log_count} audit logs."))
        else:
            self.stdout.write(self.style.WARNING("Audit logs CSV not found!"))

        self.stdout.write(self.style.SUCCESS("Database schema migration and seeding complete!"))
