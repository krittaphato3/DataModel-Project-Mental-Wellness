import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useSpring } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
};

function AnimatedScore({ value }) {
  const springValue = useSpring(0, { stiffness: 80, damping: 20 });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null) return;
    springValue.set(value);
    const unsub = springValue.on('change', v => setDisplay(Math.round(v * 100) / 100));
    return () => unsub();
  }, [springValue, value]);

  if (value == null) return <span>??</span>;
  return <span>{display}</span>;
}

function generateRecommendations(prediction, formData) {
  const tips = [];
  if (prediction.burnout_level && prediction.burnout_level > 7) tips.push("High burnout risk: consider reducing work hours or taking short breaks.");
  else if (prediction.burnout_level && prediction.burnout_level > 5) tips.push("Moderate burnout: set clearer work‑life boundaries.");
  if (prediction.seeks_mental_health_support === 1) tips.push("You indicated interest in mental health support – explore available resources.");
  if (prediction.job_change_intention === 1) tips.push("You might be considering a job change – reflect on what aspects of work are most important to you.");
  if (formData && formData.sleep_hours < 6) tips.push("Poor sleep hygiene: aim for 7‑8 hours, avoid screens before bed.");
  if (tips.length === 0) tips.push("Your profile looks balanced. Keep up good habits!");
  return tips;
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prediction, formData } = location.state || {};

  useEffect(() => {
    if (!prediction) navigate('/assessment', { replace: true });
  }, [prediction, navigate]);

  if (!prediction) return null;

  const warnings = prediction.warnings || [];
  const hasWarnings = warnings.length > 0;

  const metrics = [
    {
      label: 'Burnout Level',
      value: prediction.burnout_level,
      max: 10,
      unit: '/10',
      color: 'bg-stone-800',
      isMissing: prediction.burnout_level === null
    },
    {
      label: 'Seeks Support',
      score: prediction.seeks_mental_health_support_score,
      class: prediction.seeks_mental_health_support === 1 ? 'Yes' : prediction.seeks_mental_health_support === 0 ? 'No' : '?',
      max: 1,
      unit: '/1',
      color: 'bg-emerald-600',
      isMissing: prediction.seeks_mental_health_support_score === null
    },
    {
      label: 'Job Change Intention',
      score: prediction.job_change_intention_score,
      class: prediction.job_change_intention === 1 ? 'Yes' : prediction.job_change_intention === 0 ? 'No' : '?',
      max: 1,
      unit: '/1',
      color: 'bg-amber-600',
      isMissing: prediction.job_change_intention_score === null
    }
  ];

  const recommendations = generateRecommendations(prediction, formData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand py-8 px-4">
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl mx-auto">
        {hasWarnings && (
          <motion.div variants={fadeUp} className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
            <p className="font-medium mb-1">Some models are missing:</p>
            <ul className="list-disc pl-5 space-y-1">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-2">Your Wellness Report</h1>
          <p className="text-stone-500">Based on your responses</p>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-stone-200/50 shadow-sm text-center">
              <div className="text-xs uppercase text-stone-400 tracking-wider mb-2">{m.label}</div>
              {m.score !== undefined ? (
                <>
                  <div className="text-2xl font-bold text-stone-800">
                    <AnimatedScore value={m.score} />
                    <span className="text-sm">{m.unit}</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">{m.class}</div>
                  <div className="w-full bg-stone-200 h-2 rounded-full mt-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: m.isMissing ? '0%' : `${(m.score / m.max) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className={`${m.color} h-2 rounded-full`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-stone-800">
                    <AnimatedScore value={m.value} />
                    <span className="text-sm">{m.unit}</span>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full mt-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: m.isMissing ? '0%' : `${(m.value / m.max) * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className={`${m.color} h-2 rounded-full`}
                    />
                  </div>
                </>
              )}
              {m.isMissing && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-full px-3 py-1 border border-red-200">
                  Model not found
                </div>
              )}
            </div>
          ))}
        </motion.div>

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
          <p className="text-xs text-stone-400 mt-4 italic">Based on data-driven patterns. Consult a professional for medical advice.</p>
        </motion.div>

        <motion.div variants={fadeUp} className="flex justify-between items-center">
          <button onClick={() => navigate('/language')} className="px-5 py-2.5 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition">
            ← Retake Assessment
          </button>
          <button onClick={() => navigate('/feedback', { state: { prediction, formData } })} className="px-6 py-3 bg-stone-800 text-white rounded-full font-medium text-sm shadow-md hover:bg-stone-700 transition">
            Next: Rate Your Experience →
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}