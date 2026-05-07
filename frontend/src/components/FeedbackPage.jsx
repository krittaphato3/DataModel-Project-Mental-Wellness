import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { updateFeedback } from '../api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeedbackPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { submissionId } = location.state || {};

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleStarClick = (value) => {
    setRating(value);
  };

  // =========================
  // SUBMIT FEEDBACK
  // =========================
  const handleSubmit = async () => {
    if (!rating) {
      alert('Please select a rating.');
      return;
    }

    setSubmitting(true);

    try {
      await updateFeedback(submissionId, rating, comment.trim());

      setSubmitted(true);

    } catch (err) {
      console.error('Feedback error:', err);
      alert('Could not save feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // BACK HOME
  // =========================
  const goHome = async () => {
    try {
      if (rating || comment.trim()) {
        await updateFeedback(submissionId, rating, comment.trim());
      }
    } catch (e) {
      console.error("Auto-save feedback failed", e);
    } finally {
      navigate('/');
    }
  };

  // =========================
  // SUCCESS SCREEN
  // =========================
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="bg-white p-8 rounded-xl text-center shadow"
        >
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
          <p className="text-gray-500 mb-5">
            Your feedback has been saved.
          </p>

          <button
            onClick={goHome}
            className="px-5 py-2 bg-black text-white rounded-full"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="bg-white p-6 rounded-xl w-full max-w-md shadow"
      >
        <h2 className="text-xl font-semibold mb-2">
          Rate Your Experience
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          How accurate was this prediction?
        </p>

        {/* STARS */}
        <div className="flex justify-center gap-2 mb-6">
          {[1,2,3,4,5].map((star) => (
            <span
              key={star}
              onClick={() => handleStarClick(star)}
              className="text-3xl cursor-pointer"
              style={{
                color: rating >= star ? '#facc15' : '#d1d5db'
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* COMMENT */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment..."
          className="w-full border rounded-lg p-3 mb-5 text-sm"
          rows={3}
        />

        {/* BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || !rating}
            className="flex-1 bg-black text-white py-2 rounded-full disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>

          <button
            onClick={goHome}
            className="flex-1 border py-2 rounded-full"
          >
            Skip
          </button>
        </div>
      </motion.div>
    </div>
  );
}
