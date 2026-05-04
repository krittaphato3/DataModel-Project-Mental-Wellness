import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// ---------- Framer Motion Variants ----------
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
};

export default function Landing() {
  const navigate = useNavigate();

  // ข้อมูลสถิติจากปี 2026
  const stats = [
    { value: '47.9%', label: 'High or Severe burnout – the largest class (Severe 28.6%)' },
    { value: '3.45×', label: 'Burnout gap: sleep <5h → 6.88 vs ≥8h → 3.43' },
    { value: 'r = 0.61', label: 'Meetings correlate with stress stronger than salary or hours' },
    { value: '7.44', label: 'Remote workers’ PHQ‑9 mean vs 5.17 for on‑site' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand overflow-x-hidden">
      {/* ───────── Hero Section ───────── */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative min-h-screen flex items-center justify-center px-4"
      >
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-nurture-olive/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-nurture-clay/15 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp}>
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm text-stone-600 text-sm font-medium mb-6 border border-stone-200/50 shadow-sm">
              Mental Wellness for Tech Professionals
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-stone-800 mb-6 tracking-tight">
            Mindful Compass
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Navigate your mental wellness with clarity and purpose.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* ปุ่มทำแบบประเมินเดิม */}
            <button
              onClick={() => navigate('/statistics')}
              className="px-8 py-3 bg-stone-800 text-white rounded-full font-semibold text-base shadow-md transition-all duration-300 hover:bg-stone-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Begin Your Journey →
            </button>
            {/* ปุ่มใหม่สำหรับหน้า GAD-7 */}
            <button
              onClick={() => navigate('/gad7')}
              className="px-8 py-3 border border-stone-300 text-stone-700 rounded-full font-semibold text-base bg-white/40 backdrop-blur-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              Anxiety Test (GAD-7)
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* ───────── How It Works ───────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="py-20 md:py-28 px-6 bg-white/40 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-3">How It Works</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">A guided three‑step path to actionable insights.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Answer with Honesty', desc: 'Share your work habits and lifestyle through a secure, thoughtful questionnaire.' },
              { step: '2', title: 'AI‑Powered Insight', desc: 'Our models, trained on 100K+ data points, analyze your patterns for meaningful correlations.' },
              { step: '3', title: 'Receive Your Compass', desc: 'Get a personalised report with clear, actionable steps to enhance your well‑being.' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-stone-200/50 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-stone-800/10 rounded-xl flex items-center justify-center mx-auto mb-5 text-xl font-bold text-stone-800 group-hover:bg-stone-800 group-hover:text-white transition-colors duration-300">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2 text-center">{item.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed text-center">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ───────── Statistics Preview ───────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="py-20 px-6 bg-nurture-sand/50 border-y border-stone-200/40"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 mb-3">The Current Landscape</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Insights from the 2026 Tech Mental Health Survey – 100,000 professionals, 12 roles, 10 countries.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-sm border border-stone-200/30"
              >
                <div className="text-3xl md:text-4xl font-bold text-stone-800 mb-1">{stat.value}</div>
                <div className="text-stone-600 text-xs md:text-sm leading-relaxed">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ───────── Call to Action ───────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="py-20 px-6"
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            whileHover={{ scale: 1.01 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-stone-200/50 shadow-sm"
          >
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 mb-4">
              Designed with clarity and purpose.
            </h2>
            <p className="text-stone-600 mb-6 leading-relaxed">
              Your privacy is paramount. All responses are anonymised and secured.
            </p>
            <button
              onClick={() => navigate('/statistics')}
              className="px-8 py-3 bg-stone-800 text-white rounded-full font-semibold text-base shadow-md transition-all duration-300 hover:bg-stone-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Your Assessment
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-stone-200/30 py-8 text-center text-xs text-stone-400">
        <p>CPE 232 Data Models Project — ฐานุวัชร์, ภัณฑิรา, หฤษฎ์, กฤตภาส, จีราวัฒน์, ภัทรภณ</p>
        <p className="mt-1">Data Source: Kaggle – Mental Health and Burnout in Tech Workers 2026</p>
      </footer>
    </div>
  );
}
