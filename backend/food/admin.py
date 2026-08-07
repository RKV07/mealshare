from django.contrib import admin
from .models import (
    Student, MealLog, SurplusFood, FoodClaim, MealFeedback,
    MealBooking, Ingredient, MealIngredient, MealCost, NGOContact,
)

admin.site.register(Student)
admin.site.register(MealLog)
admin.site.register(SurplusFood)
admin.site.register(FoodClaim)
admin.site.register(MealFeedback)
admin.site.register(MealBooking)
admin.site.register(Ingredient)
admin.site.register(MealIngredient)
admin.site.register(MealCost)
admin.site.register(NGOContact)