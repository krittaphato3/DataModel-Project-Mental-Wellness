# ============================================================
# Imports
# ============================================================
import os
import uuid
import joblib
import numpy as np
import pandas as pd

from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from feedback_sheet import save_to_google_sheet, update_feedback_in_sheet

MODEL_DIR = "models"


# ============================================================
# Model Loading
# ============================================================
def load_real_model(filename):
    path = os.path.join(MODEL_DIR, filename)

    if not os.path.exists(path):
        print(f"[models] File not found: {path}")
        return None

    obj = joblib.load(path)

    if isinstance(obj, dict):
        print(f"[models] Loaded dict from {filename}")
        for key in ['model', 'classifier', 'pipeline', 'estimator']:
            if key in obj:
                print(f"[models] Using '{key}'")
                return obj[key]
        return obj

    return obj


burnout_model = load_real_model("burnout_model.pkl")
mental_support_model = load_real_model("seeks_mental_health_support.pkl")
job_change_model = load_real_model("job_changed_intention.pkl")

model_status = {
    "burnout": burnout_model is not None and hasattr(burnout_model, 'predict'),
    "mental_support": mental_support_model is not None and hasattr(mental_support_model, 'predict'),
    "job_change": job_change_model is not None and hasattr(job_change_model, 'predict'),
}

print(f"[models] Status: {model_status}")


# ============================================================
# Schemas
# ============================================================
class AssessRequest(BaseModel):
    phq9_answers: List[int]
    gad7_answers: List[int]

    stress_score: Optional[float] = None
    poor_balance_high_stress: Optional[float] = None
    job_satisfaction_score: Optional[float] = None
    manager_support_score: Optional[float] = None
    autonomy_score: Optional[float] = None
    meetings_per_day: Optional[float] = None
    work_hours_per_week: Optional[float] = None
    deadline_pressure_score: Optional[float] = None
    work_life_balance_score: Optional[float] = None
    sleep_hours_per_night: Optional[float] = None
    exercise_days_per_week: Optional[float] = None
    vacation_days_taken: Optional[float] = None
    social_support_score: Optional[float] = None
    therapy_access: Optional[str] = None
    salary_usd: Optional[float] = None


class FeedbackSubmit(BaseModel):
    submission_id: str
    rating: float
    comment: str = ""


# ============================================================
# FastAPI App
# ============================================================
app = FastAPI(title="Tech Wellness Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Helper Functions
# ============================================================
def convert_categorical(raw: dict):
    for k, v in raw.items():
        if isinstance(v, str):
            if v.lower() == "yes":
                raw[k] = 1
            elif v.lower() == "no":
                raw[k] = 0
    return raw


def build_features(raw, model):
    raw = convert_categorical(raw)

    defaults = {
        "work_hours_per_week": 40,
        "sleep_hours_per_night": 7,
        "toxic_workplace_exposure": 5,
        "manager_support": 5,
    }

    for k, v in defaults.items():
        raw.setdefault(k, v)

    if hasattr(model, "feature_names_in_"):
        cols = model.feature_names_in_.tolist()
    else:
        return pd.DataFrame([raw])

    df = pd.DataFrame([{c: raw.get(c, 0) for c in cols}])
    return df


def predict_model(model, raw, is_regression=False):
    if model is None:
        return None, "Model not loaded"

    try:
        X = build_features(raw, model)

        if hasattr(model, "predict_proba") and not is_regression:
            proba = model.predict_proba(X)[0][1]
            return (round(proba, 2), int(proba >= 0.5)), None

        val = float(model.predict(X)[0])

        if is_regression:
            return min(10, max(0, round(val, 1))), None

        return (val, int(val >= 0.5)), None

    except Exception as e:
        return None, str(e)


# ============================================================
# Main Endpoint
# ============================================================
@app.post("/assess")
def assess(data: AssessRequest):

    if len(data.phq9_answers) != 9:
        raise HTTPException(400, "PHQ-9 must be 9 answers")

    if len(data.gad7_answers) != 7:
        raise HTTPException(400, "GAD-7 must be 7 answers")

    phq9_total = sum(data.phq9_answers)
    gad7_total = sum(data.gad7_answers)

    raw = {
        "phq9_score": phq9_total,
        "gad7_score": gad7_total,
        "stress_score": data.stress_score or 0,
        "work_hours_per_week": data.work_hours_per_week or 40,
        "sleep_hours_per_night": data.sleep_hours_per_night or 7,
        "manager_support": data.manager_support_score or 5,
        "toxic_workplace_exposure": data.poor_balance_high_stress or 5,
    }

    result = {}
    warnings = []

    burnout, err = predict_model(burnout_model, raw, True)
    if err: warnings.append(err)

    mental, err = predict_model(mental_support_model, raw)
    if err: warnings.append(err)

    job, err = predict_model(job_change_model, raw)
    if err: warnings.append(err)

    result.update({
        "phq9_total": phq9_total,
        "gad7_total": gad7_total,
        "burnout": burnout,
        "mental_support": mental,
        "job_change": job,
        "warnings": warnings,
        "submission_id": str(uuid.uuid4())
    })

    # Save to Google Sheet
    try:
        save_to_google_sheet({
            "phq9": phq9_total,
            "gad7": gad7_total,
            "burnout": burnout
        })
    except Exception as e:
        warnings.append(str(e))

    return result


# ============================================================
# Feedback Endpoints
# ============================================================
@app.post("/submit-feedback")
def submit_feedback(data: FeedbackSubmit):
    update_feedback_in_sheet(data.rating, data.comment)
    return {"status": "success"}


@app.post("/feedback")
def feedback(data: dict):
    update_feedback_in_sheet(
        data.get("rating", 0),
        data.get("comment", "")
    )
    return {"status": "success"}


# ============================================================
# Root
# ============================================================
@app.get("/")
def root():
    return {
        "status": "API running",
        "models": model_status
    }
