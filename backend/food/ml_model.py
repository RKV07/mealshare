"""
Loads the trained demand-prediction model and exposes predict_demand().
"""
import os
import numpy as np
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')

_model_cache = None

def _get_model():
    """Lazily loads model.pkl, training a fresh one on the bootstrap
    dataset if it doesn't exist yet (e.g. first run after cloning)."""
    global _model_cache
    if _model_cache is not None:
        return _model_cache

    if not os.path.exists(MODEL_PATH):
        from .train_model import train
        train(verbose=False)

    _model_cache = joblib.load(MODEL_PATH)
    return _model_cache

def predict_demand(day_of_week, prev_consumed, avg_consumed):
    """
    Predicts kg needed for next meal.

    day_of_week: 0=Monday ... 6=Sunday
    prev_consumed: kg consumed in most recent same meal type
    avg_consumed: rolling average consumption for this meal type
    Returns: predicted_kg (float)
    """
    model = _get_model()
    features = np.array([[day_of_week, prev_consumed, avg_consumed]])
    predicted = model.predict(features)[0]
    # Add 10% buffer to reduce under-preparation risk
    return round(max(predicted, 0) * 1.1, 2)

def reload_model():
    """Forces the next predict_demand() call to reload model.pkl from
    disk (call this after retraining within a running server process)."""
    global _model_cache
    _model_cache = None