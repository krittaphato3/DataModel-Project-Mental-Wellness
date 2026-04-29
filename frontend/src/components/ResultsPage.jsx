import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
};

function AnimatedScore({ value, isOffline }) {
  const springValue = useSpring(0, { stiffness: 80, damping: 20 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isOffline || value === null) return;
    springValue.set(value);
    const unsubscribe = springValue.on('change', v => setDisplayValue(Math.round(v * 10) / 10));
    return () => unsubscribe();
  }, [springValue, value, isOffline]);

  if (isOffline || value === null) return <span>??</span>;
  return <span>{displayValue}</span>;
}

function generateRecommendations(prediction, formData) {
  const tips = [];
  if (prediction.burnout_score > 7) tips.push("High burnout risk: consider reducing work hours or taking short breaks.");
  else if (prediction.burnout_score > 5) tips.push("Moderate burnout: set clearer work‑life boundaries.");
  if (prediction.stress_level > 7) tips.push("Elevated stress: practice 5‑minute mindfulness daily.");
  if (prediction.anxiety_score > 6) tips.push("Anxiety signs: limit meeting overload and try deep breathing.");
  if (prediction.depression_score > 6) tips.push("Low mood indicators: talk to a trusted colleague or professional.");
  if (formData.sleep_hours < 6) tips.push("Poor sleep hygiene: aim for 7‑8 hours, avoid screens before bed.");
  if (formData.toxic_workplace_exposure > 7) tips.push("Toxic environment: consider speaking with HR or a mentor.");
  if (formData.weekly_work_hours > 50) tips.push("Long hours: schedule 15‑minute breaks every 2 hours.");
  if (formData.manager_support < 4) tips.push("Low manager support: request a 1:1 to discuss workload.");
  if (tips.length === 0) tips.push("Your profile looks balanced. Keep up good habits!");
  return tips;
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prediction, formData } = location.state || {};

  useEffect(() => {
    if (!prediction) {
      navigate('/assessment', { replace: true });
    }
  }, [prediction, navigate]);

  if (!prediction) return null;

  const isOffline = prediction.offline;
  const metrics = [
    { label: 'Burnout', value: prediction.burnout_score, color: 'bg-stone-800' },
    { label: 'Stress', value: prediction.stress_level, color: 'bg-stone-600' },
    { label: 'Anxiety', value: prediction.anxiety_score, color: 'bg-stone-500' },
    { label: 'Depression', value: prediction.depression_score, color: 'bg-stone-400' }
  ];

  const recommendations = generateRecommendations(prediction, formData);

  const riskColor = isOffline ? 'bg-stone-100 text-stone-500 border-stone-200' :
    prediction.risk_category === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
    prediction.risk_category === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-green-50 text-green-700 border-green-200';

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand py-8 px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-2xl mx-auto"
      >
        {/* Offline warning */}
        {isOffline && (
          <motion.div variants={fadeUp} className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
            ⚠️ Could not reach the prediction server. Scores are unavailable – please ensure the backend is running.
          </motion.div>
        )}

        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-2">
            Your Wellness Report
          </h1>
          <p className="text-stone-500">Based on your responses</p>
        </motion.div>

        {/* Metric cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-stone-200/50 shadow-sm text-center">
              <div className="text-xs uppercase text-stone-400 tracking-wider mb-2">{m.label}</div>
              <div className="text-3xl font-bold text-stone-800">
                <AnimatedScore value={m.value} isOffline={isOffline} />
                <span className="text-sm">/10</span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isOffline ? '0%' : `${(m.value / 10) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                  className={`${m.color} h-2 rounded-full`}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Risk category */}
        <motion.div
          variants={fadeUp}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border mb-10 ${riskColor} animate-pulse`}
        >
          <span className="font-medium">Risk Category:</span>
          <span className="font-bold">{isOffline ? 'Unknown' : prediction.risk_category}</span>
        </motion.div>

        {/* Recommendations */}
        <motion.div variants={fadeUp} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-stone-200/50 shadow-sm mb-10">
          <h2 className="text-xl font-serif font-semibold text-stone-800 mb-4">Personalized Recommendations</h2>
          <ul className="space-y-3">
            {recommendations.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-stone-700">
                <span className="text-stone-800 mt-1">•</span>
                {tip}
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-400 mt-4 italic">
            Based on data-driven patterns. Consult a professional for medical advice.
          </p>
        </motion.div>

        {/* Navigation */}
        <motion.div variants={fadeUp} className="flex justify-between items-center">
          <button
            onClick={() => navigate('/assessment')}
            className="px-5 py-2.5 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition"
          >
            ← Retake Assessment
          </button>
          <button
            onClick={() => navigate('/feedback', { state: { prediction, formData } })}
            className="px-6 py-3 bg-stone-800 text-white rounded-full font-medium text-sm shadow-md hover:bg-stone-700 transition"
          >
            Next: Rate Your Experience →
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}