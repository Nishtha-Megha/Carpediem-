# pyrefly: ignore [missing-import]
from django.contrib.auth.hashers import make_password
# pyrefly: ignore [missing-import]
from django.core.management.base import BaseCommand

from api.documents import User


class Command(BaseCommand):
    help = "Replace old student users with fresh demo users in MongoDB."

    def handle(self, *args, **options):
        User.objects(role="user").delete()

        users = [
            {
                "full_name": "Aarav Mehta",
                "email": "aarav.mehta@carpedium.dev",
                "enrollment_number": "ENR2026001",
                "branch": "Computer Science",
                "college_name": "Carpedium Institute of Technology",
                "location": "Ahmedabad",
                "gender": "male",
            },
            {
                "full_name": "Diya Sharma",
                "email": "diya.sharma@carpedium.dev",
                "enrollment_number": "ENR2026002",
                "branch": "Information Technology",
                "college_name": "Carpedium Institute of Technology",
                "location": "Surat",
                "gender": "female",
            },
            {
                "full_name": "Kabir Patel",
                "email": "kabir.patel@carpedium.dev",
                "enrollment_number": "ENR2026003",
                "branch": "Mechanical Engineering",
                "college_name": "Carpedium Engineering College",
                "location": "Vadodara",
                "gender": "male",
            },
            {
                "full_name": "Anaya Desai",
                "email": "anaya.desai@carpedium.dev",
                "enrollment_number": "ENR2026004",
                "branch": "Civil Engineering",
                "college_name": "Carpedium Engineering College",
                "location": "Rajkot",
                "gender": "female",
            },
            {
                "full_name": "Vivaan Joshi",
                "email": "vivaan.joshi@carpedium.dev",
                "enrollment_number": "ENR2026005",
                "branch": "Electronics and Communication",
                "college_name": "Carpedium University",
                "location": "Gandhinagar",
                "gender": "male",
            },
            {
                "full_name": "Isha Nair",
                "email": "isha.nair@carpedium.dev",
                "enrollment_number": "ENR2026006",
                "branch": "Artificial Intelligence",
                "college_name": "Carpedium University",
                "location": "Mumbai",
                "gender": "female",
            },
            {
                "full_name": "Reyansh Rao",
                "email": "reyansh.rao@carpedium.dev",
                "enrollment_number": "ENR2026007",
                "branch": "Data Science",
                "college_name": "Carpedium School of Computing",
                "location": "Pune",
                "gender": "male",
            },
            {
                "full_name": "Mira Kapoor",
                "email": "mira.kapoor@carpedium.dev",
                "enrollment_number": "ENR2026008",
                "branch": "Business Administration",
                "college_name": "Carpedium School of Management",
                "location": "Delhi",
                "gender": "female",
            },
            {
                "full_name": "Arjun Shah",
                "email": "arjun.shah@carpedium.dev",
                "enrollment_number": "ENR2026009",
                "branch": "Electrical Engineering",
                "college_name": "Carpedium Engineering College",
                "location": "Jaipur",
                "gender": "male",
            },
            {
                "full_name": "Tara Iyer",
                "email": "tara.iyer@carpedium.dev",
                "enrollment_number": "ENR2026010",
                "branch": "Design",
                "college_name": "Carpedium School of Design",
                "location": "Bengaluru",
                "gender": "female",
            },
        ]

        for index, payload in enumerate(users, start=1):
            payload.setdefault("phone", f"9000026{index:03d}")
            User(
                **payload,
                password_hash=make_password("Student@12345"),
                role="user",
                is_active=True,
            ).save()

        self.stdout.write(self.style.SUCCESS("Replaced old student users with 10 demo users. Password: Student@12345"))
