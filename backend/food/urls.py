from django.urls import path
from . import views, auth_views

urlpatterns = [
    # Auth
    path('auth/register/',      auth_views.register),
    path('auth/login/',         auth_views.login),
    path('auth/logout/',        auth_views.logout),
    path('auth/me/',            auth_views.me),

    # Admin Analytics & Dashboard
    path('admin/dashboard-stats/', views.admin_dashboard_stats),

    # Students
    path('students/',           views.students),
    path('students/<int:pk>/',  views.students_detail),

    # Meal logs
    path('meals/',              views.meal_logs),
    path('meals/<int:pk>/',     views.meal_log_detail),

    # Surplus
    path('surplus/',                            views.surplus_board),
    path('surplus/unclaimed/',                  views.unclaimed_surplus_for_ngo),
    path('surplus/<int:surplus_id>/claim/',     views.claim_surplus),

    # Feedback
    path('feedback/',           views.add_feedback),

    # Prediction & reports
    path('predict/',            views.predict_tomorrow),
    path('waste-report/',       views.waste_report),

    # Bookings
    path('bookings/',                           views.meal_bookings),
    path('bookings/all/',                       views.all_bookings),
    path('bookings/count/',                     views.booking_count_today),
    path('bookings/register/',                  views.admin_register_booking),
    path('bookings/<int:booking_id>/',          views.cancel_booking),
    path('bookings/<int:booking_id>/attend/',   views.mark_attendance),

    # Ingredients
    path('ingredients/',                views.ingredients),
    path('ingredients/low-stock/',      views.low_stock_alerts),
    path('ingredients/deduct/',         views.deduct_stock_for_meal),

    # NGO Management & Claims
    path('ngo/',                                views.ngo_contacts),
    path('ngo/<int:pk>/',                       views.ngo_contact_detail),
    path('ngo/dashboard-stats/',                views.ngo_dashboard_stats),
    path('ngo/claims/',                         views.ngo_claims),
    path('ngo/claims/<int:claim_id>/approve/',  views.approve_ngo_claim),
    path('ngo/claims/<int:claim_id>/reject/',   views.reject_ngo_claim),
]
