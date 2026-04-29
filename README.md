# 🌿 Mindful Compass – Tech Wellness Predictor

> **CPE 232 Data Models Project** | Mental Health & Burnout Prediction for Tech Professionals

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38B2AC)

## 📌 Overview

**Mindful Compass** is a data-driven web application that helps tech workers assess their risk of burnout and other mental health challenges. Using three machine learning models trained on the *Mental Health and Burnout in Tech Workers 2026* dataset (Kaggle), the app provides:

- Personalized burnout score (0–10)
- Stress, anxiety, and depression indicators
- Risk classification (Low / Medium / High)
- Actionable recommendations
- Anonymous feedback collection for model improvement

The project combines a **React frontend** with a **FastAPI backend**, featuring smooth animations, a warm, professional UI, and a complete user flow: landing → statistics → terms → assessment → results + feedback.

---

## 🧠 Problem Statement

The tech industry faces high pressure, long hours, and constant learning demands, leading to rising burnout rates. Studies show that chronic stress reduces productivity by up to 41% and increases turnover by 2.3x. Our tool helps individuals and organizations detect early warning signs and take preventive action.

---

## 🎯 Key Features

- **Interactive Landing Page** – calm, animated hero section with statistics preview.
- **Data Insights** – key findings from the 2026 Tech Mental Health Survey.
- **Three ML Models** (backend):
  - Burnout regression (0–10)
  - Multi‑output regression for stress/anxiety/depression
  - Risk classifier (Low/Medium/High)
- **Responsive Assessment Form** – collects work hours, location, sleep, toxic exposure, manager support, etc.
- **Personalised Recommendations** – dynamically generated based on prediction results.
- **Feedback Mechanism** – star rating + comment, stored in Google Sheets or CSV.
- **Smooth Scrolling & Animations** – using Framer Motion and Lenis.
- **Privacy First** – all data anonymised, no personal identification stored.

---

## 🏗️ Tech Stack

### Frontend
- **React 18** + **React Router DOM** – SPA with multi‑page flow
- **Vite** – fast build tool
- **Tailwind CSS** – utility‑first styling with custom “nurture” colour palette
- **Framer Motion** – smooth, performant animations
- **Lenis** – buttery smooth scrolling
- **Axios** – API calls to backend

### Backend
- **FastAPI** – high‑performance Python web framework
- **Joblib** – model serialisation (`.pkl` files)
- **Scikit‑learn** – model training & preprocessing
- **Pydantic** – request/response validation
- **Gspread** (optional) – Google Sheets integration for feedback storage

### Deployment (optional)
- **Render** – backend hosting (free tier)
- **Vercel** – frontend hosting (free tier)

---

## 📂 Project Structure

```
tech-wellness-predictor/
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── feedback_sheet.py      # Google Sheets integration
│   ├── requirements.txt       # Python dependencies
│   ├── models/                # Place your .pkl files here
│   │   └── .gitkeep
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx
│   │   │   ├── Statistics.jsx
│   │   │   ├── Terms.jsx
│   │   │   ├── AssessmentForm.jsx
│   │   │   ├── ResultsDisplay.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   └── FeedbackSection.jsx
│   │   ├── api.js             # Axios calls to backend
│   │   ├── App.jsx            # Routes + Lenis setup
│   │   ├── main.jsx
│   │   └── index.css          # Tailwind + custom styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/your-username/tech-wellness-predictor.git
cd tech-wellness-predictor
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app:app --reload
```
Backend runs at `http://localhost:8000`

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

> 💡 The frontend proxies API requests to the backend via `vite.config.js`. Make sure the backend is running before using the form.

---

## 🤖 Using Real ML Models (Optional)

By default, the backend uses a **realistic simulation** based on academic heuristics. To use your actual trained models:

1. Train your models in Kaggle/notebook and export as `.pkl` files.
2. Place them in `backend/models/`:
   - `model_burnout.pkl`
   - `model_mental.pkl` (or three separate models)
   - `model_risk.pkl`
   - `scaler.pkl` (if used)
   - `encoder.pkl` (if used)
3. In `backend/app.py`, set `USE_REAL_MODELS = True`
4. Implement the `predict_real()` function with your preprocessing pipeline.

---

## 📊 Feedback Storage

The `/feedback` endpoint stores user ratings and comments. Two storage options:

- **CSV (fallback)** – automatically creates `feedback.csv` in the backend folder.
- **Google Sheets** – configure via `feedback_sheet.py` and environment variables.

For Google Sheets:
- Create a service account and share a sheet with its email.
- Add the JSON credentials as `GOOGLE_SHEETS_CREDENTIALS` environment variable.

---

## 🎨 Design Philosophy

- **Warm, earthen palette** (`nurture.cream`, `nurture.sand`, `stone`) – reduces eye strain, feels trustworthy.
- **Subtle animations** – only `transform` and `opacity` for 60fps performance.
- **Card‑based layout** with soft shadows and backdrop blur.
- **Serif headings + clean sans‑serif body** – elegant and readable.
- **Accessible** – sufficient contrast, keyboard navigable.

---

## 📈 Future Improvements

- User accounts to track progress over time
- More granular recommendations (sleep hygiene, meeting reduction, etc.)
- Export report as PDF
- Integration with wearables (sleep, heart rate)
- Admin dashboard to view aggregated feedback

---

## 👥 Team Members

| ID          | Name                     |
|-------------|--------------------------|
| 65070507209 | ฐานุวัชร์ ธนโชคศิริรัตน์ |
| 65070507221 | ภัณฑิรา พ่วงถ้ำ           |
| 67070501047 | หฤษฎ์ ไชยานุกิจ           |
| 67070501052 | กฤตภาส ปัญญาสมพรรค์     |
| 67070501057 | จีราวัฒน์ รัชตะประเมศฐ์   |
| 67070501069 | ภัทรภณ กิจจานุกิจ         |

---

## 📚 Data Source

**Mental Health and Burnout in Tech Workers 2026** – Kaggle  
*Includes attributes: age, job_role, weekly_work_hours, burnout_score, stress_level, anxiety_score, depression_score, work_life_balance, manager_support, toxic_exposure, sleep_hours, etc.*

---

## 📄 License

This project is for educational purposes as part of CPE 232.  
**Disclaimer:** Not a substitute for professional medical advice.

---

## 🙏 Acknowledgements

- Kaggle for the dataset
- FastAPI, React, Tailwind communities
- CPE 232 instructors and teaching assistants

---

## 📬 Contact

For questions or feedback, please open an issue on GitHub or contact the team via your institutional email.

---