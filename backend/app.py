import os
import json
import numpy as np
import pandas as pd
import joblib
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ดึงฟังก์ชันใหม่ที่เราเพิ่งสร้างมาใช้
from feedback_sheet import save_to_google_sheet

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
# Helpers
# ------------------------------------------------------------
def convert_categorical(raw: dict) -> dict:
    for key in raw:
        if isinstance(raw[key], str):
            if raw[key].lower() == 'yes':
                raw[key] = 1
            elif raw[key].lower() == 'no':
                raw[key] = 0
    return raw

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

    raw = convert_categorical(raw)

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
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df

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
# /assess endpoint (อัปเดตใหม่ ให้ส่งข้อมูลเข้า Google Sheets)
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

    if phq9_total <= 4: phq9_sev = "ปกติ / None-minimal"
    elif phq9_total <= 9: phq9_sev = "เล็กน้อย / Mild"
    elif phq9_total <= 14: phq9_sev = "ปานกลาง / Moderate"
    elif phq9_total <= 19: phq9_sev = "ค่อนข้างรุนแรง / Moderately severe"
    else: phq9_sev = "รุนแรง / Severe"

    if gad7_total <= 4: gad7_sev = "ปกติ / None-minimal"
    elif gad7_total <= 9: gad7_sev = "เล็กน้อย / Mild"
    elif gad7_total <= 14: gad7_sev = "ปานกลาง / Moderate"
    else: gad7_sev = "รุนแรง / Severe"

    # --- ML prediction ---
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

    burnout_val, burnout_err = predict_model(burnout_model, raw, "burnout", is_regression=True)
    result["burnout_level"] = burnout_val
    if burnout_err: warnings.append(burnout_err)

    mental_res, mental_err = predict_model(mental_support_model, raw, "mental_support")
    if mental_res:
        result["seeks_mental_health_support_score"], result["seeks_mental_health_support"] = mental_res
    else:
        result["seeks_mental_health_support_score"], result["seeks_mental_health_support"] = None, None
        if mental_err: warnings.append(mental_err)

    change_res, change_err = predict_model(job_change_model, raw, "job_change")
    if change_res:
        result["job_change_intention_score"], result["job_change_intention"] = change_res
    else:
        result["job_change_intention_score"], result["job_change_intention"] = None, None
        if change_err: warnings.append(change_err)

    result["phq9_total"] = phq9_total
    result["phq9_severity"] = phq9_sev
    result["gad7_total"] = gad7_total
    result["gad7_severity"] = gad7_sev
    result["warnings"] = warnings

    # จัดหมวดหมู่ Burnout อย่างง่ายเพื่อลง Sheet
    b_level_str = "Low"
    if burnout_val:
        if burnout_val > 7: b_level_str = "High"
        elif burnout_val > 4: b_level_str = "Moderate"

    # 🚀 --- NEW: บันทึกข้อมูลลง Google Sheets ด้วยฟังก์ชันใหม่ ---
    sheet_data = {
        "name": "ผู้ทำแบบประเมิน", 
        "phq9_total": phq9_total,
        "phq9_severity": phq9_sev,
        "gad17_total": gad7_total,
        "gad17_severity": gad7_sev,
        "burnout_score": burnout_val if burnout_val else 0,
        "burnout_level": b_level_str,
        "seeks_support": True if result.get("seeks_mental_health_support") == 1 else False,
        "job_change": True if result.get("job_change_intention") == 1 else False,
        "phq9_raw": data.phq9_answers,
        "gad17_raw": data.gad7_answers
    }

    try:
        save_to_google_sheet(sheet_data)
    except Exception as e:
        warnings.append(f"Sheet save failed: {str(e)}")

    # เก็บ submission_id เผื่อ Frontend ยังต้องใช้ (ถ้าไม่ใช้ก็ไม่เป็นไร)
    result["submission_id"] = str(uuid.uuid4())

    return result

# -------------------------------------------------------------------
# Endpoints สำหรับ Feedback (ปิดการทำงานส่วน Google Sheet เดิมไว้เพื่อไม่ให้พัง)
# -------------------------------------------------------------------
class FeedbackSubmit(BaseModel):
    submission_id: str
    rating: float
    comment: str = ""

@app.post("/submit-feedback")
def submit_feedback_endpoint(data: FeedbackSubmit):
    # ปัจจุบันเราเก็บ 1 คนต่อ 1 แถวแล้ว จึงไม่ต้องวิ่งกลับไปอัปเดตบรรทัดเดิม 
    # คืนค่า Success ไปเลย Frontend จะได้ขึ้นข้อความขอบคุณปกติ
    return {"status": "success", "message": "Thank you!"}

@app.post("/feedback")
def feedback(data: dict):   
    return {"status": "success", "message": "Thank you for your feedback!"}

@app.get("/")
def root():
    return {"status": "Tech Wellness Predictor API active", "models": model_status}

# -------------------------------------------------------------------
# Endpoints สำหรับ Feedback 
# -------------------------------------------------------------------
class FeedbackSubmit(BaseModel):
    submission_id: str
    rating: float
    comment: str = ""

@app.post("/submit-feedback")
def submit_feedback_endpoint(data: FeedbackSubmit):
    from feedback_sheet import update_feedback_in_sheet
    # สั่งให้วิ่งไปอัปเดตชีท
    update_feedback_in_sheet(data.rating, data.comment)
    return {"status": "success", "message": "Thank you!"}

@app.post("/feedback")
def feedback(data: dict):   
    from feedback_sheet import update_feedback_in_sheet
    # ดักไว้เผื่อหน้าเว็บ React ยิงข้อมูลมาที่เส้นทางนี้แทน
    rating = data.get("rating", 0)
    comment = data.get("comment", "")
    # สั่งให้วิ่งไปอัปเดตชีท
    update_feedback_in_sheet(rating, comment)
    return {"status": "success", "message": "Thank you for your feedback!"}
