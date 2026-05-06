import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { submitFeedback } from '../api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/** Turn the raw formData into a flat object of individual columns */
function flattenFormData(data) {
  const flat = {};
  if (!data) return flat;

  // PHQ‑9 answers
  if (Array.isArray(data.phq9_answers)) {
    data.phq9_answers.forEach((val, idx) => {
      flat[`phq9_q${idx + 1}`] = val ?? '';
    });
  }

  // GAD‑7 answers
  if (Array.isArray(data.gad7_answers)) {
    data.gad7_answers.forEach((val, idx) => {
      flat[`gad7_q${idx + 1}`] = val ?? '';
    });
  }

  // Part 3 fields – each becomes its own column
  const part3Fields = [
    'stress_score',
    'poor_balance_high_stress',
    'job_satisfaction_score',
    'manager_support_score',
    'autonomy_score',
    'meetings_per_day',
    'work_hours_per_week',
    'deadline_pressure_score',
    'work_life_balance_score',
    'sleep_hours_per_night',
    'exercise_days_per_week',
    'vacation_days_taken',
    'social_support_score',
    'therapy_access',
    'salary_usd',
  ];

  part3Fields.forEach(field => {
    flat[field] = data[field] !== undefined ? data[field] : '';
  });

  return flat;
}

/** Flatten prediction outputs */
function flattenPrediction(pred) {
  if (!pred) return {};
  const keys = [
    'burnout_level',
    'seeks_mental_health_support_score',
    'seeks_mental_health_support',
    'job_change_intention_score',
    'job_change_intention',
    'phq9_total',
    'phq9_severity',
    'gad7_total',
    'gad7_severity',
  ];
  const flat = {};
  keys.forEach(k => {
    flat[k] = pred[k] !== undefined ? pred[k] : '';
  });
  return flat;
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prediction, formData } = location.state || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleStarClick = (starIndex, half) => {
    const newRating = half ? starIndex - 0.5 : starIndex;
    setRating(newRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating.');
      return;
    }
    setSubmitting(true);

    // Build the flattened payload
    const flatForm = flattenFormData(formData);
    const flatPred = flattenPrediction(prediction);
    const payload = {
      rating,
      comment: comment.trim(),
      ...flatForm,
      ...flatPred,
    };

    try {
      await submitFeedback(payload);
      setSubmitted(true);
    } catch (err) {
      console.error('Feedback submission failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    // If user already typed something, fire-and-forget a submission
    if (rating > 0 || comment.trim()) {
      const flatForm = flattenFormData(formData);
      const flatPred = flattenPrediction(prediction);
      submitFeedback({
        rating,
        comment: comment.trim(),
        ...flatForm,
        ...flatPred,
      }).catch(console.error);
    }
    navigate('/');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand flex items-center justify-center px-4">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-stone-200/50 shadow-sm">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-serif font-semibold text-stone-800 mb-2">Thank You!</h2>
          <p className="text-stone-600 text-sm mb-6">Your feedback helps improve our models.</p>
          <button onClick={goHome} className="px-6 py-2.5 bg-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-700 transition">
            ← Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand flex items-center justify-center px-4">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm">
        <h2 className="text-xl font-serif font-semibold text-stone-800 mb-2">Rate Your Experience</h2>
        <p className="text-sm text-stone-500 mb-6">How accurate was this prediction?</p>

        {/* Half‑star rating */}
        <div className="flex gap-1 mb-6 justify-center">
          {[1,2,3,4,5].map(star => (
            <div key={star} className="flex cursor-pointer">
              {/* Left half */}
              <span
                onClick={() => handleStarClick(star, true)}
                className="text-3xl select-none"
                style={{
                  color: rating >= star ? '#eab308' : rating >= star - 0.5 ? '#eab308' : '#d6d3d1',
                  width: '14px', overflow: 'hidden', display: 'inline-block', lineHeight: 1,
                }}
              >
                ★
              </span>
              {/* Right half */}
              <span
                onClick={() => handleStarClick(star, false)}
                className="text-3xl select-none"
                style={{
                  color: rating >= star ? '#eab308' : '#d6d3d1',
                  width: '14px', overflow: 'hidden', display: 'inline-block', lineHeight: 1, direction: 'rtl',
                }}
              >
                ★
              </span>
            </div>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Optional: share your thoughts..."
          className="w-full border border-stone-200 rounded-xl p-3 text-sm mb-6 focus:ring-2 focus:ring-stone-500"
          rows="3"
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 py-2.5 bg-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
          <button
            onClick={goHome}
            className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition"
          >
            {rating || comment.trim() ? 'Save & Back to Home' : 'Skip'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}