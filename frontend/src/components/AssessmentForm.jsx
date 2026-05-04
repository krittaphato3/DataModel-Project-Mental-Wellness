import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/* ---------- PHQ‑9 (Part 1) ---------- */
const phq9QuestionsTh = [
  'เบื่อ ไม่สนใจอะไรเลย',
  'รู้สึกหดหู่ เศร้า หรือสิ้นหวัง',
  'มีปัญหาในการนอนหลับ เช่น นอนไม่หลับหรือนอนมากเกินไป',
  'รู้สึกเหนื่อยล้าหรือไม่มีเรี่ยวแรง',
  'เบื่ออาหารหรือกินมากเกินไป',
  'รู้สึกไม่ดีกับตัวเอง คิดว่าตัวเองล้มเหลวหรือทำให้ครอบครัวผิดหวัง',
  'ขาดสมาธิในการทำสิ่งต่างๆ',
  'เคลื่อนไหวช้าลงหรือกระสับกระส่ายจนสังเกตเห็นได้',
  'คิดถึงการทำร้ายตัวเองหรือคิดว่าตายไปจะดีกว่า',
];
const phq9QuestionsEn = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling/staying asleep or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself – or that you are a failure or have let your family down',
  'Trouble concentrating on things',
  'Moving or speaking so slowly that other people could have noticed, or being so fidgety/restless',
  'Thoughts that you would be better off dead or of hurting yourself',
];

/* ---------- GAD‑7 (Part 2) ---------- */
const gad7QuestionsTh = [
  'รู้สึกตึงเครียด วิตกกังวล หรือกระวนกระวาย',
  'ไม่สามารถหยุดหรือควบคุมความกังวลได้',
  'กังวลมากเกินไปในเรื่องต่างๆ',
  'ทำตัวให้ผ่อนคลายได้ยาก',
  'รู้สึกกระสับกระส่ายจนไม่สามารถนั่งนิ่งๆ ได้',
  'กลายเป็นคนหงุดหงิดหรือรำคาญง่าย',
  'รู้สึกกลัวเหมือนกับว่าจะมีเรื่องร้ายแรงเกิดขึ้น',
];
const gad7QuestionsEn = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid as if something awful might happen',
];

/* ---------- Answer choices ---------- */
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

/* ---------- Severity helpers ---------- */
function phq9Severity(total, lang) {
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

function gad7Severity(total, lang) {
  if (lang === 'th') {
    if (total <= 4) return { level: 'ปกติ', color: 'text-green-700 bg-green-50' };
    if (total <= 9) return { level: 'เล็กน้อย', color: 'text-yellow-700 bg-yellow-50' };
    if (total <= 14) return { level: 'ปานกลาง', color: 'text-amber-700 bg-amber-50' };
    return { level: 'รุนแรง', color: 'text-red-700 bg-red-50' };
  }
  if (total <= 4) return { level: 'None‑minimal', color: 'text-green-700 bg-green-50' };
  if (total <= 9) return { level: 'Mild', color: 'text-yellow-700 bg-yellow-50' };
  if (total <= 14) return { level: 'Moderate', color: 'text-amber-700 bg-amber-50' };
  return { level: 'Severe', color: 'text-red-700 bg-red-50' };
}

/* ---------- Animation variants ---------- */
const fadeSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
};

const overlayText = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, delay: 0.15, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } },
};

export default function AssessmentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = location.state?.lang || 'th';

  /* ---- state ---- */
  const [phase, setPhase] = useState('part1-overlay');  // part1-overlay | part1 | part2-overlay | part2 | done
  const [currentStep, setCurrentStep] = useState(0);    // 0-based within current part
  const [phq9Answers, setPhq9Answers] = useState(new Array(9).fill(null));
  const [gad7Answers, setGad7Answers] = useState(new Array(7).fill(null));
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  /* overlay auto-dismiss */
  useEffect(() => {
    if (phase === 'part1-overlay' || phase === 'part2-overlay') {
      setShowOverlay(true);
      const t = setTimeout(() => {
        setShowOverlay(false);
        // after fade-out, advance to questions
        setTimeout(() => {
          setPhase(phase === 'part1-overlay' ? 'part1' : 'part2');
        }, 500);
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  /* ---- derived ---- */
  const isPart1 = phase === 'part1-overlay' || phase === 'part1';
  const questions = isPart1
    ? (lang === 'th' ? phq9QuestionsTh : phq9QuestionsEn)
    : (lang === 'th' ? gad7QuestionsTh : gad7QuestionsEn);
  const answers = isPart1 ? phq9Answers : gad7Answers;
  const totalSteps = questions.length;
  const progress = ((currentStep) / totalSteps) * 100;
  const q = questions[currentStep];
  const choices = lang === 'th' ? choicesTh : choicesEn;
  const isLastQ = currentStep === totalSteps - 1;
  const canProceed = answers[currentStep] !== null;

  /* ---- handlers ---- */
  const handleSelect = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    isPart1 ? setPhq9Answers(newAnswers) : setGad7Answers(newAnswers);
  };

  const goNext = () => {
    if (!canProceed) return;
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep((p) => p + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((p) => p - 1);
    }
  };

  const finishPart1 = () => {
    setCurrentStep(0);
    setPhase('part2-overlay');
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) return;
    setLoading(true);

    const phq9Total = phq9Answers.reduce((a, b) => a + b, 0);
    const gad7Total = gad7Answers.reduce((a, b) => a + b, 0);
    const phq9Sev = phq9Severity(phq9Total, lang);
    const gad7Sev = gad7Severity(gad7Total, lang);

    try {
      const response = await axios.post(`${API_BASE}/assess`, {
        phq9_answers: phq9Answers,
        gad7_answers: gad7Answers,
      });
      const prediction = response.data;
      navigate('/results', {
        state: {
          prediction,
          formData: { phq9_answers: phq9Answers, gad7_answers: gad7Answers },
        },
      });
    } catch (err) {
      console.error('Assessment submission failed:', err);
      alert(lang === 'th' ? 'ไม่สามารถส่งข้อมูลได้ ใช้ผลลัพธ์ในเครื่อง' : 'Submission failed, using offline scoring.');
      const prediction = {
        phq9_total: phq9Total,
        phq9_severity: phq9Sev.level,
        gad7_total: gad7Total,
        gad7_severity: gad7Sev.level,
        burnout_level: null,
        seeks_mental_health_support_score: null,
        seeks_mental_health_support: null,
        job_change_intention_score: null,
        job_change_intention: null,
        warnings: ['Backend not available – using local scoring only.'],
      };
      navigate('/results', {
        state: { prediction, formData: { phq9_answers: phq9Answers, gad7_answers: gad7Answers } },
      });
    } finally {
      setLoading(false);
    }
  };

  /* ==================== RENDER ==================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand py-8 px-4 relative">
      {/* ---- Part overlay ---- */}
      <AnimatePresence>
        {showOverlay && (phase === 'part1-overlay' || phase === 'part2-overlay') && (
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 z-50 flex items-center justify-center bg-nurture-cream/60 backdrop-blur-sm"
          >
            <motion.div variants={overlayText} initial="hidden" animate="visible" exit="exit" className="text-center">
              <div className="text-5xl md:text-6xl font-serif font-bold text-stone-800 mb-4">
                {phase === 'part1-overlay' ? 'Part 1' : 'Part 2'}
              </div>
              <div className="text-lg text-stone-500">
                {phase === 'part1-overlay'
                  ? (lang === 'th' ? 'แบบประเมินภาวะซึมเศร้า (PHQ‑9)' : 'Depression Screening (PHQ‑9)')
                  : (lang === 'th' ? 'แบบประเมินความวิตกกังวล (GAD‑7)' : 'Anxiety Screening (GAD‑7)')}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Question card ---- */}
      <div className="max-w-lg mx-auto relative z-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>
              {isPart1 ? (lang === 'th' ? 'ส่วนที่ 1 · PHQ‑9' : 'Part 1 · PHQ‑9') : (lang === 'th' ? 'ส่วนที่ 2 · GAD‑7' : 'Part 2 · GAD‑7')}
              &nbsp;·&nbsp;
              {lang === 'th' ? 'คำถามที่' : 'Question'} {currentStep + 1} {lang === 'th' ? 'จาก' : 'of'} {totalSteps}
            </span>
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
              key={`${phase}-${currentStep}`}
              custom={direction}
              variants={fadeSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1"
            >
              <h2 className="text-lg md:text-xl font-serif font-semibold text-stone-800 mb-6">
                {q}
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
                      name={`q-${phase}-${currentStep}`}
                      value={choice.value}
                      checked={answers[currentStep] === choice.value}
                      onChange={() => handleSelect(choice.value)}
                      className="hidden"
                    />
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        answers[currentStep] === choice.value
                          ? 'border-stone-600 bg-stone-600'
                          : 'border-stone-300'
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
            {!isLastQ ? (
              <button
                onClick={goNext}
                disabled={!canProceed}
                className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${
                  canProceed ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                {lang === 'th' ? 'ถัดไป →' : 'Next →'}
              </button>
            ) : isPart1 ? (
              /* last question of Part 1 → go to Part 2 */
              <button
                onClick={finishPart1}
                disabled={!canProceed}
                className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${
                  canProceed ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                {lang === 'th' ? 'ส่วนที่ 2 →' : 'Part 2 →'}
              </button>
            ) : (
              /* last question of Part 2 → submit */
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