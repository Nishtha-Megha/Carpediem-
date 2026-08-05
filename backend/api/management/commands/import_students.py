import csv
import os
from datetime import datetime
# pyrefly: ignore [missing-import]
from django.contrib.auth.hashers import make_password
# pyrefly: ignore [missing-import]
from django.core.management.base import BaseCommand
from api.documents import User

class Command(BaseCommand):
    help = "Import students from carpedium_students_150.csv into the MongoDB users collection."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default=r"D:\csv\carpedium_students_150.csv",
            help="Path to the students CSV file."
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

        # Precompute the hash for the default password to speed up saving if needed
        default_pwd_hash = make_password("Student@12345")

        with open(file_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_rows += 1
                try:
                    full_name = row.get("full_name", "").strip()
                    email = row.get("email", "").strip().lower()
                    password_hash_val = row.get("password_hash", "").strip()
                    enrollment_number = row.get("enrollment_number", "").strip()
                    department = row.get("department", "").strip()
                    phone_number = row.get("phone_number", "").strip()
                    gender_str = row.get("gender", "").strip().lower()
                    city = row.get("city", "").strip()
                    role_str = row.get("role", "").strip().lower()
                    is_active_str = row.get("is_active", "").strip().lower()

                    # Row validation
                    if not full_name:
                        raise ValueError("Missing 'full_name'")
                    if not email:
                        raise ValueError("Missing 'email'")
                    if not enrollment_number:
                        raise ValueError("Missing 'enrollment_number'")

                    # Duplicate check
                    existing = User.objects(email=email).first()
                    if existing:
                        self.stdout.write(self.style.WARNING(f"Skipping duplicate user: '{email}'"))
                        skipped_rows += 1
                        continue

                    # Gender normalization (choices: "male", "female", "other")
                    if gender_str.startswith("m"):
                        gender = "male"
                    elif gender_str.startswith("f"):
                        gender = "female"
                    else:
                        gender = "other"

                    # Role normalization (map student/user to "user")
                    if role_str in ("student", "user"):
                        role = "user"
                    else:
                        role = "user"  # Safe default fallback for students

                    # Password hash replacement for testing logins
                    if "samplehash" in password_hash_val or not password_hash_val:
                        pwd_hash = default_pwd_hash
                    else:
                        pwd_hash = password_hash_val

                    # Boolean is_active
                    is_active = is_active_str != "false"

                    # Create and save User
                    user = User(
                        full_name=full_name,
                        email=email,
                        password_hash=pwd_hash,
                        role=role,
                        enrollment_number=enrollment_number,
                        branch=department,
                        phone=phone_number,
                        college_name="LJ University",  # Default college
                        location=city,
                        gender=gender,
                        is_active=is_active,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    user.save()
                    inserted_rows += 1

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Row {total_rows} Error: {str(e)}"))
                    errors += 1

        self.stdout.write(self.style.SUCCESS("--- Import Students Summary ---"))
        self.stdout.write(f"Total rows: {total_rows}")
        self.stdout.write(f"Inserted rows: {inserted_rows}")
        self.stdout.write(f"Skipped rows: {skipped_rows}")
        self.stdout.write(f"Errors: {errors}")
