from django.core.management.base import BaseCommand
from api.documents import Event, Registration

class Command(BaseCommand):
    help = "Delete the 27 non-sports events and their associated registrations."

    def handle(self, *args, **options):
        # The 27 events are those whose category is not "Boys", "Girls", or "Both"
        categories_to_keep = ["Boys", "Girls", "Both"]
        
        events_to_delete = Event.objects(category__nin=categories_to_keep)
        event_count = len(events_to_delete)
        
        self.stdout.write(self.style.NOTICE(f"Found {event_count} events to delete."))
        
        if event_count == 0:
            self.stdout.write(self.style.SUCCESS("No events found to delete."))
            return
            
        event_ids = [e.id for e in events_to_delete]
        
        # Delete registrations associated with these events
        registrations_to_delete = Registration.objects(event__in=event_ids)
        reg_count = len(registrations_to_delete)
        self.stdout.write(self.style.NOTICE(f"Found {reg_count} registrations associated with these events."))
        
        if reg_count > 0:
            registrations_to_delete.delete()
            self.stdout.write(self.style.SUCCESS(f"Deleted {reg_count} registrations successfully."))
            
        # Delete events
        events_to_delete.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {event_count} events successfully."))
