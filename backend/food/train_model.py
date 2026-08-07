"""
Trains the next-day food demand predictor for MealShare.

Usage:
    python manage.py shell -c "from food.train_model import train; train()"
or directly:
    python food/train_model.py   (run from the project root with Django set up)

The model learns: given the day of week, how much was consumed for the
same meal type yesterday, and the 7-day rolling average consumption,
predict how much will be consumed tomorrow (in kg).

If there isn't enough real MealLog history yet in the database, this
falls back to a small bootstrap dataset (representative weekday/weekend
consumption pattern) so the app has a working model on day one. Once
enough real logs accumulate, re-run this script to retrain on real data.
"""
import os
import numpy as np
from sklearn.linear_model import LinearRegression
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
MIN_REAL_SAMPLES = 14  # retrain on real data once we have at least this many logs


def _bootstrap_dataset():
    """Small synthetic dataset representing a typical weekly pattern,
    used only until enough real data exists."""
    # Features: [day_of_week, prev_consumed_kg, avg_consumed_kg]
    X = np.array([
        [0, 45, 43], [1, 43, 43], [2, 44, 43], [3, 50, 44],
        [4, 52, 45], [5, 60, 47], [6, 58, 48],
        [0, 40, 45], [1, 42, 44], [2, 41, 43], [3, 45, 43],
        [4, 48, 44], [5, 55, 45], [6, 54, 46],
    ])
    y = np.array([43, 44, 50, 52, 60, 58, 45, 42, 41, 45, 48, 55, 54, 40])
    return X, y


def _real_dataset():
    """Build (X, y) from actual MealLog rows in the database.

    For each meal_type, sorts logs by date and builds:
      features = [day_of_week, prev_day_consumed, 7-day_avg_consumed]
      target   = that day's actual consumed_kg
    """
    # Import here (not at module top) so this file can be imported outside
    # a configured Django environment without raising AppRegistryNotReady.
    from .models import MealLog

    X, y = [], []
    for meal_type, _ in MealLog._meta.get_field('meal_type').choices:
        logs = list(
            MealLog.objects.filter(meal_type=meal_type).order_by('date')
        )
        for i in range(1, len(logs)):
            history = logs[max(0, i - 7):i]
            avg_consumed = float(np.mean([l.consumed_kg for l in history]))
            prev_consumed = logs[i - 1].consumed_kg
            X.append([logs[i].day_of_week, prev_consumed, avg_consumed])
            y.append(logs[i].consumed_kg)
    return np.array(X), np.array(y)


def train(verbose=True):
    """Trains and saves the model to model.pkl.

    Prefers real MealLog history once there's enough of it; otherwise
    falls back to the bootstrap dataset so prediction works immediately.
    """
    X, y = None, None
    source = 'bootstrap'

    try:
        X_real, y_real = _real_dataset()
        if len(X_real) >= MIN_REAL_SAMPLES:
            X, y = X_real, y_real
            source = 'real MealLog data'
    except Exception as exc:
        # Django not configured, empty DB, etc. — fall back silently.
        if verbose:
            print(f'Could not load real data ({exc}); using bootstrap dataset.')

    if X is None:
        X, y = _bootstrap_dataset()

    model = LinearRegression()
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)

    if verbose:
        print(f'model.pkl saved! Trained on {len(X)} samples from {source}.')
    return model


if __name__ == '__main__':
    # Allow running as a plain script: python food/train_model.py
    # (uses the bootstrap dataset only, since Django isn't set up here)
    train()
