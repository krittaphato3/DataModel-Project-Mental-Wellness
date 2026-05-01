import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { submitFeedback } from '../api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function FeedbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prediction, formData } = location.state || {};

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleStarClick = (starIndex, half) => {
    const newRating = half ? starIndex - 0.5 : starIndex;
    setRating(newRating);
  };

  const sendFeedback = async () => {
    if (rating === 0 && comment.trim() === '') return; // nothing to save
    setSaving(true);
    try {
      await submitFeedback({
        rating,
        comment,
        predicted_values: prediction,
        user_input: formData
      });
    } catch (err) {
      console.error('Feedback save failed', err);
      // Still continue – not critical
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    await sendFeedback();
    setSubmitted(true);
  };

  const handleBackToHome = async () => {
    if (rating > 0 || comment.trim() !== '') {
      await sendFeedback();
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
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-700 transition"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand flex items-center justify-center px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm"
      >
        <h2 className="text-xl font-serif font-semibold text-stone-800 mb-2">Rate Your Experience</h2>
        <p className="text-sm text-stone-500 mb-6">How accurate was this prediction?</p>

        {/* Half‑star rating */}
        <div className="flex gap-1 mb-6 justify-center">
          {[1, 2, 3, 4, 5].map(star => (
            <div key={star} className="flex cursor-pointer">
              <span
                onClick={() => handleStarClick(star, true)}
                className="text-3xl select-none"
                style={{
                  color: rating >= star ? '#eab308' : rating >= star - 0.5 ? '#eab308' : '#d6d3d1',
                  width: '14px',
                  overflow: 'hidden',
                  display: 'inline-block',
                  lineHeight: 1
                }}
              >
                ★
              </span>
              <span
                onClick={() => handleStarClick(star, false)}
                className="text-3xl select-none"
                style={{
                  color: rating >= star ? '#eab308' : '#d6d3d1',
                  width: '14px',
                  overflow: 'hidden',
                  display: 'inline-block',
                  lineHeight: 1,
                  direction: 'rtl'
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
            disabled={saving || rating === 0}
            className="flex-1 py-2.5 bg-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Submit Feedback'}
          </button>
          <button
            onClick={handleBackToHome}
            disabled={saving}
            className="px-5 py-2.5 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition"
          >
            Back to Home
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-4 text-center">
          Your rating and comment will be saved even if you go straight home.
        </p>
      </motion.div>
    </div>
  );
}