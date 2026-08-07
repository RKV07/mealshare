# MealShare

A hostel food management and redistribution system with ML-powered demand prediction.

## Project Structure
```
MealShare/
├── backend/         # Django REST API
├── frontend/        # React + Vite + Tailwind
└── README.md
```

## Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # fill in your DB password
python manage.py migrate
python manage.py createsuperuser
cd food && python train_model.py && cd ..
python manage.py runserver
```

## Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_BASE_URL if needed
npm run dev
```

## API Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register/ | Register account |
| POST | /api/auth/login/ | Login |
| GET  | /api/meals/ | List meal logs |
| POST | /api/meals/ | Log a meal |
| GET  | /api/surplus/ | Surplus board |
| POST | /api/surplus/<id>/claim/ | Claim surplus |
| GET  | /api/predict/?meal_type=Lunch | ML prediction |
| GET  | /api/waste-report/ | Waste stats |
| GET  | /api/ingredients/ | Inventory |
| GET  | /api/ingredients/low-stock/ | Low stock alerts |
| GET/POST | /api/bookings/ | Meal bookings |
| GET  | /api/ngo/ | NGO contacts |

## Tech Stack
- **Backend**: Django 4.1, Django REST Framework, PostgreSQL
- **ML**: scikit-learn Linear Regression
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts
- **Auth**: DRF Token Authentication
- **Dark Mode**: Tailwind CSS dark class strategy
