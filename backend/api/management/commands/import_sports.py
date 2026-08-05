import csv
import os
from django.core.management.base import BaseCommand
from api.documents import Event

class Command(BaseCommand):
    help = "Import sports from sports.csv into the MongoDB events collection."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default=r"D:\csv\sports.csv",
            help="Path to the sports CSV file."
        )

    def handle(self, *args, **options):
        file_path = options["file"]
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"CSV file not found at: {file_path}"))
            return

        total_rows = 0
        inserted_rows = 0
        skipped_rows = 0
        errors = 0

        self.stdout.write(self.style.NOTICE(f"Reading from: {file_path}"))

        with open(file_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_rows += 1
                try:
                    # Extract fields
                    sport_name = row.get("sport_name", "").strip()
                    category = row.get("category", "").strip() or "General"
                    sport_image = row.get("sport_image", "").strip()
                    description = row.get("description", "").strip()
                    venue = row.get("venue", "").strip()
                    location = row.get("location", "").strip()
                    team_size_str = row.get("team_size", "").strip()
                    available_slots_str = row.get("available_slots", "").strip()
                    start_date = row.get("start_date", "").strip()
                    end_date = row.get("end_date", "").strip()
                    registration_deadline = row.get("registration_deadline", "").strip()
                    rules = row.get("rules", "").strip()
                    is_team_sport_str = row.get("is_team_sport", "").strip().lower()
                    status = row.get("status", "").strip()

                    # Row validation
                    if not sport_name:
                        raise ValueError("Missing 'sport_name'")
                    if not description:
                        raise ValueError("Missing 'description'")
                    if not start_date:
                        raise ValueError("Missing 'start_date'")
                    if not venue:
                        raise ValueError("Missing 'venue'")
                    if not available_slots_str:
                        raise ValueError("Missing 'available_slots'")

                    # Parse numbers & types
                    try:
                        available_slots = int(available_slots_str)
                        if available_slots < 0:
                            raise ValueError("available_slots cannot be negative")
                    except ValueError:
                        raise ValueError(f"Invalid integer for available_slots: '{available_slots_str}'")

                    try:
                        team_size = int(team_size_str) if team_size_str else 1
                        if team_size < 1:
                            raise ValueError("team_size must be at least 1")
                    except ValueError:
                        raise ValueError(f"Invalid integer for team_size: '{team_size_str}'")

                    is_team_sport = is_team_sport_str == "true"
                    event_type = "team" if is_team_sport else "individual"

                    # Normalize status
                    if status.lower() in ("active", "upcoming"):
                        status_val = "upcoming"
                    elif status.lower() == "ongoing":
                        status_val = "ongoing"
                    elif status.lower() == "completed":
                        status_val = "completed"
                    else:
                        status_val = "upcoming"

                    # Check duplicate
                    existing = Event.objects(name=sport_name, category=category).first()
                    if existing:
                        self.stdout.write(self.style.WARNING(f"Skipping duplicate event: '{sport_name}' ({category})"))
                        skipped_rows += 1
                        continue

                    # Create and save Event document
                    event = Event(
                        name=sport_name,
                        description=description,
                        banner_image=sport_image,
                        date=start_date,
                        time="10:00 AM",  # Default time
                        venue=f"{venue}, {location}" if location else venue,
                        registration_deadline=registration_deadline or start_date,
                        event_type=event_type,
                        category=category,
                        coordinator="Sports Desk",
                        team_size=team_size,
                        maximum_seats=available_slots,
                        available_seats=available_slots,
                        rules=rules,
                        status=status_val,
                        is_published=True,
                    )
                    event.save()
                    inserted_rows += 1

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Row {total_rows} Error: {str(e)}"))
                    errors += 1

        self.stdout.write(self.style.SUCCESS("--- Import Sports Summary ---"))
        self.stdout.write(f"Total rows: {total_rows}")
        self.stdout.write(f"Inserted rows: {inserted_rows}")
        self.stdout.write(f"Skipped rows: {skipped_rows}")
        self.stdout.write(f"Errors: {errors}")
