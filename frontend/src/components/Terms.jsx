import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

export default function Terms() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand flex items-center justify-center px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="w-full max-w-2xl"
      >
        {/* Compact Terms Card */}
        <motion.div
          variants={fadeUp}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-stone-200/50 shadow-sm"
        >
          <motion.h1
            variants={fadeUp}
            className="text-xl md:text-2xl font-serif font-bold text-stone-800 mb-4"
          >
            Terms of Service & Data Use
          </motion.h1>

          <motion.div variants={fadeUp} className="space-y-2 text-stone-700 text-xs leading-relaxed mb-5">
            <p>
              By proceeding with this assessment, you acknowledge and agree to the following:
            </p>

            <ul className="list-disc pl-4 space-y-1.5">
              <li>
                All responses are collected <strong>anonymously</strong>. No personally identifiable information (name, email, IP address) is stored.
              </li>
              <li>
                Aggregated, de‑identified data may be used for academic research, model improvement, and publication of statistical insights.
              </li>
              <li>
                Your feedback (ratings and comments) will be used solely to improve prediction accuracy and will remain confidential.
              </li>
              <li>
                We reserve the right to use this data for future publications, but only in aggregated form.
              </li>
              <li>
                You can withdraw at any time by closing the browser – no data is retained before final submission.
              </li>
              <li>
                This tool provides educational and informational insights only. It is not a substitute for professional medical advice, diagnosis, or treatment.
              </li>
            </ul>

            <motion.div
              variants={fadeUp}
              className="bg-nurture-sand/50 rounded-xl p-3 border border-stone-200/30 text-[10px] text-stone-500 leading-relaxed"
            >
              <strong>Project:</strong> CPE 232 Data Models – Mental Health & Burnout in Tech Workers.<br />
              <strong>Data Source:</strong> Kaggle dataset “Mental Health and Burnout in Tech Workers 2026”.<br />
              <strong>Compliance:</strong> This research adheres to ethical guidelines for anonymised survey data. No medical claims are made.
            </motion.div>
          </motion.div>

          {/* Agreement Checkbox */}
          <motion.label
            variants={fadeUp}
            className="flex items-start gap-3 mb-5 cursor-pointer group"
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500 accent-stone-800"
            />
            <span className="text-stone-700 text-xs leading-relaxed select-none">
              I have read and agree to the terms above. My responses will be handled anonymously and may be used for research purposes.
            </span>
          </motion.label>

          {/* Buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row justify-between gap-3"
          >
            <button
              onClick={() => navigate('/statistics')}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-full font-medium text-xs hover:bg-white/60 transition"
            >
              ← Back to Statistics
            </button>
            <button
              onClick={() => agreed && navigate('/language')}
              disabled={!agreed}
              className={`px-5 py-2 rounded-full font-medium text-xs transition-all duration-300 ${
                agreed
                  ? 'bg-stone-800 text-white shadow-md hover:bg-stone-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              Begin Test →
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};