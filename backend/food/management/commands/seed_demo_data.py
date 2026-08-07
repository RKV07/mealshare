"""
Seeds the database with realistic demo data so the dashboard, charts,
and surplus board have something to show.

Usage:
    python manage.py seed_demo_data
    python manage.py seed_demo_data --days 14        # more history
    python manage.py seed_demo_data --wipe            # clear old demo data first
"""
import random
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from food.models import Student, MealLog, SurplusFood, Ingredient, NGOContact

MEAL_NAMES = {
    "Breakfast": ["Poha", "Idli Sambar", "Aloo Paratha", "Upma", "Bread Omelette"],
    "Lunch": ["Dal Rice & Sabzi", "Rajma Chawal", "Veg Pulao", "Chole Bhature", "Sambar Rice"],
    "Dinner": ["Paneer Curry & Roti", "Khichdi", "Veg Biryani", "Kadhi Chawal", "Mixed Veg & Roti"],
}

STUDENT_NAMES = [
    ("Aarav Shah", "A101"), ("Diya Patel", "A102"), ("Kabir Mehta", "B201"),
    ("Isha Verma", "B202"), ("Rohan Nair", "C301"), ("Ananya Iyer", "C302"),
]


class Command(BaseCommand):
    help = "Seeds realistic demo data: students, meal logs, and surplus."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=10, help="How many past days of meals to generate")
        parser.add_argument("--wipe", action="store_true", help="Delete existing MealLog/SurplusFood rows first")

    def handle(self, *args, **options):
        days = options["days"]

        if options["wipe"]:
            SurplusFood.objects.all().delete()
            MealLog.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing MealLog and SurplusFood rows."))

        # ---------------- Students (skip ones that already exist) ----------------
        created_students = 0
        for name, room in STUDENT_NAMES:
            _, created = Student.objects.get_or_create(
                name=name, room_no=room, defaults={"dietary_pref": random.choice(["Veg", "Non-Veg", ""])}
            )
            created_students += created
        self.stdout.write(self.style.SUCCESS(f"Students ready ({created_students} new)."))

        # ---------------- Meal logs + surplus ----------------
        today = timezone.now().date()
        created_logs = 0
        created_surplus = 0

        for day_offset in range(days, 0, -1):
            log_date = today - timedelta(days=day_offset)
            for meal_type in ["Breakfast", "Lunch", "Dinner"]:
                meal_name = random.choice(MEAL_NAMES[meal_type])

                base = {"Breakfast": 60, "Lunch": 95, "Dinner": 85}[meal_type]
                prepared = round(base + random.uniform(-10, 15), 1)
                # most days: 5-15% waste. occasional bad day: 25-35% waste.
                waste_pct = random.choice([random.uniform(0.05, 0.15)] * 4 + [random.uniform(0.25, 0.35)])
                consumed = round(prepared * (1 - waste_pct), 1)

                log = MealLog.objects.create(
                    meal_name=meal_name,
                    meal_type=meal_type,
                    date=log_date,
                    day_of_week=log_date.weekday(),
                    prepared_kg=prepared,
                    consumed_kg=consumed,
                )
                created_logs += 1

                surplus = log.surplus_kg
                if surplus > 0:
                    SurplusFood.objects.create(
                        meal_log=log,
                        quantity_kg=surplus,
                        description=f"{surplus}kg of {meal_name} available",
                        is_available=(day_offset <= 1),  # only today's/yesterday's surplus still "available"
                    )
                    created_surplus += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created_logs} meal logs across {days} days."))
        self.stdout.write(self.style.SUCCESS(f"Created {created_surplus} surplus entries."))

        # ---------------- A couple of ingredients + an NGO contact (optional extras) ----------------
        Ingredient.objects.get_or_create(name="Rice", defaults={"stock_kg": 40, "low_stock_alert": 10})
        Ingredient.objects.get_or_create(name="Paneer", defaults={"stock_kg": 6, "low_stock_alert": 5})
        NGOContact.objects.get_or_create(
            name="Anna Seva Foundation",
            defaults={"email": "contact@annaseva.org", "phone": "9876543210", "city": "Ahmedabad"},
        )

        self.stdout.write(self.style.SUCCESS("Done. Refresh the dashboard — data should be live now."))
