import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
};

export default function Statistics() {
  const navigate = useNavigate();

  const stats = [
    { value: "47.9%", label: "High or Severe burnout — Severe (28.6%) is the single largest class." },
    { value: "3.45×", label: "Burnout gap: sleep <5 hrs = 6.88 vs ≥8 hrs = 3.43 on a 10‑point scale." },
    { value: "r = 0.61", label: "Meetings correlate with stress stronger than salary, hours, or any other variable." },
    { value: "7.44", label: "Remote workers' PHQ‑9 mean (mild depression range) vs On‑site = 5.17." },
    { value: "34%", label: "Only 1 in 3 tech workers have employer therapy access. Users show PHQ‑9 = 4.64 vs 6.56." },
    { value: "73%", label: "Use AI tools daily — and AI users show systematically higher anxiety (GAD‑7) scores." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand py-6 px-4 flex flex-col justify-center">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-4xl mx-auto w-full"
      >
        {/* Header Card */}
        <motion.div
          variants={fadeUp}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 mb-5 border border-stone-200/50 shadow-sm"
        >
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 mb-2">
            The 2026 Tech Mental Health Landscape
          </h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            Based on 100,000 anonymised tech professionals across 12 roles, 10 countries, and 6 seniority levels.
            Calibrated against the Burnout Index (32,644 professionals, 33 countries), NIH, WHO, PHQ‑9, and GAD‑7
            clinical instruments. All 40 validation checks passed.
          </p>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-stone-200/40 shadow-sm"
            >
              <div className="text-2xl md:text-3xl font-bold text-stone-800 mb-1">{stat.value}</div>
              <p className="text-stone-600 text-xs leading-relaxed">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Why This Matters */}
        <motion.div
          variants={fadeUp}
          className="bg-nurture-sand/50 backdrop-blur-sm rounded-xl p-4 mb-5 border border-stone-200/30"
        >
          <h2 className="text-lg font-serif font-semibold text-stone-800 mb-1">
            Why this matters
          </h2>
          <p className="text-stone-600 text-xs leading-relaxed">
            Chronic stress and burnout cost the tech industry billions in turnover and lost productivity.
            This dataset reveals that sleep is the single strongest protective factor — yet tech workers average
            only 6.1 hrs/night, well below the general population's 6.8 hrs (CDC 2024). Early detection and
            targeted support can reverse these trends.
          </p>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div variants={fadeUp} className="flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-full font-medium text-sm hover:bg-white/60 transition"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => navigate('/terms')}
            className="px-5 py-2 bg-stone-800 text-white rounded-full font-medium text-sm shadow-md transition-all duration-300 hover:bg-stone-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            Next → Terms of Service
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};