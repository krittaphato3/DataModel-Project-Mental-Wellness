# 🌿 Working with Healthy Mind

> **CPE 232 Data Models Project** | Mental Health & Burnout Prediction for Tech Professionals

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38B2AC?logo=tailwind-css&logoColor=white)

## 📌 Overview

**Mindful Compass** is a data-driven web application designed to help tech professionals assess their risk of burnout and other mental health challenges. Powered by machine learning models trained on the *Mental Health and Burnout in Tech Workers 2026* dataset, the platform delivers personalized insights and actionable recommendations.

**Core Offerings:**
- Personalized burnout score (0–10)
- Risk classification (Low / Medium / High)
- Stress, anxiety, and depression indicators (PHQ-9 & GAD-7 integrations)
- Actionable, data-backed recommendations
- Anonymous feedback collection for continuous model improvement

---

## 🧠 Problem Statement

The tech industry is characterized by high-pressure environments, long hours, and rapid technological shifts, leading to surging burnout rates. Studies indicate that chronic stress can reduce productivity by up to 41% and increase employee turnover by 2.3x. 

Mindful Compass serves as an early-warning detection tool, empowering both individuals and organizations to take proactive, preventive action before burnout peaks.

---

## 🎯 Key Features

- **Interactive UI** – A calm, animated landing page featuring smooth scrolling (Lenis) and transitions (Framer Motion).
- **Data Insights Dashboard** – Visualizes key findings from the 2026 Tech Mental Health Survey.
- **Advanced ML Backend**:
  - Burnout regression modeling (0–10 scale)
  - Job change intention prediction
  - Mental health support-seeking classification
- **Comprehensive Assessment** – Collects and analyzes variables including work hours, toxic exposure, manager support, and clinical baselines.
- **Privacy First** – All data is strictly anonymized, ensuring no personal identification is stored.

---

## 🏗️ Tech Stack

### Frontend (Client)
- **React 18 & Vite** – Fast, component-driven SPA architecture
- **Tailwind CSS** – Utility-first styling with a custom "nurture" color palette
- **Framer Motion & Lenis** – High-performance animations and buttery smooth scrolling
- **Axios** – Promise-based HTTP client for API communication

### Backend (Server & ML)
- **FastAPI** – High-performance, asynchronous Python web framework
- **Scikit-Learn & Joblib** – Model training, preprocessing, and `.pkl` serialization
- **Pydantic** – Strict request/response data validation
- **Gspread** – Google Sheets integration for robust feedback storage

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
