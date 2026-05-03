import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LanguageSelect() {
  const navigate = useNavigate();

  const handleSelect = (lang) => {
    navigate('/phq9', { state: { lang } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand flex items-center justify-center px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-stone-200/50 shadow-sm max-w-md w-full text-center"
      >
        <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">Select Language</h2>
        <p className="text-stone-500 text-sm mb-8">เลือกภาษา / Choose your language</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSelect('th')}
            className="w-full py-4 px-6 rounded-xl border border-stone-300 hover:border-stone-500 bg-white/50 hover:bg-white transition flex items-center justify-center gap-3 text-stone-800 font-medium"
          >
            <span className="text-xl">🇹🇭</span> ภาษาไทย
          </button>
          <button
            onClick={() => handleSelect('en')}
            className="w-full py-4 px-6 rounded-xl border border-stone-300 hover:border-stone-500 bg-white/50 hover:bg-white transition flex items-center justify-center gap-3 text-stone-800 font-medium"
          >
            <span className="text-xl">🇬🇧</span> English
          </button>
        </div>
      </motion.div>
    </div>
  );
}