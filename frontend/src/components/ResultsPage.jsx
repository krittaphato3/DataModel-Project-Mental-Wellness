import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useSpring } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
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

/* ---- Burnout category mapping (0‑3 scale) ---- */
function getBurnoutCategory(score) {
  if (score == null) return { level: 'Unknown', progress: 0, color: 'bg-stone-200' };
  // Clamp score to 0‑3 range
  const clamped = Math.min(3, Math.max(0, score));
  const levels = ['None', 'Low', 'Medium', 'High'];
  const colors = ['bg-green-500', 'bg-yellow-500', 'bg-amber-500', 'bg-red-500'];
  const idx = Math.floor(clamped);   // integer part
  const fractional = clamped - idx;   // for smooth bar if needed
  // Use exact index if whole, otherwise blend? We'll use ceiling for the category
  const displayLevel = levels[Math.min(3, Math.ceil(clamped))];
  const displayColor = colors[Math.min(3, Math.ceil(clamped))];
  return {
    level: displayLevel,
    progress: clamped / 3,   // 0‑1 fraction
    color: displayColor,
    raw: clamped,
  };
}

function generateRecommendations(prediction, formData) {
  const tips = [];
  if (prediction.burnout_level != null) {
    const cat = getBurnoutCategory(prediction.burnout_level);
    if (cat.level === 'High') tips.push("High burnout risk: consider reducing work hours or taking short breaks.");
    else if (cat.level === 'Medium') tips.push("Moderate burnout: set clearer work-life boundaries.");
    else if (cat.level === 'Low') tips.push("Mild burnout signs – stay mindful.");
  }
  if (prediction.seeks_mental_health_support === 1) tips.push("You indicated interest in mental health support – explore available resources.");
  if (prediction.job_change_intention === 1) tips.push("You might be considering a job change – reflect on what aspects of work are most important to you.");
  if (formData?.sleep_hours < 6) tips.push("Poor sleep hygiene: aim for 7-8 hours, avoid screens before bed.");
  if (formData?.toxic_workplace_exposure > 7) tips.push("Toxic environment: consider speaking with HR or a mentor.");
  if (formData?.weekly_work_hours > 50) tips.push("Long hours: schedule 15-minute breaks every 2 hours.");
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

  console.log('=== RESULTS DIAGNOSTIC ===');
  console.log('Full prediction:', prediction);
  console.log('Warnings:', prediction.warnings);
  console.log('===========================');

  const warnings = prediction.warnings || [];
  const burnoutCat = getBurnoutCategory(prediction.burnout_level);

  const diagnosticMessages = [];
  if (warnings.length > 0) diagnosticMessages.push(...warnings);
  diagnosticMessages.push(`Burnout: ${prediction.burnout_level != null ? `${prediction.burnout_level} → ${burnoutCat.level}` : 'NOT LOADED'}`);
  diagnosticMessages.push(`Seeks Support: ${prediction.seeks_mental_health_support_score != null ? `${prediction.seeks_mental_health_support_score}/1 (${prediction.seeks_mental_health_support ? 'Yes' : 'No'})` : 'NOT LOADED'}`);
  diagnosticMessages.push(`Job Change: ${prediction.job_change_intention_score != null ? `${prediction.job_change_intention_score}/1 (${prediction.job_change_intention ? 'Yes' : 'No'})` : 'NOT LOADED'}`);

  const missingCount = [prediction.burnout_level, prediction.seeks_mental_health_support_score, prediction.job_change_intention_score].filter(v => v == null).length;
  const allModelsOk = missingCount === 0;

  const metrics = [
    {
      label: 'Burnout Level',
      value: prediction.burnout_level,
      max: 3,                       // 0-3 scale
      color: burnoutCat.color,
      isMissing: prediction.burnout_level === null,
      category: burnoutCat,
    },
    {
      label: 'Seeks Support',
      score: prediction.seeks_mental_health_support_score,
      class: prediction.seeks_mental_health_support >= 0.5 ? 'Yes' : prediction.seeks_mental_health_support === 0 ? 'No' : '?',
      max: 1,
      unit: '/1',
      color: 'bg-emerald-600',
      isMissing: prediction.seeks_mental_health_support_score === null,
    },
    {
      label: 'Job Change Intention',
      score: prediction.job_change_intention_score,
      class: prediction.job_change_intention >= 0.5 ? 'Yes' : prediction.job_change_intention === 0 ? 'No' : '?',
      max: 1,
      unit: '/1',
      color: 'bg-amber-600',
      isMissing: prediction.job_change_intention_score === null,
    },
  ];
  const recommendations = generateRecommendations(prediction, formData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand py-8 px-4">
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl mx-auto">
        {/* Diagnostic Banner */}
        <motion.div
          variants={fadeUp}
          className={`mb-6 rounded-2xl p-5 border shadow-sm ${allModelsOk ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{allModelsOk ? '✅' : '⚠️'}</span>
            <h3 className="font-serif font-semibold text-sm">
              {allModelsOk ? 'All ML models loaded successfully' : `${missingCount} model(s) unavailable`}
            </h3>
          </div>
          <ul className="text-xs space-y-1 list-disc pl-5 opacity-80">
            {diagnosticMessages.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        </motion.div>

        {/* Title */}
        <motion.div variants={fadeUp} className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-2">Your Wellness Report</h1>
          <p className="text-stone-500">Based on your responses</p>
        </motion.div>

        {/* PHQ-9 Score Card */}
        {prediction.phq9_total != null && (
          <motion.div variants={fadeUp} className="mb-6 bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-stone-200/50 shadow-sm text-center">
            <div className="text-xs uppercase text-stone-400 tracking-wider mb-1">PHQ‑9 Depression Score</div>
            <div className="text-3xl font-bold text-stone-800">{prediction.phq9_total}<span className="text-sm">/27</span></div>
            <div className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${
              prediction.phq9_severity?.includes('ปกติ') || prediction.phq9_severity?.includes('None')
                ? 'bg-green-100 text-green-700'
                : prediction.phq9_severity?.includes('เล็กน้อย') || prediction.phq9_severity?.includes('Mild')
                ? 'bg-yellow-100 text-yellow-700'
                : prediction.phq9_severity?.includes('ปานกลาง') || prediction.phq9_severity?.includes('Moderate')
                ? 'bg-amber-100 text-amber-700'
                : prediction.phq9_severity?.includes('ค่อนข้าง') || prediction.phq9_severity?.includes('Moderately')
                ? 'bg-orange-100 text-orange-700'
                : 'bg-red-100 text-red-700'
            }`}>{prediction.phq9_severity}</div>
          </motion.div>
        )}

        {/* GAD-7 Score Card */}
        {prediction.gad7_total != null && (
          <motion.div variants={fadeUp} className="mb-6 bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-stone-200/50 shadow-sm text-center">
            <div className="text-xs uppercase text-stone-400 tracking-wider mb-1">GAD‑7 Anxiety Score</div>
            <div className="text-3xl font-bold text-stone-800">{prediction.gad7_total}<span className="text-sm">/21</span></div>
            <div className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${
              prediction.gad7_severity?.includes('ปกติ') || prediction.gad7_severity?.includes('None')
                ? 'bg-green-100 text-green-700'
                : prediction.gad7_severity?.includes('เล็กน้อย') || prediction.gad7_severity?.includes('Mild')
                ? 'bg-yellow-100 text-yellow-700'
                : prediction.gad7_severity?.includes('ปานกลาง') || prediction.gad7_severity?.includes('Moderate')
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>{prediction.gad7_severity}</div>
          </motion.div>
        )}

        {/* ML Metrics */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-stone-200/50 shadow-sm text-center">
              <div className="text-xs uppercase text-stone-400 tracking-wider mb-2">{m.label}</div>
              {m.category ? (
                <>
                  {/* Numeric value */}
                  <div className="text-2xl font-bold text-stone-800">
                    <AnimatedScore value={m.value} />
                    <span className="text-sm">{m.unit}</span>
                  </div>
                  {/* Category label */}
                  <div className="text-xs text-stone-500 mt-1">{m.category.level}</div>
                  {/* Progress bar */}
                  <div className="w-full bg-stone-200 h-3 rounded-full mt-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.category.progress * 100}%` }}
                      transition={{ duration: 0.6 }}
                      className={`${m.category.color} h-3 rounded-full`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-stone-500 mt-1">
                    <span>None</span><span>High</span>
                  </div>
                </>
              ) : m.score !== undefined ? (
                <>
                  <div className="text-2xl font-bold text-stone-800">
                    <AnimatedScore value={m.score} /><span className="text-sm">{m.unit}</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">{m.class}</div>
                  <div className="w-full bg-stone-200 h-2 rounded-full mt-3 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(m.score / m.max) * 100}%` }} transition={{ duration: 0.6 }} className={`${m.color} h-2 rounded-full`} />
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold text-stone-800">??<span className="text-sm">{m.unit}</span></div>
              )}
              {m.isMissing && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-full px-3 py-1 border border-red-200">Model not found</div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Recommendations */}
        <motion.div variants={fadeUp} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-stone-200/50 shadow-sm mb-10">
          <h2 className="text-xl font-serif font-semibold text-stone-800 mb-4">Personalized Recommendations</h2>
          <ul className="space-y-3">
            {recommendations.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-stone-700">
                <span className="text-stone-800 mt-1">•</span> {tip}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={fadeUp} className="flex justify-between items-center">
          <button onClick={() => navigate('/assessment')} className="px-5 py-2.5 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition">← Retake Assessment</button>
          <button onClick={() => navigate('/feedback', { state: { prediction, formData, submissionId: prediction?.submission_id } })} className="px-6 py-3 bg-stone-800 text-white rounded-full font-medium text-sm shadow-md hover:bg-stone-700 transition">Next: Rate Your Experience →</button>
        </motion.div>
      </motion.div>
    </div>
  );
}