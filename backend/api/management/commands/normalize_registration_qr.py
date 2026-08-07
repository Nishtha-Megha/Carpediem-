import uuid

from django.core.management.base import BaseCommand

from api.documents import Registration


class Command(BaseCommand):
    help = "Add opaque QR tokens to registrations created before QR support."

    def handle(self, *args, **options):
        collection = Registration._get_collection()
        updated = 0

        legacy_filter = {
            "$or": [
                {"qrToken": {"$exists": False}},
                {"qrToken": None},
                {"qrToken": ""},
            ]
        }
        for document in collection.find(legacy_filter):
            collection.update_one(
                {"_id": document["_id"]},
                {"$set": {"qrToken": uuid.uuid4().hex}},
            )
            updated += 1

        self.stdout.write(self.style.SUCCESS(f"Added QR tokens to {updated} registration(s)."))
