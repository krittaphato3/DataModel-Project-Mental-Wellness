import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Thai questions
const thQuestions = [
  { id: 1, text: 'เบื่อ ไม่สนใจอะไรเลย' },
  { id: 2, text: 'รู้สึกหดหู่ เศร้า หรือสิ้นหวัง' },
  { id: 3, text: 'มีปัญหาในการนอนหลับ เช่น นอนไม่หลับหรือนอนมากเกินไป' },
  { id: 4, text: 'รู้สึกเหนื่อยล้าหรือไม่มีเรี่ยวแรง' },
  { id: 5, text: 'เบื่ออาหารหรือกินมากเกินไป' },
  { id: 6, text: 'รู้สึกไม่ดีกับตัวเอง คิดว่าตัวเองล้มเหลวหรือทำให้ครอบครัวผิดหวัง' },
  { id: 7, text: 'ขาดสมาธิในการทำสิ่งต่างๆ' },
  { id: 8, text: 'เคลื่อนไหวช้าลงหรือกระสับกระส่ายจนสังเกตเห็นได้' },
  { id: 9, text: 'คิดถึงการทำร้ายตัวเองหรือคิดว่าตายไปจะดีกว่า' },
];

// English questions
const enQuestions = [
  { id: 1, text: 'Little interest or pleasure in doing things' },
  { id: 2, text: 'Feeling down, depressed, or hopeless' },
  { id: 3, text: 'Trouble falling/staying asleep or sleeping too much' },
  { id: 4, text: 'Feeling tired or having little energy' },
  { id: 5, text: 'Poor appetite or overeating' },
  { id: 6, text: 'Feeling bad about yourself – or that you are a failure or have let your family down' },
  { id: 7, text: 'Trouble concentrating on things' },
  { id: 8, text: 'Moving or speaking so slowly that other people could have noticed, or being so fidgety/restless' },
  { id: 9, text: 'Thoughts that you would be better off dead or of hurting yourself' },
];

const choicesTh = [
  { value: 0, label: 'ไม่มีเลย' },
  { value: 1, label: 'มีบางวันหรือเป็นบางครั้ง' },
  { value: 2, label: 'มีค่อนข้างบ่อย' },
  { value: 3, label: 'มีเกือบทุกวัน' },
];

const choicesEn = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const fadeSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

function getSeverity(total, lang) {
  if (lang === 'th') {
    if (total <= 4) return { level: 'ปกติ', color: 'text-green-700 bg-green-50' };
    if (total <= 9) return { level: 'เล็กน้อย', color: 'text-yellow-700 bg-yellow-50' };
    if (total <= 14) return { level: 'ปานกลาง', color: 'text-amber-700 bg-amber-50' };
    if (total <= 19) return { level: 'ค่อนข้างรุนแรง', color: 'text-orange-700 bg-orange-50' };
    return { level: 'รุนแรง', color: 'text-red-700 bg-red-50' };
  }
  if (total <= 4) return { level: 'None‑minimal', color: 'text-green-700 bg-green-50' };
  if (total <= 9) return { level: 'Mild', color: 'text-yellow-700 bg-yellow-50' };
  if (total <= 14) return { level: 'Moderate', color: 'text-amber-700 bg-amber-50' };
  if (total <= 19) return { level: 'Moderately severe', color: 'text-orange-700 bg-orange-50' };
  return { level: 'Severe', color: 'text-red-700 bg-red-50' };
}

export default function PHQ9() {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = location.state?.lang || 'th';
  const questions = lang === 'th' ? thQuestions : enQuestions;
  const choices = lang === 'th' ? choicesTh : choicesEn;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(new Array(9).fill(null));
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalQuestions = 9;
  const progress = ((currentStep) / totalQuestions) * 100;

  const handleSelect = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);
  };

  const goNext = () => {
    if (answers[currentStep] === null) return;
    if (currentStep < totalQuestions - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) return;
    setLoading(true);
    const total = answers.reduce((a, b) => a + b, 0);
    const severity = getSeverity(total, lang);
    try {
      const response = await axios.post(`${API_BASE}/phq9`, { answers });
      const prediction = response.data;
      navigate('/results', { state: { prediction, formData: { phq9_answers: answers } } });
    } catch (err) {
      console.error('PHQ9 submission failed:', err);
      alert(lang === 'th' ? 'ไม่สามารถส่งข้อมูลได้ ใช้ผลลัพธ์ในเครื่อง' : 'Submission failed, using offline scoring.');
      const prediction = {
        phq9_total: total,
        phq9_severity: severity.level,
        burnout_level: null,
        seeks_mental_health_support_score: null,
        seeks_mental_health_support: null,
        job_change_intention_score: null,
        job_change_intention: null,
        warnings: ['Backend not available – local scoring only.'],
      };
      navigate('/results', { state: { prediction, formData: { phq9_answers: answers } } });
    } finally {
      setLoading(false);
    }
  };

  const q = questions[currentStep];
  const isLast = currentStep === totalQuestions - 1;
  const canProceed = answers[currentStep] !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>{lang === 'th' ? 'คำถามที่' : 'Question'} {currentStep + 1} {lang === 'th' ? 'จาก' : 'of'} {totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
            <motion.div
              className="bg-stone-800 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm min-h-[300px] flex flex-col justify-between">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={fadeSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1"
            >
              <h2 className="text-lg md:text-xl font-serif font-semibold text-stone-800 mb-6">
                {q.text}
              </h2>
              <div className="space-y-3">
                {choices.map((choice) => (
                  <label
                    key={choice.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      answers[currentStep] === choice.value
                        ? 'bg-nurture-sand/80 border-stone-400 shadow-sm ring-1 ring-stone-300 scale-[1.01]'
                        : 'bg-white border-stone-200 hover:bg-nurture-sand/30 hover:shadow-sm hover:border-stone-300 hover:scale-[1.01]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentStep}`}
                      value={choice.value}
                      checked={answers[currentStep] === choice.value}
                      onChange={() => handleSelect(choice.value)}
                      className="hidden"
                    />
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        answers[currentStep] === choice.value
                          ? 'border-stone-600 bg-stone-600'
                          : 'border-stone-300 group-hover:border-stone-400'
                      }`}
                    >
                      {answers[currentStep] === choice.value && (
                        <span className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="text-stone-700">{choice.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-stone-100">
            {currentStep > 0 ? (
              <button onClick={goBack} className="px-4 py-2 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition">
                {lang === 'th' ? '← ย้อนกลับ' : '← Back'}
              </button>
            ) : (
              <div />
            )}
            {!isLast ? (
              <button
                onClick={goNext}
                disabled={!canProceed}
                className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${
                  canProceed ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                {lang === 'th' ? 'ถัดไป →' : 'Next →'}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed || loading}
                className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${
                  canProceed ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                {loading ? (lang === 'th' ? 'กำลังส่ง...' : 'Submitting...') : (lang === 'th' ? 'ดูผลลัพธ์' : 'View Results')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}