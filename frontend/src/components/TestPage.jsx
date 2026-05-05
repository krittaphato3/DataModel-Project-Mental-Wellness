import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TEST_PHQ9 = [2, 1, 3, 2, 1, 0, 2, 1, 0];              // 9 integers (0‑3)
const TEST_GAD7 = [2, 3, 1, 2, 0, 1, 2];                    // 7 integers (0‑3)

const TEST_ADDITIONAL = {
  stress_score: 6.5,
  poor_balance_high_stress: 7,
  job_satisfaction_score: 4,
  manager_support_score: 5,
  autonomy_score: 6,
  meetings_per_day: 3,
  work_hours_per_week: 48,
  deadline_pressure_score: 7,
  work_life_balance_score: 3.5,
  sleep_hours_per_night: 6.5,
  exercise_days_per_week: 2,
  vacation_days_taken: 5,
  social_support_score: 6,
  therapy_access: 'No',
  salary_usd: 85000,
};

export default function TestPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Contacting backend...');

  useEffect(() => {
    let cancelled = false;

    async function runTest() {
      try {
        const payload = {
          phq9_answers: TEST_PHQ9,
          gad7_answers: TEST_GAD7,
          ...TEST_ADDITIONAL,
        };

        const response = await axios.post(`${API_BASE}/assess`, payload);
        const prediction = response.data;

        if (cancelled) return;
        setStatus('Success! Navigating to results.');
        setTimeout(() => {
          navigate('/results', {
            state: {
              prediction,
              formData: payload,
            },
          });
        }, 500);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        let msg = 'Unknown error';
        if (err.response?.data?.detail) {
          const d = err.response.data.detail;
          msg = typeof d === 'string' ? d : JSON.stringify(d);
        } else if (err.message) {
          msg = err.message;
        }
        setStatus(`Error: ${msg}`);
      }
    }

    runTest();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm text-center">
        <h2 className="text-xl font-serif font-semibold text-stone-800 mb-2">
          🧪 Test Mode (PHQ‑9 + GAD‑7 + Additional)
        </h2>
        <p className="text-stone-600">{status}</p>
      </div>
    </div>
  );
}