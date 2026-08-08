from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import date, timedelta
import numpy as np

from .models import (Student, MealLog, SurplusFood, FoodClaim, FoodDonation, MealFeedback,
                     MealBooking, Ingredient, MealIngredient, NGOContact)
from .serializers import (StudentSerializer, MealLogSerializer, SurplusFoodSerializer,
                          FoodClaimSerializer, FoodDonationSerializer, MealFeedbackSerializer,
                          MealBookingSerializer, IngredientSerializer, MealIngredientSerializer,
                          NGOContactSerializer)
from .permissions import IsAdminUser
from .ml_model import predict_demand

# ─── Students (Admin Only) ───────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def students(request):
    if request.method == 'GET':
        return Response(StudentSerializer(Student.objects.all().order_by('-id'), many=True).data)
    s = StudentSerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def students_detail(request, pk):
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)

    if request.method == 'GET':
        return Response(StudentSerializer(student).data)

    if request.method == 'PUT':
        s = StudentSerializer(student, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    if request.method == 'DELETE':
        user = student.user
        student.delete()
        if user and not (user.is_staff or user.is_superuser):
            user.delete()
        return Response({'message': 'Student deleted successfully'})


# ─── Meal Logs ───────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def meal_logs(request):
    if request.method == 'GET':
        logs = MealLog.objects.all().order_by('-date', '-id')
        return Response(MealLogSerializer(logs, many=True).data)

    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'detail': 'Only admins can log meals.'}, status=403)

    data = request.data.copy()
    data['day_of_week'] = date.today().weekday()
    s = MealLogSerializer(data=data)
    if s.is_valid():
        log = s.save()
        if log.surplus_kg > 0:
            SurplusFood.objects.create(
                meal_log=log,
                quantity_kg=log.surplus_kg,
                description=f'{log.surplus_kg}kg of {log.meal_name} available'
            )
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def meal_log_detail(request, pk):
    try:
        log = MealLog.objects.get(pk=pk)
    except MealLog.DoesNotExist:
        return Response({'error': 'Meal log not found'}, status=404)

    if request.method == 'GET':
        return Response(MealLogSerializer(log).data)

    if request.method == 'PUT':
        s = MealLogSerializer(log, data=request.data, partial=True)
        if s.is_valid():
            updated = s.save()
            if hasattr(updated, 'surplus'):
                surplus = updated.surplus
                surplus.quantity_kg = max(0, updated.surplus_kg)
                surplus.description = f'{updated.surplus_kg}kg of {updated.meal_name} available'
                surplus.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    if request.method == 'DELETE':
        log.delete()
        return Response({'message': 'Meal log deleted'})


# ─── Surplus ─────────────────────────────────────────────────────────────────
@api_view(['GET'])
def surplus_board(request):
    surplus = SurplusFood.objects.filter(is_available=True).order_by('-posted_at')
    return Response(SurplusFoodSerializer(surplus, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_surplus(request, surplus_id):
    try:
        surplus = SurplusFood.objects.get(pk=surplus_id)
    except SurplusFood.DoesNotExist:
        return Response({'error': 'Surplus not found'}, status=404)

    if not surplus.is_available:
        return Response({'error': 'Already claimed'}, status=400)

    student = getattr(request.user, 'student_profile', None)
    if not student and request.user.is_authenticated:
        name = request.user.get_full_name() or request.user.username or 'Admin'
        student, _ = Student.objects.get_or_create(
            user=request.user,
            defaults={
                'name': name,
                'room_no': 'Admin' if (request.user.is_staff or request.user.is_superuser) else 'N/A',
                'dietary_pref': ''
            }
        )
    claim = FoodClaim.objects.create(
        surplus=surplus,
        student=student,
        claim_type='Student',
        quantity_kg=surplus.quantity_kg,
        status='Pending'
    )
    return Response({
        'message': 'Food claim request submitted! Pending admin approval.',
        'claim_id': claim.id,
        'status': 'Pending'
    }, status=201)


@api_view(['GET'])
def unclaimed_surplus_for_ngo(request):
    cutoff = timezone.now() - timedelta(hours=2)
    stale = SurplusFood.objects.filter(is_available=True, posted_at__lte=cutoff)
    return Response(SurplusFoodSerializer(stale, many=True).data)


# ─── Feedback ────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_feedback(request):
    s = MealFeedbackSerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


# ─── Prediction & Reports ────────────────────────────────────────────────────
@api_view(['GET'])
def predict_tomorrow(request):
    meal_type = request.GET.get('meal_type', 'Lunch')
    logs = MealLog.objects.filter(meal_type=meal_type).order_by('-date')
    if not logs.exists():
        return Response({'meal_type': meal_type, 'predicted_kg': 50,
                         'note': 'No history yet — using default estimate of 50kg.'})
    prev = logs.first().consumed_kg
    avg = float(np.mean([l.consumed_kg for l in logs[:7]]))
    tomorrow_dow = (date.today().weekday() + 1) % 7
    predicted = predict_demand(tomorrow_dow, prev, avg)
    return Response({'meal_type': meal_type, 'predicted_kg': predicted,
                     'note': f'Prepare {predicted}kg for tomorrow ({meal_type})'})


@api_view(['GET'])
def waste_report(request):
    logs = MealLog.objects.all()
    total_prepared = sum(l.prepared_kg for l in logs)
    total_consumed = sum(l.consumed_kg for l in logs)
    total_waste = round(total_prepared - total_consumed, 2)
    waste_pct = round((total_waste / total_prepared * 100) if total_prepared else 0, 1)
    return Response({
        'total_prepared_kg': total_prepared,
        'total_consumed_kg': total_consumed,
        'total_waste_kg': total_waste,
        'waste_percentage': waste_pct,
    })


# ─── Bookings ────────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def meal_bookings(request):
    student = getattr(request.user, 'student_profile', None)
    if not student and request.user.is_authenticated:
        name = request.user.get_full_name() or request.user.username or 'Admin'
        student, _ = Student.objects.get_or_create(
            user=request.user,
            defaults={
                'name': name,
                'room_no': 'Admin' if (request.user.is_staff or request.user.is_superuser) else 'N/A',
                'dietary_pref': ''
            }
        )
    if request.method == 'GET':
        if not student:
            return Response([])
        bookings = MealBooking.objects.filter(student=student).order_by('-date')
        return Response(MealBookingSerializer(bookings, many=True).data)

    if not student:
        return Response({'error': 'Could not identify student profile for booking.'}, status=400)

    s = MealBookingSerializer(data=request.data)
    if s.is_valid():
        already = MealBooking.objects.filter(
            student=student,
            meal_type=s.validated_data['meal_type'],
            date=s.validated_data['date'],
        ).exists()
        if already:
            return Response(
                {'non_field_errors': [f"You already have a {s.validated_data['meal_type']} booking on {s.validated_data['date']}."]},
                status=400,
            )
        s.save(student=student)
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def all_bookings(request):
    qs = MealBooking.objects.all().order_by('-date', 'meal_type')
    meal_type = request.GET.get('meal_type')
    booking_date = request.GET.get('date')
    if meal_type:
        qs = qs.filter(meal_type=meal_type)
    if booking_date:
        qs = qs.filter(date=booking_date)
    return Response(MealBookingSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_register_booking(request):
    student_id = request.data.get('student_id')
    if not student_id:
        return Response({'error': 'student_id is required'}, status=400)
    try:
        student = Student.objects.get(pk=student_id)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    data = {'meal_type': request.data.get('meal_type'), 'date': request.data.get('date')}
    s = MealBookingSerializer(data=data)
    if s.is_valid():
        already = MealBooking.objects.filter(
            student=student,
            meal_type=s.validated_data['meal_type'],
            date=s.validated_data['date'],
        ).exists()
        if already:
            return Response(
                {'non_field_errors': [f"{student.name} already has a {s.validated_data['meal_type']} booking on {s.validated_data['date']}."]},
                status=400,
            )
        s.save(student=student, registered_by_admin=True)
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, booking_id):
    try:
        if request.user.is_staff or request.user.is_superuser:
            booking = MealBooking.objects.get(pk=booking_id)
        else:
            student = getattr(request.user, 'student_profile', None)
            booking = MealBooking.objects.get(pk=booking_id, student=student)
    except MealBooking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    booking.delete()
    return Response({'message': 'Booking cancelled'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def mark_attendance(request, booking_id):
    try:
        booking = MealBooking.objects.get(pk=booking_id)
    except MealBooking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    if booking.attended:
        return Response({'error': 'Already marked attended'}, status=400)
    booking.attended = True
    booking.attended_at = timezone.now()
    booking.save()
    return Response({
        'success': True,
        'student': booking.student.name,
        'meal_type': booking.meal_type,
        'date': str(booking.date),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_count_today(request):
    meal_type = request.GET.get('meal_type', 'Lunch')
    tomorrow = date.today() + timedelta(days=1)
    count = MealBooking.objects.filter(meal_type=meal_type, date=tomorrow).count()
    return Response({'meal_type': meal_type, 'date': str(tomorrow), 'booked_count': count})


# ─── Ingredients (Admin Only) ────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def ingredients(request):
    if request.method == 'GET':
        return Response(IngredientSerializer(Ingredient.objects.all().order_by('name'), many=True).data)
    s = IngredientSerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def low_stock_alerts(request):
    low = [i for i in Ingredient.objects.all() if i.stock_kg <= i.low_stock_alert]
    return Response(IngredientSerializer(low, many=True).data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def deduct_stock_for_meal(request):
    meal_name = request.data.get('meal_name')
    prepared_kg = float(request.data.get('prepared_kg', 0))
    links = MealIngredient.objects.filter(meal_name=meal_name)
    updated = []
    for link in links:
        needed = link.quantity_per_kg * prepared_kg
        ing = link.ingredient
        ing.stock_kg = max(0, ing.stock_kg - needed)
        ing.save()
        updated.append({'ingredient': ing.name, 'remaining_kg': ing.stock_kg})
    return Response({'updated': updated})


# ─── NGO Management & Claims (Admin Only) ────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def ngo_contacts(request):
    if request.method == 'GET':
        return Response(NGOContactSerializer(NGOContact.objects.all().order_by('name'), many=True).data)
    s = NGOContactSerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def ngo_contact_detail(request, pk):
    try:
        ngo = NGOContact.objects.get(pk=pk)
    except NGOContact.DoesNotExist:
        return Response({'error': 'NGO contact not found'}, status=404)

    if request.method == 'GET':
        return Response(NGOContactSerializer(ngo).data)

    if request.method == 'PUT':
        s = NGOContactSerializer(ngo, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    if request.method == 'DELETE':
        ngo.delete()
        return Response({'message': 'NGO contact deleted'})


def _get_ngo_profile(user):
    if not user or not user.is_authenticated:
        return None
    ngo_profile = getattr(user, 'ngo_profile', None)
    if not ngo_profile:
        ngo_profile = NGOContact.objects.filter(user=user).first() or NGOContact.objects.filter(email__iexact=user.email).first()
        if ngo_profile and not ngo_profile.user:
            ngo_profile.user = user
            ngo_profile.save()
    return ngo_profile


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ngo_claims(request):
    ngo_profile = _get_ngo_profile(request.user)

    if request.method == 'GET':
        if request.user.is_staff or request.user.is_superuser:
            claims = FoodClaim.objects.all().order_by('-claimed_at')
        elif ngo_profile:
            claims = FoodClaim.objects.filter(ngo=ngo_profile, claim_type='NGO').order_by('-claimed_at')
        else:
            claims = FoodClaim.objects.filter(claim_type='NGO').order_by('-claimed_at')
        return Response(FoodClaimSerializer(claims, many=True).data)

    # Submit new NGO claim
    surplus_id = request.data.get('surplus_id')
    quantity_kg = float(request.data.get('quantity_kg', 0))
    notes = request.data.get('notes', '')
    ngo_id = request.data.get('ngo_id')

    try:
        surplus = SurplusFood.objects.get(pk=surplus_id)
        if ngo_profile:
            ngo = ngo_profile
        elif ngo_id:
            ngo = NGOContact.objects.get(pk=ngo_id)
        else:
            ngo = NGOContact.objects.create(
                user=request.user,
                name=request.user.first_name or request.user.username,
                email=request.user.email,
                phone='',
                city='',
            )
    except (SurplusFood.DoesNotExist, NGOContact.DoesNotExist):
        return Response({'error': 'Invalid surplus or NGO ID'}, status=400)

    if not surplus.is_available:
        return Response({'error': 'This surplus food has already been claimed or is unavailable.'}, status=400)

    claim = FoodClaim.objects.create(
        surplus=surplus,
        ngo=ngo,
        claim_type='NGO',
        quantity_kg=quantity_kg or surplus.quantity_kg,
        status='Pending',
        notes=notes
    )
    return Response(FoodClaimSerializer(claim).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ngo_dashboard_stats(request):
    ngo_profile = _get_ngo_profile(request.user)
    available_surplus = SurplusFood.objects.filter(is_available=True)
    available_surplus_kg = sum(s.quantity_kg for s in available_surplus)

    if ngo_profile:
        my_claims = FoodClaim.objects.filter(ngo=ngo_profile)
        my_donations = FoodDonation.objects.filter(ngo=ngo_profile)
        pending_count = my_claims.filter(status='Pending').count()
        approved_count = my_claims.filter(status='Approved').count()
        rejected_count = my_claims.filter(status='Rejected').count()
        total_donated_kg = sum(d.quantity_kg for d in my_donations)
        recent_claims = FoodClaimSerializer(my_claims.order_by('-claimed_at')[:10], many=True).data
    else:
        all_ngo_claims = FoodClaim.objects.filter(claim_type='NGO')
        pending_count = all_ngo_claims.filter(status='Pending').count()
        approved_count = all_ngo_claims.filter(status='Approved').count()
        rejected_count = all_ngo_claims.filter(status='Rejected').count()
        total_donated_kg = sum(d.quantity_kg for d in FoodDonation.objects.all())
        recent_claims = FoodClaimSerializer(all_ngo_claims.order_by('-claimed_at')[:10], many=True).data

    return Response({
        'cards': {
            'available_surplus_count': available_surplus.count(),
            'available_surplus_kg': round(available_surplus_kg, 1),
            'pending_claims': pending_count,
            'approved_claims': approved_count,
            'rejected_claims': rejected_count,
            'total_donated_kg': round(total_donated_kg, 1),
        },
        'recent_claims': recent_claims,
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_ngo_claim(request, claim_id):
    try:
        claim = FoodClaim.objects.get(pk=claim_id)
    except FoodClaim.DoesNotExist:
        return Response({'error': 'Claim not found'}, status=404)

    if claim.status == 'Approved':
        return Response({'error': 'Claim already approved'}, status=400)

    claim.status = 'Approved'
    claim.save()

    if claim.surplus:
        claim.surplus.is_available = False
        claim.surplus.save()

    if claim.ngo:
        FoodDonation.objects.create(
            ngo=claim.ngo,
            surplus=claim.surplus,
            quantity_kg=claim.quantity_kg,
            notes=claim.notes
        )

    return Response({'message': 'NGO claim approved successfully', 'claim': FoodClaimSerializer(claim).data})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def reject_ngo_claim(request, claim_id):
    try:
        claim = FoodClaim.objects.get(pk=claim_id)
    except FoodClaim.DoesNotExist:
        return Response({'error': 'Claim not found'}, status=404)

    claim.status = 'Rejected'
    claim.save()
    return Response({'message': 'NGO claim rejected', 'claim': FoodClaimSerializer(claim).data})


# ─── Comprehensive Admin Dashboard Analytics ─────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    today_str = date.today().isoformat()

    total_students = Student.objects.count()
    todays_bookings = MealBooking.objects.filter(date=today_str).count()
    meals_served = MealBooking.objects.filter(date=today_str, attended=True).count()

    remaining_meals = sum(s.quantity_kg for s in SurplusFood.objects.filter(is_available=True))
    pending_ngo_claims = FoodClaim.objects.filter(claim_type='NGO', status='Pending').count()
    total_donations_kg = sum(d.quantity_kg for d in FoodDonation.objects.all())

    # Daily Bookings chart (last 7 days)
    daily_bookings = []
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        cnt = MealBooking.objects.filter(date=d).count()
        daily_bookings.append({'day': d.strftime('%b %d'), 'bookings': cnt})

    # Weekly Meal Usage
    weekly_usage = []
    logs = MealLog.objects.all().order_by('-date')[:14]
    by_date = {}
    for m in reversed(logs):
        d_str = m.date.strftime('%b %d')
        if d_str not in by_date:
            by_date[d_str] = {'day': d_str, 'Prepared': 0, 'Consumed': 0}
        by_date[d_str]['Prepared'] += m.prepared_kg
        by_date[d_str]['Consumed'] += m.consumed_kg
    weekly_usage = list(by_date.values())[-7:]

    # Recent tables
    recent_bookings = MealBookingSerializer(MealBooking.objects.all().order_by('-id')[:10], many=True).data
    recent_claims = FoodClaimSerializer(FoodClaim.objects.all().order_by('-id')[:10], many=True).data
    recent_students = StudentSerializer(Student.objects.all().order_by('-id')[:10], many=True).data

    return Response({
        'cards': {
            'total_students': total_students,
            'todays_bookings': todays_bookings,
            'meals_served': meals_served,
            'remaining_meals_kg': round(remaining_meals, 1),
            'pending_ngo_claims': pending_ngo_claims,
            'total_donations_kg': round(total_donations_kg, 1),
        },
        'charts': {
            'daily_bookings': daily_bookings,
            'weekly_usage': weekly_usage,
        },
        'tables': {
            'recent_bookings': recent_bookings,
            'recent_claims': recent_claims,
            'recent_students': recent_students,
        }
    })