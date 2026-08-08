from django.db import models
from django.contrib.auth.models import User

MEAL_CHOICES = [
    ('Breakfast', 'Breakfast'),
    ('Lunch', 'Lunch'),
    ('Dinner', 'Dinner')
]

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile', null=True, blank=True)
    name = models.CharField(max_length=100)
    room_no = models.CharField(max_length=10)
    dietary_pref = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name

class MealLog(models.Model):
    meal_name = models.CharField(max_length=100)
    meal_type = models.CharField(max_length=20, choices=MEAL_CHOICES)
    date = models.DateField(auto_now_add=True)
    day_of_week = models.IntegerField()
    prepared_kg = models.FloatField()
    consumed_kg = models.FloatField()

    @property
    def surplus_kg(self):
        return round(self.prepared_kg - self.consumed_kg, 2)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.consumed_kg is not None and self.prepared_kg is not None and self.consumed_kg > self.prepared_kg:
            raise ValidationError({'consumed_kg': 'Consumed quantity cannot exceed prepared quantity.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.date} - {self.meal_type}: {self.meal_name}'

class SurplusFood(models.Model):
    meal_log = models.OneToOneField(MealLog, on_delete=models.CASCADE, related_name='surplus')
    quantity_kg = models.FloatField()
    description = models.CharField(max_length=200)
    is_available = models.BooleanField(default=True)
    posted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Surplus: {self.quantity_kg}kg - {self.description}'

class NGOContact(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ngo_profile', null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    city = models.CharField(max_length=50)
    registration_no = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name} - {self.city}'

class FoodClaim(models.Model):
    CLAIM_STATUS = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    surplus = models.ForeignKey(SurplusFood, on_delete=models.CASCADE, related_name='claims')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True)
    ngo = models.ForeignKey(NGOContact, on_delete=models.SET_NULL, null=True, blank=True, related_name='claims')
    claim_type = models.CharField(max_length=20, default='Student') # Student or NGO
    quantity_kg = models.FloatField()
    status = models.CharField(max_length=20, choices=CLAIM_STATUS, default='Approved')
    claimed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        claimer = self.ngo.name if self.ngo else (self.student.name if self.student else "Unknown")
        return f'{claimer} ({self.claim_type}) claimed {self.quantity_kg}kg [{self.status}]'

class FoodDonation(models.Model):
    ngo = models.ForeignKey(NGOContact, on_delete=models.CASCADE, related_name='donations')
    surplus = models.ForeignKey(SurplusFood, on_delete=models.SET_NULL, null=True, blank=True)
    quantity_kg = models.FloatField()
    donated_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f'{self.quantity_kg}kg donated to {self.ngo.name}'

class MealFeedback(models.Model):
    meal_log = models.ForeignKey(MealLog, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField(blank=True)

    def __str__(self):
        return f'{self.student} rated {self.rating}/5'

class MealBooking(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='bookings')
    meal_type = models.CharField(max_length=20, choices=MEAL_CHOICES)
    date = models.DateField()
    booked_at = models.DateTimeField(auto_now_add=True)
    registered_by_admin = models.BooleanField(default=False)
    attended = models.BooleanField(default=False)
    attended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['student', 'meal_type', 'date']

    def __str__(self):
        return f'{self.student} booked {self.meal_type} on {self.date}'

class Ingredient(models.Model):
    name = models.CharField(max_length=100)
    stock_kg = models.FloatField()
    unit = models.CharField(max_length=20, default='kg')
    low_stock_alert = models.FloatField(default=5.0)

    def __str__(self):
        return f'{self.name}: {self.stock_kg}{self.unit}'

class MealIngredient(models.Model):
    meal_name = models.CharField(max_length=100)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity_per_kg = models.FloatField()

    def __str__(self):
        return f'{self.meal_name} needs {self.quantity_per_kg}kg of {self.ingredient}'

class MealCost(models.Model):
    meal_log = models.OneToOneField(MealLog, on_delete=models.CASCADE, related_name='cost')
    cost_per_kg = models.FloatField()
    total_cost = models.FloatField()
    cost_per_student = models.FloatField()

    def __str__(self):
        return f'Cost for {self.meal_log}: Rs.{self.total_cost}'
