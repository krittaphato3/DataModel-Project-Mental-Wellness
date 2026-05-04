import os
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from feedback_sheet import save_feedback

MODEL_DIR = "models"


# ------------------------------------------------------------
# Model Loading (with dict extraction)
# ------------------------------------------------------------
def load_real_model(filename):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        print(f"[models] File not found: {path}")
        return None
    obj = joblib.load(path)
    if isinstance(obj, dict):
        print(f"[models] Loaded dict from {filename}, searching inside...")
        for key in ['model', 'classifier', 'pipeline', 'estimator']:
            if key in obj:
                print(f"[models] Using '{key}' from dict")
                return obj[key]
        print("[models] No known key found, using raw dict")
    return obj


burnout_model = load_real_model("burnout_model.pkl")
mental_support_model = load_real_model("seeks_mental_health_support.pkl")
job_change_model = load_real_model("job_changed_intention.pkl")

model_status = {
    "burnout": burnout_model is not None and hasattr(burnout_model, 'predict'),
    "seeks_mental_health_support": mental_support_model is not None and hasattr(mental_support_model, 'predict'),
    "job_change_intention": job_change_model is not None and hasattr(job_change_model, 'predict'),
}
print(f"[models] Status: {model_status}")


# ------------------------------------------------------------
# Pydantic schemas
# ------------------------------------------------------------
class UserInput(BaseModel):
    weekly_work_hours: float = Field(..., ge=0, le=120)
    work_location: str
    sleep_hours: float = Field(..., ge=0, le=24)
    toxic_workplace_exposure: float = Field(..., ge=0, le=10)
    meeting_hours_per_week: float = Field(..., ge=0, le=80)
    manager_support: float = Field(..., ge=0, le=10)
    years_of_experience: float = Field(..., ge=0, le=50)
    age: int = Field(..., ge=18, le=100)
    job_role: str


class FeedbackRequest(BaseModel):
    rating: float
    comment: str
    predicted_values: Dict[str, Any]
    user_input: Optional[Dict[str, Any]] = None


class PHQ9Request(BaseModel):
    answers: List[int]  # 9 ints


class AssessRequest(BaseModel):
    phq9_answers: List[int]  # 9 ints
    gad7_answers: List[int]  # 7 ints


# ------------------------------------------------------------
# FastAPI app
# ------------------------------------------------------------
app = FastAPI(title="Tech Wellness Predictor API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------
# Feature builder (for ML models)
# ------------------------------------------------------------
def build_features(data: UserInput, model) -> pd.DataFrame:
    raw = {
        'age': data.age,
        'years_experience': data.years_of_experience,
        'work_hours_per_week': data.weekly_work_hours,
        'meetings_per_day': data.meeting_hours_per_week / 5,
        'sleep_hours_per_night': data.sleep_hours,
        'work_location': data.work_location,
        'job_role': data.job_role,
        'toxic_workplace_exposure': data.toxic_workplace_exposure,
        'manager_support': data.manager_support,
    }
    # Try to get expected feature names
    expected = None
    if hasattr(model, 'feature_names_in_'):
        expected = model.feature_names_in_.tolist()
    elif hasattr(model, 'feature_names_'):
        expected = list(model.feature_names_)
    elif hasattr(model, 'get_feature_names'):
        expected = model.get_feature_names()

    if expected:
        print(f"[build_features] Model expects {len(expected)} columns: {expected[:10]}")
        row = {}
        for col in expected:
            if col in raw:
                row[col] = raw[col]
            elif col.startswith('work_location_'):
                loc = raw.get('work_location', 'Remote')
                row[col] = 1 if col == f'work_location_{loc}' else 0
            elif col.startswith('job_role_'):
                role = raw.get('job_role', 'Software Engineer')
                row[col] = 1 if col == f'job_role_{role}' else 0
            else:
                row[col] = 0
        return pd.DataFrame([row])[expected]

    # Fallback 9-column
    print("[build_features] No feature names found – using fallback 9-column array")
    loc_map = {"Remote": 0, "Hybrid": 1, "On-site": 2}
    role_list = ["Software Engineer", "Data Scientist", "Product Manager",
                 "DevOps Engineer", "QA Engineer", "Tech Lead", "UX Designer", "Other"]
    role_idx = role_list.index(data.job_role) if data.job_role in role_list else 7
    fallback = np.array([
        data.weekly_work_hours,
        data.sleep_hours,
        data.toxic_workplace_exposure,
        data.meeting_hours_per_week,
        data.manager_support,
        data.years_of_experience,
        data.age,
        loc_map.get(data.work_location, 1),
        role_idx,
    ])
    return pd.DataFrame(fallback)


# ------------------------------------------------------------
# Per-model prediction
# ------------------------------------------------------------
def predict_with_model(model, data: UserInput, model_name: str):
    if model is None:
        return None, None, f"{model_name} model not found"
    if not hasattr(model, 'predict'):
        return None, None, f"{model_name} is not a valid model"
    try:
        features = build_features(data, model)
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(features)[0]
            score = float(proba[1]) if len(proba) > 1 else float(proba[0])
            label = 1 if score >= 0.5 else 0
            return round(score, 2), label, None
        else:
            val = float(model.predict(features)[0])
            if model_name == "burnout":
                val = min(10, max(0, round(val, 1)))
                return val, None, None
            label = 1 if val >= 0.5 else 0
            return val, label, None
    except Exception as e:
        return None, None, f"{model_name} prediction error: {str(e)}"


# ------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "Tech Wellness Predictor API active", "models": model_status}


@app.post("/predict")
def predict(data: UserInput):
    warnings = []
    result = {}

    # Burnout
    if burnout_model:
        val, _, err = predict_with_model(burnout_model, data, "burnout")
        result["burnout_level"] = val
    else:
        result["burnout_level"] = None
        warnings.append("burnout_model.pkl not found")
    if 'err' in locals() and err:
        warnings.append(err)

    # Seeks support
    if mental_support_model:
        score, label, err = predict_with_model(mental_support_model, data, "mental_support")
        result["seeks_mental_health_support_score"] = score
        result["seeks_mental_health_support"] = label
    else:
        result["seeks_mental_health_support_score"] = None
        result["seeks_mental_health_support"] = None
        warnings.append("seeks_mental_health_support.pkl not found")
    if 'err' in locals() and err:
        warnings.append(err)

    # Job change intention
    if job_change_model:
        score, label, err = predict_with_model(job_change_model, data, "job_change")
        result["job_change_intention_score"] = score
        result["job_change_intention"] = label
    else:
        result["job_change_intention_score"] = None
        result["job_change_intention"] = None
        warnings.append("job_changed_intention.pkl not found")
    if 'err' in locals() and err:
        warnings.append(err)

    print(f"[predict] Input: {data.dict()}")
    print(f"[predict] Result: {result}")
    if warnings:
        print(f"[predict] Warnings: {warnings}")
    result["warnings"] = warnings
    return result


@app.post("/phq9")
def phq9_endpoint(data: PHQ9Request):
    if len(data.answers) != 9:
        raise HTTPException(status_code=400, detail="Exactly 9 answers required.")
    total = sum(data.answers)
    if total <= 4:
        severity = "ปกติ / None-minimal"
    elif total <= 9:
        severity = "เล็กน้อย / Mild"
    elif total <= 14:
        severity = "ปานกลาง / Moderate"
    elif total <= 19:
        severity = "ค่อนข้างรุนแรง / Moderately severe"
    else:
        severity = "รุนแรง / Severe"
    result = {
        "phq9_total": total,
        "phq9_severity": severity,
        "burnout_level": None,
        "seeks_mental_health_support_score": None,
        "seeks_mental_health_support": None,
        "job_change_intention_score": None,
        "job_change_intention": None,
        "warnings": [],
    }
    print(f"[phq9] Total={total}, Severity={severity}")
    return result


@app.post("/assess")
def assess_endpoint(data: AssessRequest):
    if len(data.phq9_answers) != 9:
        raise HTTPException(status_code=400, detail="Exactly 9 PHQ-9 answers required.")
    if len(data.gad7_answers) != 7:
        raise HTTPException(status_code=400, detail="Exactly 7 GAD-7 answers required.")

    phq9_total = sum(data.phq9_answers)
    gad7_total = sum(data.gad7_answers)

    # PHQ-9 severity
    if phq9_total <= 4:
        phq9_sev = "ปกติ / None-minimal"
    elif phq9_total <= 9:
        phq9_sev = "เล็กน้อย / Mild"
    elif phq9_total <= 14:
        phq9_sev = "ปานกลาง / Moderate"
    elif phq9_total <= 19:
        phq9_sev = "ค่อนข้างรุนแรง / Moderately severe"
    else:
        phq9_sev = "รุนแรง / Severe"

    # GAD-7 severity
    if gad7_total <= 4:
        gad7_sev = "ปกติ / None-minimal"
    elif gad7_total <= 9:
        gad7_sev = "เล็กน้อย / Mild"
    elif gad7_total <= 14:
        gad7_sev = "ปานกลาง / Moderate"
    else:
        gad7_sev = "รุนแรง / Severe"

    result = {
        "phq9_total": phq9_total,
        "phq9_severity": phq9_sev,
        "gad7_total": gad7_total,
        "gad7_severity": gad7_sev,
        "burnout_level": None,
        "seeks_mental_health_support_score": None,
        "seeks_mental_health_support": None,
        "job_change_intention_score": None,
        "job_change_intention": None,
        "warnings": [],
    }
    print(f"[assess] PHQ-9={phq9_total} ({phq9_sev}), GAD-7={gad7_total} ({gad7_sev})")
    return result


@app.post("/feedback")
def feedback(data: FeedbackRequest):
    try:
        record = {
            "timestamp": datetime.now().isoformat(),
            "rating": data.rating,
            "comment": data.comment,
            "predicted_values": json.dumps(data.predicted_values),
            "user_input": json.dumps(data.user_input) if data.user_input else "",
        }
        save_feedback(record)
        return {"status": "success", "message": "Thank you!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
