from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import (
    Student, MealLog, SurplusFood, FoodClaim, FoodDonation, MealFeedback,
    MealBooking, Ingredient, MealIngredient, MealCost, NGOContact,
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'is_active']

class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'user', 'name', 'room_no', 'dietary_pref', 'username', 'email']
        read_only_fields = ['user']

class RegisterSerializer(serializers.Serializer):
    """Handles new-account creation for Student, NGO, or Admin profiles."""
    role = serializers.CharField(default='student')
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # Student fields
    room_no = serializers.CharField(max_length=10, required=False, allow_blank=True)
    dietary_pref = serializers.CharField(max_length=50, required=False, allow_blank=True)

    # NGO fields
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    city = serializers.CharField(max_length=50, required=False, allow_blank=True)
    registration_no = serializers.CharField(max_length=50, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    # Admin fields
    admin_code = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('That username is already taken.')
        return value

    def validate(self, attrs):
        role = attrs.get('role', 'student').lower()
        if role == 'admin':
            admin_code = attrs.get('admin_code', '')
            if admin_code != 'ADMIN2025':
                raise serializers.ValidationError({'admin_code': 'Invalid Admin Secret Code.'})
        return attrs

    def create(self, validated_data):
        role = validated_data.get('role', 'student').lower()
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        if role == 'ngo':
            NGOContact.objects.create(
                user=user,
                name=validated_data.get('name') or user.username,
                email=validated_data.get('email', '') or user.email,
                phone=validated_data.get('phone', ''),
                city=validated_data.get('city', ''),
                registration_no=validated_data.get('registration_no', ''),
                address=validated_data.get('address', ''),
            )
        elif role == 'admin':
            user.is_staff = True
            user.is_superuser = True
            user.save()
        else:
            Student.objects.create(
                user=user,
                name=validated_data.get('name') or user.username,
                room_no=validated_data.get('room_no', 'N/A'),
                dietary_pref=validated_data.get('dietary_pref', ''),
            )
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class MealLogSerializer(serializers.ModelSerializer):
    surplus_kg = serializers.ReadOnlyField()

    class Meta:
        model = MealLog
        fields = '__all__'

    def validate(self, attrs):
        prepared = attrs.get('prepared_kg')
        consumed = attrs.get('consumed_kg')
        # On partial updates (PUT with only one field), fall back to instance values
        if prepared is None and self.instance:
            prepared = self.instance.prepared_kg
        if consumed is None and self.instance:
            consumed = self.instance.consumed_kg
        if prepared is not None and consumed is not None and consumed > prepared:
            raise serializers.ValidationError(
                {'consumed_kg': 'Consumed quantity cannot exceed prepared quantity.'}
            )
        return attrs

class FoodClaimSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    ngo_name = serializers.CharField(source='ngo.name', read_only=True)
    surplus_description = serializers.CharField(source='surplus.description', read_only=True)

    class Meta:
        model = FoodClaim
        fields = '__all__'

class FoodDonationSerializer(serializers.ModelSerializer):
    ngo_name = serializers.CharField(source='ngo.name', read_only=True)

    class Meta:
        model = FoodDonation
        fields = '__all__'

class SurplusFoodSerializer(serializers.ModelSerializer):
    claims = FoodClaimSerializer(many=True, read_only=True)
    class Meta:
        model = SurplusFood
        fields = '__all__'

class MealFeedbackSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = MealFeedback
        fields = '__all__'

class MealBookingSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    room_no = serializers.CharField(source='student.room_no', read_only=True)

    class Meta:
        model = MealBooking
        fields = '__all__'
        read_only_fields = ['student']

class IngredientSerializer(serializers.ModelSerializer):
    is_low = serializers.SerializerMethodField()

    class Meta:
        model = Ingredient
        fields = '__all__'

    def get_is_low(self, obj):
        return obj.stock_kg <= obj.low_stock_alert

class MealIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)

    class Meta:
        model = MealIngredient
        fields = '__all__'

class MealCostSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealCost
        fields = '__all__'

class NGOContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = NGOContact
        fields = '__all__'