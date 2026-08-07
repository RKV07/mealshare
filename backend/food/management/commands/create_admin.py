from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates or updates a default superuser account (admin / admin123)'

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(username='admin')
        user.set_password('admin123')
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.email = 'admin@mealshare.app'
        user.first_name = 'System'
        user.last_name = 'Admin'
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS('Superuser "admin" created successfully with password "admin123".'))
        else:
            self.stdout.write(self.style.SUCCESS('Superuser "admin" updated successfully with password "admin123".'))
