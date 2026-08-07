from django.core.management.base import BaseCommand

from api.documents import User


class Command(BaseCommand):
    help = "Convert numeric or otherwise non-string user phone values to strings in MongoDB."

    def handle(self, *args, **options):
        collection = User._get_collection()
        changed = 0

        for document in collection.find({"mobile": {"$exists": True, "$ne": None}}):
            value = document.get("mobile")
            if isinstance(value, str):
                continue
            collection.update_one(
                {"_id": document["_id"]},
                {"$set": {"mobile": str(value)}},
            )
            changed += 1

        self.stdout.write(self.style.SUCCESS(f"Normalized {changed} user phone number(s)."))
