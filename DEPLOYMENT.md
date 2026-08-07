# MealShare — Deployment Guide

## Stack
- Backend → Render.com (free)
- Frontend → Vercel (free)
- Database → Supabase (free PostgreSQL)

---

## STEP 1 — Supabase (Database)

1. Go to https://supabase.com → Sign up free
2. Click "New Project"
3. Name: `mealshare` → set a strong DB password → Create
4. Go to Settings → Database → copy these values:
   - Host
   - Database name
   - User
   - Password
   - Port (usually 5432)

Keep these — you'll need them for Render.

---

## STEP 2 — GitHub (Push your code)

1. Go to https://github.com → New repository → name: `mealshare`
2. In your project folder run:

```bash
git init
git add .
git commit -m "Initial commit — MealShare"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mealshare.git
git push -u origin main
```

---

## STEP 3 — Render.com (Backend)

1. Go to https://render.com → Sign up free → New → Web Service
2. Connect your GitHub → select `mealshare` repo
3. Settings:
   - Name: `mealshare-backend`
   - Root Directory: `backend`
   - Runtime: Python
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - Start Command: `gunicorn mealshare.wsgi:application --bind 0.0.0.0:$PORT`

4. Environment Variables (click Add):
   ```
   DJANGO_SECRET_KEY    → click "Generate" button
   DEBUG                → False
   ALLOWED_HOSTS        → .onrender.com,localhost
   DB_NAME              → (from Supabase)
   DB_USER              → (from Supabase)
   DB_PASSWORD          → (from Supabase)
   DB_HOST              → (from Supabase)
   DB_PORT              → 5432
   CORS_ALLOWED_ORIGINS → https://your-app.vercel.app (add after Vercel deploy)
   ```

5. Click Deploy — wait ~3 mins
6. Your API will be live at: `https://mealshare-backend.onrender.com`

---

## STEP 4 — Train ML model before deploying

In your local backend folder:
```bash
cd backend/food
python train_model.py
cd ..
git add food/model.pkl
git commit -m "Add trained ML model"
git push
```

---

## STEP 5 — Vercel (Frontend)

1. Go to https://vercel.com → Sign up free → New Project
2. Import your GitHub `mealshare` repo
3. Settings:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. Environment Variables:
   ```
   VITE_API_BASE_URL → https://mealshare-backend.onrender.com/api
   ```

5. Click Deploy — done in ~1 min
6. Your app will be live at: `https://mealshare.vercel.app`

---

## STEP 6 — Update CORS on Render

Go back to Render → mealshare-backend → Environment:
```
CORS_ALLOWED_ORIGINS → https://mealshare.vercel.app
```
Redeploy.

---

## STEP 7 — Create superuser on production

In Render dashboard → mealshare-backend → Shell:
```bash
python manage.py createsuperuser
```

---

## STEP 8 — Update api.js for production

In `frontend/src/api.js`, update the base URL to use env variable:

```javascript
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
});
```

---

## Final URLs

| Service | URL |
|---------|-----|
| Frontend | https://mealshare.vercel.app |
| Backend API | https://mealshare-backend.onrender.com/api |
| Admin panel | https://mealshare-backend.onrender.com/admin |

---

## Local Development (always works)

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Terminal 2 — Frontend  
cd frontend
npm install
npm run dev
```
