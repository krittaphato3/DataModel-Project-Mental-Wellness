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

const overlayBg = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } },
};

const textContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.25, delayChildren: 0.1 } },
  exit: {},
};

const textItem = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 80, damping: 14 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const part3Container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const part3Item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ---------- Additional fields for ML (Part 3) ---------- */
const additionalFields = [
  { name: 'stress_score', labelTh: 'คะแนนความเครียด', labelEn: 'Stress score', type: 'number', min: 0, max: 10, step: 0.5 },
  { name: 'poor_balance_high_stress', labelTh: 'Poor work‑life balance / high stress (0-10)', labelEn: 'Poor work‑life balance / high stress (0-10)', type: 'number', min: 0, max: 10, step: 0.5 },
  { name: 'job_satisfaction_score', labelTh: 'คะแนนความพึงพอใจในงาน', labelEn: 'Job satisfaction score', type: 'number', min: 0, max: 10, step: 0.5 },
  { name: 'manager_support_score', labelTh: 'คะแนนการสนับสนุนจากหัวหน้า', labelEn: 'Manager support score', type: 'number', min: 0, max: 10, step: 0.5 },
  { name: 'autonomy_score', labelTh: 'คะแนนความเป็นอิสระในงาน', labelEn: 'Autonomy score', type: 'number', min: 0, max: 10, step: 0.5 },
  { name: 'meetings_per_day', labelTh: 'จำนวนการประชุมต่อวัน', labelEn: 'Meetings per day', type: 'number', min: 0, max: 20, step: 0.5 },
  { name: 'work_hours_per_week', labelTh: 'ชั่วโมงทำงานต่อสัปดาห์', labelEn: 'Work hours per week', type: 'number', min: 0, max: 120, step: 1 },
  { name: 'deadline_pressure_score', labelTh: 'คะแนนความกดดันจากเส้นตาย', labelEn: 'Deadline pressure score', type: 'number', min: 0, max: 10, step: 0.5 },
  { name: 'work_life_balance_score', labelTh: 'คะแนนสมดุลชีวิตและการทำงาน', labelEn: 'Work‑life balance score', type: 'number', min: 0, max: 10, step: 0.5 },
  { name: 'sleep_hours_per_night', labelTh: 'ชั่วโมงนอนต่อคืน', labelEn: 'Sleep hours per night', type: 'number', min: 0, max: 24, step: 0.5 },
  { name: 'exercise_days_per_week', labelTh: 'จำนวนวันที่ออกกำลังกายต่อสัปดาห์', labelEn: 'Exercise days per week', type: 'number', min: 0, max: 7, step: 1 },
  { name: 'vacation_days_taken', labelTh: 'จำนวนวันลาพักร้อนที่ใช้ไป', labelEn: 'Vacation days taken', type: 'number', min: 0, max: 365, step: 1 },
  { name: 'social_support_score', labelTh: 'คะแนนการสนับสนุนทางสังคม', labelEn: 'Social support score', type: 'number', min: 0, max: 10, step: 0.5 },
  { name: 'therapy_access', labelTh: 'เข้าถึงการบำบัดหรือไม่', labelEn: 'Therapy access', type: 'select', options: ['No', 'Yes'] },
  { name: 'salary_usd', labelTh: 'เงินเดือน (USD)', labelEn: 'Salary (USD)', type: 'number', min: 0, max: 1000000, step: 1000 },
];

export default function AssessmentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = location.state?.lang || 'th';

  const [phase, setPhase] = useState('part1-overlay');
  const [currentStep, setCurrentStep] = useState(0);
  const [phq9Answers, setPhq9Answers] = useState(new Array(9).fill(null));
  const [gad7Answers, setGad7Answers] = useState(new Array(7).fill(null));
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [entranceOn, setEntranceOn] = useState(false);
  const [viewMode, setViewMode] = useState('single');

  const [additional, setAdditional] = useState(() => {
    const initial = {};
    additionalFields.forEach(f => {
      initial[f.name] = f.type === 'select' ? (f.options ? f.options[0] : '') : '';
    });
    return initial;
  });

  useEffect(() => {
    if (phase === 'part1-overlay' || phase === 'part2-overlay' || phase === 'part3-overlay') {
      setShowOverlay(true);
      const t = setTimeout(() => {
        setShowOverlay(false);
        setTimeout(() => {
          if (phase === 'part1-overlay') setPhase('part1');
          else if (phase === 'part2-overlay') setPhase('part2');
          else if (phase === 'part3-overlay') setPhase('part3');
        }, 500);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const isPart1 = phase === 'part1-overlay' || phase === 'part1';
  const isPart2 = phase === 'part2-overlay' || phase === 'part2';
  const isPart3 = phase === 'part3-overlay' || phase === 'part3';
  const questions = isPart1
    ? (lang === 'th' ? phq9QuestionsTh : phq9QuestionsEn)
    : isPart2
    ? (lang === 'th' ? gad7QuestionsTh : gad7QuestionsEn)
    : [];
  const answers = isPart1 ? phq9Answers : isPart2 ? gad7Answers : [];
  const totalSteps = questions.length;
  const progress = viewMode === 'single' ? ((currentStep) / totalSteps) * 100 : 100;
  const q = questions[currentStep];
  const choices = lang === 'th' ? choicesTh : choicesEn;
  const isLastQ = currentStep === totalSteps - 1;
  const canProceed = answers[currentStep] !== null;

  const allPart1Answered = phq9Answers.every(a => a !== null);
  const allPart2Answered = gad7Answers.every(a => a !== null);
  const allPart3Answered = additionalFields.every(f => {
    const val = additional[f.name];
    if (f.type === 'number') return val !== '' && val !== null;
    if (f.type === 'select') return val !== '';
    return true;
  });
  const allAnswered = allPart1Answered && allPart2Answered && allPart3Answered;

  const handleSelect = (value, index = currentStep) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    isPart1 ? setPhq9Answers(newAnswers) : setGad7Answers(newAnswers);
  };

  const handleAdditionalChange = (name, value) => {
    setAdditional(prev => ({ ...prev, [name]: value }));
  };

  const goNext = () => {
    if (!canProceed) return;
    setEntranceOn(true);
    setDirection(1);
    setCurrentStep((p) => p + 1);
  };

  const goBack = () => {
    if (currentStep > 0) {
      setEntranceOn(true);
      setDirection(-1);
      setCurrentStep((p) => p - 1);
    }
  };

  const finishPart1 = () => {
    window.scrollTo(0, 0);
    setShowOverlay(true);
    setCurrentStep(0);
    setPhase('part2-overlay');
    setEntranceOn(false);
  };

  const finishPart2 = () => {
    window.scrollTo(0, 0);
    setShowOverlay(true);
    setPhase('part3-overlay');
    setEntranceOn(false);
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setLoading(true);
    const phq9Total = phq9Answers.reduce((a, b) => a + b, 0);
    const gad7Total = gad7Answers.reduce((a, b) => a + b, 0);
    const phq9Sev = phq9Severity(phq9Total, lang);
    const gad7Sev = gad7Severity(gad7Total, lang);

    const payload = {
      phq9_answers: phq9Answers,
      gad7_answers: gad7Answers,
      ...additional,
    };

    try {
      const response = await axios.post(`${API_BASE}/assess`, payload);
      const prediction = response.data;
      navigate('/results', { state: { prediction, formData: { phq9_answers: phq9Answers, gad7_answers: gad7Answers, ...additional } } });
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
      navigate('/results', { state: { prediction, formData: { phq9_answers: phq9Answers, gad7_answers: gad7Answers, ...additional } } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand py-8 px-4 relative">
      {/* ---- Overlay ---- */}
      <AnimatePresence>
        {showOverlay && (phase === 'part1-overlay' || phase === 'part2-overlay' || phase === 'part3-overlay') && (
          <motion.div
            key="overlay"
            variants={overlayBg}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 z-50 flex items-center justify-center bg-nurture-cream/10 backdrop-blur-xl"
          >
            <motion.div
              variants={textContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center"
            >
              <motion.div variants={textItem} className="mb-2">
                <h2 className="text-5xl md:text-6xl font-serif font-bold text-stone-800">
                  {phase === 'part1-overlay' ? 'Part 1' : phase === 'part2-overlay' ? 'Part 2' : 'Part 3'}
                </h2>
              </motion.div>
              <motion.div variants={textItem}>
                <p className="text-lg text-stone-500">
                  {phase === 'part1-overlay'
                    ? (lang === 'th' ? 'แบบประเมินภาวะซึมเศร้า (PHQ‑9)' : 'Depression Screening (PHQ‑9)')
                    : phase === 'part2-overlay'
                    ? (lang === 'th' ? 'แบบประเมินความวิตกกังวล (GAD‑7)' : 'Anxiety Screening (GAD‑7)')
                    : (lang === 'th' ? 'ข้อมูลเพิ่มเติม' : 'Additional Information')}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Part 3 : Additional fields ---- */}
      {isPart3 && (
        <motion.div
          className="max-w-lg mx-auto relative z-10"
          variants={part3Container}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={part3Item} className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
              {lang === 'th' ? 'ข้อมูลเพิ่มเติมสำหรับการวิเคราะห์' : 'Additional Information for Analysis'}
            </h2>
            <p className="text-sm text-stone-500">
              {lang === 'th' ? 'กรุณากรอกข้อมูลต่อไปนี้ให้ครบถ้วน' : 'Please fill in the following details.'}
            </p>
          </motion.div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm">
            <div className="space-y-5">
              {additionalFields.map((field, idx) => (
                <motion.div key={field.name} variants={part3Item} custom={idx}>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {lang === 'th' ? field.labelTh : field.labelEn}
                  </label>
                  {field.type === 'number' ? (
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={additional[field.name]}
                      onChange={e => handleAdditionalChange(field.name, e.target.value)}
                      className="w-full border border-stone-300 rounded-xl px-4 py-2 text-stone-800 focus:ring-2 focus:ring-stone-500 transition-all"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={additional[field.name]}
                      onChange={e => handleAdditionalChange(field.name, e.target.value)}
                      className="w-full border border-stone-300 rounded-xl px-4 py-2 text-stone-800 bg-white focus:ring-2 focus:ring-stone-500 transition-all"
                    >
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div variants={part3Item} className="flex justify-end mt-6">
            <button
              onClick={handleSubmit}
              disabled={!allPart3Answered || loading}
              className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${
                allPart3Answered ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {loading ? (lang === 'th' ? 'กำลังส่ง...' : 'Submitting...') : (lang === 'th' ? 'ดูผลลัพธ์' : 'View Results')}
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* ---- Part 1 & 2 (question cards) ---- */}
      {(isPart1 || isPart2) && (
        <div className="max-w-lg mx-auto relative z-10">
          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span>
                {isPart1 ? (lang === 'th' ? 'ส่วนที่ 1 · PHQ‑9' : 'Part 1 · PHQ‑9') : (lang === 'th' ? 'ส่วนที่ 2 · GAD‑7' : 'Part 2 · GAD‑7')}
                &nbsp;·&nbsp;
                {viewMode === 'single'
                  ? `${lang === 'th' ? 'คำถามที่' : 'Question'} ${currentStep + 1} ${lang === 'th' ? 'จาก' : 'of'} ${totalSteps}`
                  : `${totalSteps} ${lang === 'th' ? 'คำถาม' : 'questions'}`
                }
              </span>
              {viewMode === 'single' && <span>{Math.round(progress)}%</span>}
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

          {/* Toggle – below the progress bar, right-aligned */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setViewMode(v => v === 'single' ? 'all' : 'single')}
              className="px-3 py-1.5 text-xs rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 transition"
            >
              {viewMode === 'single'
                ? (lang === 'th' ? 'แสดงทั้งหมด' : 'Show all')
                : (lang === 'th' ? 'ทีละข้อ' : 'One by one')
              }
            </button>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm min-h-[300px] flex flex-col justify-between">
            {viewMode === 'single' ? (
              <>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={`${isPart1 ? 'p1' : 'p2'}-${currentStep}`}
                    custom={direction}
                    variants={fadeSlide}
                    initial={entranceOn ? "initial" : false}
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

                <div className="flex justify-between mt-8 pt-4 border-t border-stone-100">
                  {currentStep > 0 ? (
                    <button onClick={goBack} className="px-4 py-2 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition">
                      {lang === 'th' ? '← ย้อนกลับ' : '← Back'}
                    </button>
                  ) : <div />}
                  {!isLastQ ? (
                    <button onClick={goNext} disabled={!canProceed}
                      className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${canProceed ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
                      {lang === 'th' ? 'ถัดไป →' : 'Next →'}
                    </button>
                  ) : isPart1 ? (
                    <button onClick={finishPart1} disabled={!allPart1Answered}
                      className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart1Answered ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
                      {lang === 'th' ? 'ส่วนที่ 2 →' : 'Part 2 →'}
                    </button>
                  ) : (
                    <button onClick={finishPart2} disabled={!allPart2Answered}
                      className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart2Answered ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
                      {lang === 'th' ? 'ส่วนที่ 3 →' : 'Part 3 →'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 pr-1">
                  {questions.map((question, idx) => (
                    <div key={idx}>
                      <h3 className="text-md font-serif font-semibold text-stone-800 mb-3">
                        {idx + 1}. {question}
                      </h3>
                      <div className="space-y-2">
                        {choices.map((choice) => (
                          <label
                            key={choice.value}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                              answers[idx] === choice.value
                                ? 'bg-nurture-sand/80 border-stone-400 shadow-sm ring-1 ring-stone-300 scale-[1.01]'
                                : 'bg-white border-stone-200 hover:bg-nurture-sand/30 hover:shadow-sm hover:border-stone-300 hover:scale-[1.01]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${phase}-${idx}`}
                              value={choice.value}
                              checked={answers[idx] === choice.value}
                              onChange={() => handleSelect(choice.value, idx)}
                              className="hidden"
                            />
                            <span
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                answers[idx] === choice.value
                                  ? 'border-stone-600 bg-stone-600'
                                  : 'border-stone-300'
                              }`}
                            >
                              {answers[idx] === choice.value && (
                                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                              )}
                            </span>
                            <span className="text-stone-700 text-sm">{choice.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-8 pt-4 border-t border-stone-100">
                  {isPart1 ? (
                    <button onClick={finishPart1} disabled={!allPart1Answered}
                      className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart1Answered ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
                      {lang === 'th' ? 'ส่วนที่ 2 →' : 'Part 2 →'}
                    </button>
                  ) : (
                    <button onClick={finishPart2} disabled={!allPart2Answered}
                      className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart2Answered ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
                      {lang === 'th' ? 'ส่วนที่ 3 →' : 'Part 3 →'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}