from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import RegisterSerializer, LoginSerializer, StudentSerializer

ADMIN_SECRET = "ADMIN2025"


def _user_payload(user):
    """
    Returns a unified profile structure for Students, NGOs, and Admins.
    """
    from .models import NGOContact
    is_admin = bool(user.is_staff or user.is_superuser)
    ngo_profile = getattr(user, 'ngo_profile', None)
    if not is_admin and not ngo_profile:
        ngo_profile = NGOContact.objects.filter(user=user).first() or NGOContact.objects.filter(email__iexact=user.email).first()
        if ngo_profile and not ngo_profile.user:
            ngo_profile.user = user
            ngo_profile.save()

    student_profile = getattr(user, 'student_profile', None)

    if is_admin:
        role = 'admin'
    elif ngo_profile:
        role = 'ngo'
    else:
        role = 'student'

    data = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': is_admin,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'is_active': user.is_active,
        'role': role,
    }

    if role == 'ngo' and ngo_profile:
        data.update({
            'ngo_id': ngo_profile.id,
            'id': ngo_profile.id,
            'name': ngo_profile.name,
            'email': ngo_profile.email or user.email,
            'phone': ngo_profile.phone,
            'city': ngo_profile.city,
            'registration_no': ngo_profile.registration_no,
            'address': ngo_profile.address,
        })
    elif student_profile:
        student_data = StudentSerializer(student_profile).data
        data.update(student_data)
    else:
        data.update({
            'id': None,
            'name': user.first_name or user.username,
            'room_no': 'Admin' if is_admin else 'N/A',
            'dietary_pref': '',
        })

    return data


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        payload = _user_payload(user)
        return Response({
            'token': token.key,
            'student': payload,
            'user': payload,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(
        username=serializer.validated_data['username'],
        password=serializer.validated_data['password'],
    )
    if user is None:
        return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({'error': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

    token, _ = Token.objects.get_or_create(user=user)
    payload = _user_payload(user)
    return Response({
        'token': token.key,
        'student': payload,
        'user': payload,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    payload = _user_payload(request.user)
    return Response(payload)
