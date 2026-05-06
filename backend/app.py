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
import uuid
from datetime import datetime

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
    answers: List[int]


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
# Map categorical strings to numeric
# ------------------------------------------------------------
def convert_categorical(raw: dict) -> dict:
    """Replace Yes/No with 1/0 and ensure all values are numeric where needed."""
    for key in raw:
        if isinstance(raw[key], str):
            if raw[key].lower() == 'yes':
                raw[key] = 1
            elif raw[key].lower() == 'no':
                raw[key] = 0
    return raw


# ------------------------------------------------------------
# Feature builder – supports both UserInput and dict
# ------------------------------------------------------------
def build_features(data, model):
    if isinstance(data, UserInput):
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
            'manager_support_score': data.manager_support,
        }
    else:
        raw = dict(data)

    # Ensure all strings are numeric where needed
    raw = convert_categorical(raw)

    # Fill missing common fields
    defaults = {
        'work_hours_per_week': 40,
        'meetings_per_day': 2,
        'sleep_hours_per_night': 7,
        'toxic_workplace_exposure': 5,
        'manager_support': 5,
        'manager_support_score': 5,
    }
    for k, v in defaults.items():
        if k not in raw or raw[k] is None:
            raw[k] = v

    # Get expected feature names
    expected = None
    if hasattr(model, 'feature_names_in_'):
        expected = model.feature_names_in_.tolist()
    elif hasattr(model, 'feature_names_'):
        expected = list(model.feature_names_)
    elif hasattr(model, 'get_feature_names'):
        expected = model.get_feature_names()

    if expected:
        feats = {}
        for col in expected:
            if col in raw:
                feats[col] = raw[col]
            elif col.startswith('work_location_'):
                loc = raw.get('work_location', 'Remote')
                feats[col] = 1 if col == f'work_location_{loc}' else 0
            elif col.startswith('job_role_'):
                role = raw.get('job_role', 'Software Engineer')
                feats[col] = 1 if col == f'job_role_{role}' else 0
            else:
                feats[col] = 0
        df = pd.DataFrame([feats])[expected]
        # Convert any remaining objects to numeric
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df

    # Fallback 9-column
    loc_map = {"Remote": 0, "Hybrid": 1, "On-site": 2}
    role_list = ["Software Engineer", "Data Scientist", "Product Manager",
                 "DevOps Engineer", "QA Engineer", "Tech Lead", "UX Designer", "Other"]
    role_idx = role_list.index(raw.get('job_role', 'Software Engineer')) if raw.get('job_role', 'Software Engineer') in role_list else 7
    fallback = np.array([
        raw.get('work_hours_per_week', 40),
        raw.get('sleep_hours_per_night', 7),
        raw.get('toxic_workplace_exposure', 5),
        raw.get('meetings_per_day', 2) * 5,
        raw.get('manager_support', 5),
        raw.get('years_experience', 0),
        raw.get('age', 30),
        loc_map.get(raw.get('work_location', 'Remote'), 1),
        role_idx,
    ])
    return pd.DataFrame(fallback)


# ------------------------------------------------------------
# Single prediction helper
# ------------------------------------------------------------
def predict_model(model, raw_data, model_name, is_regression=False):
    if model is None:
        return None, f"{model_name} model not found"
    if not hasattr(model, 'predict'):
        return None, f"{model_name} is not a valid model object"
    try:
        features = build_features(raw_data, model)
        if hasattr(model, 'predict_proba') and not is_regression:
            proba = model.predict_proba(features)[0]
            score = float(proba[1]) if len(proba) > 1 else float(proba[0])
            label = 1 if score >= 0.5 else 0
            return (round(score, 2), label), None
        else:
            val = float(model.predict(features)[0])
            if is_regression:
                val = min(10, max(0, round(val, 1)))
                return val, None
            label = 1 if val >= 0.5 else 0
            return (val, label), None
    except Exception as e:
        return None, f"{model_name} prediction error: {str(e)}"


# ------------------------------------------------------------
# /assess endpoint – robust with categorical conversion
# ------------------------------------------------------------
@app.post("/assess")
def assess_endpoint(data: AssessRequest):
    if len(data.phq9_answers) != 9:
        raise HTTPException(status_code=400, detail="Exactly 9 PHQ-9 answers required.")
    if len(data.gad7_answers) != 7:
        raise HTTPException(status_code=400, detail="Exactly 7 GAD-7 answers required.")

    # --- Scoring ---
    phq9_total = sum(data.phq9_answers)
    gad7_total = sum(data.gad7_answers)

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

    if gad7_total <= 4:
        gad7_sev = "ปกติ / None-minimal"
    elif gad7_total <= 9:
        gad7_sev = "เล็กน้อย / Mild"
    elif gad7_total <= 14:
        gad7_sev = "ปานกลาง / Moderate"
    else:
        gad7_sev = "รุนแรง / Severe"

    # --- ML prediction (using your existing logic, shortened) ---
    raw = {
        "phq9_score": phq9_total,
        "gad7_score": gad7_total,
        "stress_score": data.stress_score or 0,
        "poor_balance_high_stress": data.poor_balance_high_stress or 0,
        "job_satisfaction_score": data.job_satisfaction_score or 0,
        "manager_support_score": data.manager_support_score or 0,
        "autonomy_score": data.autonomy_score or 0,
        "meetings_per_day": data.meetings_per_day or 0,
        "work_hours_per_week": data.work_hours_per_week or 40,
        "deadline_pressure_score": data.deadline_pressure_score or 0,
        "work_life_balance_score": data.work_life_balance_score or 0,
        "sleep_hours_per_night": data.sleep_hours_per_night or 7,
        "exercise_days_per_week": data.exercise_days_per_week or 0,
        "vacation_days_taken": data.vacation_days_taken or 0,
        "social_support_score": data.social_support_score or 0,
        "therapy_access": 1 if data.therapy_access == "Yes" else 0,
        "salary_usd": data.salary_usd or 0,
        "toxic_workplace_exposure": data.poor_balance_high_stress or 5,
        "manager_support": data.manager_support_score or 5,
        "work_location": "Remote",
        "job_role": "Software Engineer",
        "years_experience": 0,
        "age": 30,
    }

    warnings = []
    result = {}

    # Burnout (regression)
    burnout_val, burnout_err = predict_model(burnout_model, raw, "burnout", is_regression=True)
    result["burnout_level"] = burnout_val
    if burnout_err:
        warnings.append(burnout_err)

    # Mental health support
    mental_res, mental_err = predict_model(mental_support_model, raw, "mental_support")
    if mental_res:
        score, label = mental_res
        result["seeks_mental_health_support_score"] = score
        result["seeks_mental_health_support"] = label
    else:
        result["seeks_mental_health_support_score"] = None
        result["seeks_mental_health_support"] = None
        if mental_err:
            warnings.append(mental_err)

    # Job change
    change_res, change_err = predict_model(job_change_model, raw, "job_change")
    if change_res:
        score, label = change_res
        result["job_change_intention_score"] = score
        result["job_change_intention"] = label
    else:
        result["job_change_intention_score"] = None
        result["job_change_intention"] = None
        if change_err:
            warnings.append(change_err)

    result["phq9_total"] = phq9_total
    result["phq9_severity"] = phq9_sev
    result["gad7_total"] = gad7_total
    result["gad7_severity"] = gad7_sev
    result["warnings"] = warnings

    # --- NEW: Save answers immediately ---
    submission_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()

    # Build an answer row for each individual question
    answers = []

    # PHQ-9 (9 questions)
    phq9_texts = [
        "เบื่อ ไม่สนใจอะไรเลย / Little interest or pleasure in doing things",
        "รู้สึกหดหู่ เศร้า หรือสิ้นหวัง / Feeling down, depressed, or hopeless",
        "มีปัญหาในการนอนหลับ / Trouble falling/staying asleep",
        "รู้สึกเหนื่อยล้า / Feeling tired or having little energy",
        "เบื่ออาหารหรือกินมากเกินไป / Poor appetite or overeating",
        "รู้สึกไม่ดีกับตัวเอง / Feeling bad about yourself",
        "ขาดสมาธิ / Trouble concentrating",
        "เคลื่อนไหวช้าลงหรือกระสับกระส่าย / Moving or speaking slowly",
        "คิดทำร้ายตัวเอง / Thoughts of self-harm",
    ]
    for i, ans in enumerate(data.phq9_answers):
        answers.append({"question": f"PHQ-9 Q{i+1}: {phq9_texts[i]}", "answer": ans, "timestamp": timestamp})

    # GAD-7 (7 questions)
    gad7_texts = [
        "รู้สึกตึงเครียด วิตกกังวล / Feeling nervous, anxious",
        "ไม่สามารถหยุดความกังวล / Cannot stop worrying",
        "กังวลมากเกินไป / Worrying too much",
        "ทำตัวให้ผ่อนคลายได้ยาก / Trouble relaxing",
        "กระสับกระส่าย / Restless",
        "หงุดหงิดง่าย / Easily annoyed",
        "รู้สึกกลัว / Feeling afraid",
    ]
    for i, ans in enumerate(data.gad7_answers):
        answers.append({"question": f"GAD-7 Q{i+1}: {gad7_texts[i]}", "answer": ans, "timestamp": timestamp})

    # Part 3 fields (each becomes its own row)
    part3_fields = [
        ("stress_score", "คะแนนความเครียด / Stress score"),
        ("poor_balance_high_stress", "ภาระงาน/เครียดสูง / Poor balance / high stress"),
        ("job_satisfaction_score", "ความพึงพอใจในงาน / Job satisfaction"),
        ("manager_support_score", "การสนับสนุนจากหัวหน้า / Manager support"),
        ("autonomy_score", "ความเป็นอิสระในงาน / Autonomy"),
        ("meetings_per_day", "ประชุมต่อวัน / Meetings per day"),
        ("work_hours_per_week", "ชั่วโมงทำงาน/สัปดาห์ / Work hours/week"),
        ("deadline_pressure_score", "แรงกดดันจากเส้นตาย / Deadline pressure"),
        ("work_life_balance_score", "สมดุลชีวิต-งาน / Work-life balance"),
        ("sleep_hours_per_night", "ชั่วโมงนอน/คืน / Sleep hours/night"),
        ("exercise_days_per_week", "วันออกกำลังกาย/สัปดาห์ / Exercise days/week"),
        ("vacation_days_taken", "วันลาพักร้อนที่ใช้ / Vacation days taken"),
        ("social_support_score", "การสนับสนุนทางสังคม / Social support"),
        ("therapy_access", "เข้าถึงการบำบัด / Therapy access"),
        ("salary_usd", "เงินเดือน USD / Salary USD"),
    ]
    for field, label in part3_fields:
        val = getattr(data, field, "")
        if val is None:
            val = ""
        answers.append({"question": label, "answer": val, "timestamp": timestamp})

    # Save to Google Sheets (or CSV fallback)
    try:
        from feedback_sheet import save_answers
        save_answers(submission_id, answers)
    except Exception as e:
        warnings.append(f"Answer save failed: {str(e)}")

    # Attach submission_id to the result so the frontend can use it later
    result["submission_id"] = submission_id

    return result


# -------------------------------------------------------------------
# New endpoint: submit feedback (updates existing rows)
# -------------------------------------------------------------------
from pydantic import BaseModel as PydanticBaseModel

class FeedbackSubmit(BaseModel):
    submission_id: str
    rating: float
    comment: str = ""

@app.post("/submit-feedback")
def submit_feedback_endpoint(data: FeedbackSubmit):
    from feedback_sheet import update_feedback
    success = update_feedback(data.submission_id, data.rating, data.comment)
    if not success:
        raise HTTPException(status_code=500, detail="Could not update feedback – maybe the submission_id was not found or Google Sheets is unreachable.")
    return {"status": "success", "message": "Thank you!"}


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
    return {
        "phq9_total": total,
        "phq9_severity": severity,
        "burnout_level": None,
        "seeks_mental_health_support_score": None,
        "seeks_mental_health_support": None,
        "job_change_intention_score": None,
        "job_change_intention": None,
        "warnings": ["phq9 endpoint used – no ML prediction"],
    }


@app.get("/")
def root():
    return {"status": "Tech Wellness Predictor API active", "models": model_status}


@app.post("/feedback")
def feedback(data: dict):   # accept any flat JSON body
    try:
        # Build a row with all expected columns (empty string if missing)
        row = {}
        row["timestamp"] = datetime.now().isoformat()
        row["rating"] = data.get("rating", "")
        row["comment"] = data.get("comment", "")

        # Flatten all remaining fields directly from the request
        for key, value in data.items():
            if key not in ("rating", "comment"):
                row[key] = value

        save_feedback(row)
        return {"status": "success", "message": "Thank you!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))