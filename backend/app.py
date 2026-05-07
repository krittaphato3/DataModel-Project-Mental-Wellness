import os
import numpy as np
import pandas as pd
import joblib
import uuid
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from feedback_sheet import save_to_google_sheet, update_feedback_in_sheet

MODEL_DIR = "models"

# ------------------------------------------------------------
# Load Model
# ------------------------------------------------------------
def load_real_model(filename):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        print(f"[models] Missing: {path}")
        return None

    obj = joblib.load(path)

    if isinstance(obj, dict):
        for key in ["model", "classifier", "pipeline", "estimator"]:
            if key in obj:
                return obj[key]
        return obj

    return obj


burnout_model = load_real_model("burnout_model.pkl")
mental_model = load_real_model("seeks_mental_health_support.pkl")
job_model = load_real_model("job_changed_intention.pkl")

model_status = {
    "burnout": hasattr(burnout_model, "predict"),
    "mental_support": hasattr(mental_model, "predict"),
    "job_change": hasattr(job_model, "predict"),
}

print("[models]", model_status)

# ------------------------------------------------------------
# App
# ------------------------------------------------------------
app = FastAPI(title="Tech Wellness API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# Schemas
# ------------------------------------------------------------
class AssessRequest(BaseModel):
    phq9_answers: List[int]
    gad7_answers: List[int]

    stress_score: Optional[float] = 0
    poor_balance_high_stress: Optional[float] = 0
    job_satisfaction_score: Optional[float] = 0
    manager_support_score: Optional[float] = 0
    autonomy_score: Optional[float] = 0
    meetings_per_day: Optional[float] = 0
    work_hours_per_week: Optional[float] = 40
    deadline_pressure_score: Optional[float] = 0
    work_life_balance_score: Optional[float] = 0
    sleep_hours_per_night: Optional[float] = 7
    exercise_days_per_week: Optional[float] = 0
    vacation_days_taken: Optional[float] = 0
    social_support_score: Optional[float] = 0
    therapy_access: Optional[str] = "No"
    salary_usd: Optional[float] = 0


class FeedbackRequest(BaseModel):
    submission_id: str
    rating: float
    comment: str = ""

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def predict(model, X, regression=False):
    if model is None or not hasattr(model, "predict"):
        return None

    try:
        val = model.predict(pd.DataFrame([X]))[0]

        if regression:
            return float(max(0, min(10, round(val, 2))))

        return int(val)
    except:
        return None


# ------------------------------------------------------------
# MAIN ENDPOINT
# ------------------------------------------------------------
@app.post("/assess")
def assess(data: AssessRequest):

    phq9 = sum(data.phq9_answers)
    gad7 = sum(data.gad7_answers)

    raw = {
        "phq9": phq9,
        "gad7": gad7,
        "stress": data.stress_score,
        "balance": data.work_life_balance_score,
        "sleep": data.sleep_hours_per_night,
        "support": data.manager_support_score,
        "hours": data.work_hours_per_week,
    }

    burnout = predict(burnout_model, raw, regression=True)
    mental = predict(mental_model, raw)
    job = predict(job_model, raw)

    result = {
        "phq9": phq9,
        "gad7": gad7,
        "burnout_score": burnout,
        "mental_support": mental,
        "job_change": job,
        "submission_id": str(uuid.uuid4())
    }

    # save to sheet
    try:
        save_to_google_sheet(result)
    except Exception as e:
        result["sheet_error"] = str(e)

    return result


# ------------------------------------------------------------
# FEEDBACK
# ------------------------------------------------------------
@app.post("/feedback")
def feedback(data: FeedbackRequest):
    try:
        update_feedback_in_sheet(data.rating, data.comment)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ------------------------------------------------------------
# ROOT
# ------------------------------------------------------------
@app.get("/")
def root():
    return {
        "status": "ok",
        "models": model_status
    }
