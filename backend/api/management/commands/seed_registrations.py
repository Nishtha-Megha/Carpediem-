import random
from datetime import timedelta
# pyrefly: ignore [missing-import]
from django.core.management.base import BaseCommand
from api.documents import Event, Registration, TeamMember, User
from api.utils import timestamp

class Command(BaseCommand):
    help = "Seed demo participant registrations and teams in MongoDB using imported sports and students."

    def handle(self, *args, **options):
        # 1. Clear existing registrations
        Registration.objects.delete()

        # 2. Load imported students
        users = list(User.objects(role="user").order_by("enrollment_number"))
        if not users:
            self.stdout.write(self.style.WARNING("No student users found. Please import students first using 'python manage.py import_students'."))
            return

        # 3. Load imported sports events
        events = list(Event.objects.order_by("name"))
        if not events:
            self.stdout.write(self.style.WARNING("No sports events found. Please import sports first using 'python manage.py import_sports'."))
            return

        today_start = timestamp().replace(hour=9, minute=0, second=0, microsecond=0)
        created = 0

        # We will seed registrations for a variety of the imported events
        # Let's seed registrations for the first 25 events to create a realistic distribution
        seeded_events = events[:25]

        for i, event in enumerate(seeded_events):
            # Select a student as the captain/registrant
            # Ensure different students get selected
            captain = users[i % len(users)]
            
            # Ensure captain's required fields are populated or default
            captain_enrollment = captain.enrollment_number or f"CAP{i:03d}"
            captain_branch = captain.branch or "General"
            captain_college = captain.college_name or "LJ University"
            captain_location = captain.location or "Ahmedabad"

            # Decide registration time (some past, some future)
            created_at = today_start - timedelta(days=(i % 7), hours=(i % 12))
            
            # Attendance logic: past registrations can be marked attended
            attended = (i % 2 == 0) and (created_at < today_start)

            # Build team members if it's a team sport
            team_members = []
            if event.event_type == "team":
                # Find available team members from the student list
                candidates = [u for u in users if u.id != captain.id]
                needed_members = event.team_size - 1
                
                for idx in range(needed_members):
                    member = candidates[(i + idx) % len(candidates)]
                    team_members.append(
                        TeamMember(
                            name=member.full_name or "Teammate",
                            email=member.email or f"teammate{idx}@carpedium.dev",
                            enrollment_number=member.enrollment_number or f"TEAM{idx:03d}",
                            branch=member.branch or captain_branch,
                            college_name=member.college_name or captain_college,
                            location=member.location or captain_location,
                        )
                    )

            # Save the registration
            registration = Registration(
                user=captain,
                event=event,
                registration_type=event.event_type,
                enrollment_number=captain_enrollment,
                branch=captain_branch,
                college_name=captain_college,
                location=captain_location,
                team_members=team_members,
                attended=attended,
                payment_status="paid" if i % 5 != 0 else "pending",
            ).save()

            # Set post-save details
            registration.created_at = created_at
            registration.qr_code = f"REG-{str(registration.id)[-6:].upper()}"
            registration.save()

            # Update seats on event
            event.available_seats = max(event.available_seats - 1, 0)
            event.save()
            created += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {created} registrations (with associated teams) in MongoDB using imported sports and students."))
