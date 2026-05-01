import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predict } from '../api';

const TEST_FORM_DATA = {
  weekly_work_hours: 45,
  work_location: 'Remote',
  sleep_hours: 6,
  toxic_workplace_exposure: 5,
  meeting_hours_per_week: 10,
  manager_support: 7,
  years_of_experience: 4,
  age: 28,
  job_role: 'Software Engineer',
};

export default function TestPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Waiting…');

  useEffect(() => {
    let cancelled = false;

    async function runTest() {
      setStatus('Contacting backend…');
      try {
        const prediction = await predict(TEST_FORM_DATA);
        if (cancelled) return;
        setStatus('Success! Navigating to results.');
        setTimeout(() => {
          navigate('/results', { state: { prediction, formData: TEST_FORM_DATA } });
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
        <h2 className="text-xl font-serif font-semibold text-stone-800 mb-2">🧪 Test Mode</h2>
        <p className="text-stone-600">{status}</p>
      </div>
    </div>
  );
}