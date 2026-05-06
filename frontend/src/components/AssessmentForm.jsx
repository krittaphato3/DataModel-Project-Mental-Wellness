import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper to scroll instantly to top (works with Lenis or native)
const scrollToTop = () => {
  if (window.lenis) {
    window.lenis.scrollTo(0, 0, { immediate: true });
  } else {
    window.scrollTo(0, 0);
  }
};

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

/* ---------- Additional fields configuration ---------- */
const fieldConfig = {
  stress_score: { type: 'slider', min: 0, max: 10, step: 0.5, labelTh: 'คะแนนความเครียด', labelEn: 'Stress score', placeholder: '0-10' },
  poor_balance_high_stress: { type: 'slider', min: 0, max: 10, step: 0.5, labelTh: 'ภาระงาน/เครียดสูง', labelEn: 'Poor balance / high stress', placeholder: '0-10' },
  job_satisfaction_score: { type: 'slider', min: 0, max: 10, step: 0.5, labelTh: 'ความพึงพอใจในงาน', labelEn: 'Job satisfaction', placeholder: '0-10' },
  manager_support_score: { type: 'slider', min: 0, max: 10, step: 0.5, labelTh: 'การสนับสนุนจากหัวหน้า', labelEn: 'Manager support', placeholder: '0-10' },
  autonomy_score: { type: 'slider', min: 0, max: 10, step: 0.5, labelTh: 'ความเป็นอิสระในงาน', labelEn: 'Autonomy', placeholder: '0-10' },
  meetings_per_day: { type: 'number', min: 0, max: 20, step: 0.5, labelTh: 'ประชุมต่อวัน', labelEn: 'Meetings per day', placeholder: '0-20' },
  work_hours_per_week: { type: 'number', min: 0, max: 120, step: 1, labelTh: 'ชั่วโมงทำงาน/สัปดาห์', labelEn: 'Work hours/week', placeholder: '0-120' },
  deadline_pressure_score: { type: 'slider', min: 0, max: 10, step: 0.5, labelTh: 'แรงกดดันจากเส้นตาย', labelEn: 'Deadline pressure', placeholder: '0-10' },
  work_life_balance_score: { type: 'slider', min: 0, max: 10, step: 0.5, labelTh: 'สมดุลชีวิต-งาน', labelEn: 'Work-life balance', placeholder: '0-10' },
  sleep_hours_per_night: { type: 'number', min: 0, max: 24, step: 0.5, labelTh: 'ชั่วโมงนอน/คืน', labelEn: 'Sleep hours/night', placeholder: '0-24' },
  exercise_days_per_week: { type: 'number', min: 0, max: 7, step: 1, labelTh: 'วันออกกำลังกาย/สัปดาห์', labelEn: 'Exercise days/week', placeholder: '0-7' },
  vacation_days_taken: { type: 'number', min: 0, max: 365, step: 1, labelTh: 'วันลาพักร้อนที่ใช้', labelEn: 'Vacation days taken', placeholder: '0-365' },
  social_support_score: { type: 'slider', min: 0, max: 10, step: 0.5, labelTh: 'การสนับสนุนทางสังคม', labelEn: 'Social support', placeholder: '0-10' },
  therapy_access: { type: 'select', options: ['No', 'Yes'], labelTh: 'เข้าถึงการบำบัด', labelEn: 'Therapy access' },
  salary_usd: { type: 'number', min: 0, max: Infinity, step: 1000, labelTh: 'เงินเดือน (USD)', labelEn: 'Salary (USD)', placeholder: 'e.g. 85000' },
};

const subParts = [
  { key: 'mental', titleTh: 'สุขภาพจิตและความเครียด', titleEn: 'Mental Health & Psychological Measures', fields: ['stress_score', 'poor_balance_high_stress'] },
  { key: 'work', titleTh: 'สภาพแวดล้อมการทำงาน', titleEn: 'Work Environment & Job Conditions', fields: ['job_satisfaction_score', 'manager_support_score', 'autonomy_score', 'meetings_per_day', 'work_hours_per_week', 'deadline_pressure_score', 'work_life_balance_score'] },
  { key: 'lifestyle', titleTh: 'พฤติกรรมการใช้ชีวิตและสุขภาพ', titleEn: 'Lifestyle & Health Behaviors', fields: ['sleep_hours_per_night', 'exercise_days_per_week', 'vacation_days_taken'] },
  { key: 'social', titleTh: 'ระบบสังคมและการสนับสนุน', titleEn: 'Social & Support Systems', fields: ['social_support_score', 'therapy_access'] },
  { key: 'economic', titleTh: 'เศรษฐกิจ / ค่าตอบแทน', titleEn: 'Economic / Compensation', fields: ['salary_usd'] },
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

  const [subPartIdx, setSubPartIdx] = useState(0);
  const [subCurrentStep, setSubCurrentStep] = useState(0);
  const [subDirection, setSubDirection] = useState(0);

  // Initialize additional fields: sliders default to 5, others to empty string
  const [additional, setAdditional] = useState(() => {
    const init = {};
    Object.keys(fieldConfig).forEach(k => {
      const cfg = fieldConfig[k];
      if (cfg.type === 'slider') {
        init[k] = 5;              // midpoint default
      } else if (cfg.type === 'select') {
        init[k] = 'No';
      } else {
        init[k] = '';
      }
    });
    return init;
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

  const questions = isPart1 ? (lang === 'th' ? phq9QuestionsTh : phq9QuestionsEn) : isPart2 ? (lang === 'th' ? gad7QuestionsTh : gad7QuestionsEn) : [];
  const answers = isPart1 ? phq9Answers : isPart2 ? gad7Answers : [];
  const totalSteps = questions.length;
  const progress = viewMode === 'single' ? ((currentStep) / totalSteps) * 100 : 100;
  const q = questions[currentStep];
  const choices = lang === 'th' ? choicesTh : choicesEn;
  const isLastQ = currentStep === totalSteps - 1;
  const canProceed = answers[currentStep] !== null;

  const allPart1Answered = phq9Answers.every(a => a !== null);
  const allPart2Answered = gad7Answers.every(a => a !== null);

  const currentSubPart = subParts[subPartIdx];
  const currentFields = currentSubPart.fields;
  const isSubSingle = viewMode === 'single';
  const totalSubSteps = currentFields.length;
  const subProgress = isSubSingle ? ((subCurrentStep) / totalSubSteps) * 100 : 100;

  const isValidField = (fieldName) => {
    const val = additional[fieldName];
    const cfg = fieldConfig[fieldName];
    if (!cfg) return true;
    if (cfg.type === 'select') return val !== '';
    if (val === '' || val === null) return false;
    const num = Number(val);
    if (isNaN(num)) return false;
    if (cfg.max === Infinity) return num >= cfg.min;
    return num >= cfg.min && num <= cfg.max;
  };

  const allSubFieldsValid = currentFields.every(f => isValidField(f));
  const allPart3Valid = Object.keys(fieldConfig).every(f => isValidField(f));

  const handleSelect = (value, index = currentStep) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    isPart1 ? setPhq9Answers(newAnswers) : setGad7Answers(newAnswers);
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
    scrollToTop();
    setShowOverlay(true);
    setCurrentStep(0);
    setPhase('part2-overlay');
    setEntranceOn(false);
  };

  const finishPart2 = () => {
    scrollToTop();
    setShowOverlay(true);
    setPhase('part3-overlay');
    setEntranceOn(false);
    setSubPartIdx(0);
    setSubCurrentStep(0);
  };

  const goSubNext = () => {
    if (!isValidField(currentFields[subCurrentStep])) return;
    if (subCurrentStep < totalSubSteps - 1) {
      setSubDirection(1);
      setSubCurrentStep(p => p + 1);
    }
  };

  const goSubBack = () => {
    if (subCurrentStep > 0) {
      setSubDirection(-1);
      setSubCurrentStep(p => p - 1);
    }
  };

  const finishSubPart = () => {
    scrollToTop();
    if (subPartIdx < subParts.length - 1) {
      setSubPartIdx(p => p + 1);
      setSubCurrentStep(0);
    }
  };

  const prevSubPart = () => {
    if (subPartIdx > 0) {
      scrollToTop();
      setSubPartIdx(p => p - 1);
      setSubCurrentStep(0);
    }
  };

  const handleAdditionalChange = (name, value) => {
    setAdditional(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!allPart3Valid || !allPart1Answered || !allPart2Answered) return;
    setLoading(true);
    const phq9Total = phq9Answers.reduce((a, b) => a + b, 0);
    const gad7Total = gad7Answers.reduce((a, b) => a + b, 0);
    const payload = { phq9_answers: phq9Answers, gad7_answers: gad7Answers, ...additional };
    try {
      const response = await axios.post(`${API_BASE}/assess`, payload);
      const prediction = response.data;
      navigate('/results', { state: { prediction, formData: payload } });
    } catch (err) {
      console.error('Submission failed:', err);
      alert(lang === 'th' ? 'ไม่สามารถส่งข้อมูลได้ กำลังใช้ผลลัพธ์จากเครื่อง' : 'Submission failed, using offline scoring.');
      const prediction = {
        phq9_total: phq9Total, phq9_severity: phq9Severity(phq9Total, lang).level,
        gad7_total: gad7Total, gad7_severity: gad7Severity(gad7Total, lang).level,
        burnout_level: null, seeks_mental_health_support_score: null, seeks_mental_health_support: null,
        job_change_intention_score: null, job_change_intention: null,
        warnings: ['Backend unavailable – local scoring only.'],
      };
      navigate('/results', { state: { prediction, formData: payload } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand py-8 px-4 relative">
      <AnimatePresence>
        {showOverlay && (phase === 'part1-overlay' || phase === 'part2-overlay' || phase === 'part3-overlay') && (
          <motion.div
            key="overlay"
            variants={overlayBg}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-nurture-cream/10 backdrop-blur-xl"
          >
            <motion.div variants={textContainer} initial="hidden" animate="visible" exit="exit" className="text-center">
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
                    : (lang === 'th' ? 'ข้อมูลเพิ่มเติมสำหรับการวิเคราะห์' : 'Additional Information')}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Part 3 ---- */}
      {isPart3 && (
        <div className="max-w-lg mx-auto relative z-10">
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>{lang === 'th' ? 'ส่วนที่ 3' : 'Part 3'} · {subPartIdx + 1}/{subParts.length}</span>
              <span>{lang === 'th' ? currentSubPart.titleTh : currentSubPart.titleEn}</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-stone-800 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((subPartIdx) / subParts.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="flex justify-end mb-3">
            <button
              onClick={() => setViewMode(v => v === 'single' ? 'all' : 'single')}
              className="px-3 py-1.5 text-xs rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 transition"
            >
              {viewMode === 'single' ? (lang === 'th' ? 'แสดงทั้งหมด' : 'Show all') : (lang === 'th' ? 'ทีละข้อ' : 'One by one')}
            </button>
          </div>

          {viewMode === 'single' ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm min-h-[300px] flex flex-col justify-between">
              <AnimatePresence mode="wait" custom={subDirection}>
                <motion.div
                  key={`sub-${subPartIdx}-${subCurrentStep}`}
                  custom={subDirection}
                  variants={fadeSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex-1"
                >
                  {(() => {
                    const fieldName = currentFields[subCurrentStep];
                    const cfg = fieldConfig[fieldName];
                    const val = additional[fieldName];
                    return (
                      <div className="flex flex-col h-full">
                        <label className="text-lg md:text-xl font-serif font-semibold text-stone-800 mb-4">
                          {lang === 'th' ? cfg.labelTh : cfg.labelEn}
                        </label>
                        {cfg.type === 'slider' ? (
                          <div className="flex flex-col items-center mt-4">
                            <div className="w-full flex items-center gap-4">
                              <span className="text-xs text-stone-500">{cfg.min}</span>
                              <input
                                type="range"
                                min={cfg.min}
                                max={cfg.max}
                                step={cfg.step}
                                value={val !== '' ? val : cfg.min}
                                onChange={e => handleAdditionalChange(fieldName, Number(e.target.value))}
                                className="flex-1 h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-stone-800"
                              />
                              <span className="text-xs text-stone-500">{cfg.max === Infinity ? '∞' : cfg.max}</span>
                            </div>
                            <div className="mt-2 text-2xl font-bold text-stone-800">
                              {val !== '' ? val : '—'}
                            </div>
                          </div>
                        ) : cfg.type === 'select' ? (
                          <select
                            value={val}
                            onChange={e => handleAdditionalChange(fieldName, e.target.value)}
                            className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-800 bg-white focus:ring-2 focus:ring-stone-500"
                          >
                            {cfg.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            type="number"
                            min={cfg.min}
                            max={cfg.max === Infinity ? undefined : cfg.max}
                            step={cfg.step}
                            placeholder={cfg.placeholder}
                            value={val}
                            onChange={e => handleAdditionalChange(fieldName, e.target.value)}
                            className={`w-full border rounded-xl px-4 py-3 text-stone-800 focus:ring-2 focus:ring-stone-500 ${!isValidField(fieldName) && val !== '' ? 'border-red-400 bg-red-50' : 'border-stone-300'}`}
                          />
                        )}
                        {!isValidField(fieldName) && val !== '' && (
                          <p className="text-xs text-red-600 mt-2">
                            {lang === 'th' ? `กรุณากรอกค่า ${cfg.min} ขึ้นไป` : `Please enter a value ${cfg.min} or greater.`}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8 pt-4 border-t border-stone-100">
                {subCurrentStep > 0 || subPartIdx > 0 ? (
                  <button
                    onClick={() => { if (subCurrentStep > 0) { goSubBack(); } else { prevSubPart(); } }}
                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition"
                  >
                    {lang === 'th' ? '← ย้อนกลับ' : '← Back'}
                  </button>
                ) : <div />}
                {subCurrentStep < totalSubSteps - 1 ? (
                  <button onClick={goSubNext} disabled={!isValidField(currentFields[subCurrentStep])}
                    className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${isValidField(currentFields[subCurrentStep]) ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                  >
                    {lang === 'th' ? 'ถัดไป →' : 'Next →'}
                  </button>
                ) : subPartIdx < subParts.length - 1 ? (
                  <button onClick={finishSubPart} disabled={!allSubFieldsValid}
                    className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allSubFieldsValid ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                  >
                    {lang === 'th' ? 'หมวดถัดไป →' : 'Next category →'}
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={!allPart3Valid || loading}
                    className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart3Valid ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                  >
                    {loading ? (lang === 'th' ? 'กำลังส่ง...' : 'Submitting...') : (lang === 'th' ? 'ดูผลลัพธ์' : 'View Results')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm">
              <h3 className="text-xl font-serif font-semibold text-stone-800 mb-6">
                {lang === 'th' ? currentSubPart.titleTh : currentSubPart.titleEn}
              </h3>
              <div className="space-y-5">
                {currentFields.map(field => {
                  const cfg = fieldConfig[field];
                  const val = additional[field];
                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        {lang === 'th' ? cfg.labelTh : cfg.labelEn}
                      </label>
                      {cfg.type === 'slider' ? (
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-stone-500">{cfg.min}</span>
                          <input
                            type="range"
                            min={cfg.min}
                            max={cfg.max}
                            step={cfg.step}
                            value={val !== '' ? val : cfg.min}
                            onChange={e => handleAdditionalChange(field, Number(e.target.value))}
                            className="flex-1 h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-stone-800"
                          />
                          <span className="text-xs text-stone-500">{cfg.max === Infinity ? '∞' : cfg.max}</span>
                          <span className="ml-2 font-bold text-stone-800 w-8 text-right">{val !== '' ? val : '—'}</span>
                        </div>
                      ) : cfg.type === 'select' ? (
                        <select
                          value={val}
                          onChange={e => handleAdditionalChange(field, e.target.value)}
                          className="w-full border border-stone-300 rounded-xl px-4 py-2 text-stone-800 bg-white focus:ring-2 focus:ring-stone-500"
                        >
                          {cfg.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type="number"
                          min={cfg.min}
                          max={cfg.max === Infinity ? undefined : cfg.max}
                          step={cfg.step}
                          placeholder={cfg.placeholder}
                          value={val}
                          onChange={e => handleAdditionalChange(field, e.target.value)}
                          className={`w-full border rounded-xl px-4 py-2 text-stone-800 focus:ring-2 focus:ring-stone-500 ${!isValidField(field) && val !== '' ? 'border-red-400 bg-red-50' : 'border-stone-300'}`}
                        />
                      )}
                      {!isValidField(field) && val !== '' && (
                        <p className="text-xs text-red-600 mt-1">
                          {lang === 'th' ? `กรุณากรอกค่า ${cfg.min} ขึ้นไป` : `Please enter a value ${cfg.min} or greater.`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-8 pt-4 border-t border-stone-100">
                {subPartIdx > 0 ? (
                  <button onClick={prevSubPart} className="px-4 py-2 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition">
                    {lang === 'th' ? '← ย้อนกลับ' : '← Back'}
                  </button>
                ) : <div />}
                {subPartIdx < subParts.length - 1 ? (
                  <button onClick={finishSubPart} disabled={!allSubFieldsValid}
                    className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allSubFieldsValid ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                  >
                    {lang === 'th' ? 'หมวดถัดไป →' : 'Next category →'}
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={!allPart3Valid || loading}
                    className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart3Valid ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                  >
                    {loading ? (lang === 'th' ? 'กำลังส่ง...' : 'Submitting...') : (lang === 'th' ? 'ดูผลลัพธ์' : 'View Results')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Part 1 & 2 ---- */}
      {(isPart1 || isPart2) && (
        <div className="max-w-lg mx-auto relative z-10">
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
              <motion.div className="bg-stone-800 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setViewMode(v => v === 'single' ? 'all' : 'single')}
              className="px-3 py-1.5 text-xs rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 transition"
            >
              {viewMode === 'single' ? (lang === 'th' ? 'แสดงทั้งหมด' : 'Show all') : (lang === 'th' ? 'ทีละข้อ' : 'One by one')}
            </button>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm min-h-[300px] flex flex-col justify-between">
            {viewMode === 'single' ? (
              <>
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div key={`${isPart1 ? 'p1' : 'p2'}-${currentStep}`} custom={direction} variants={fadeSlide} initial={entranceOn ? "initial" : false} animate="animate" exit="exit" className="flex-1">
                    <h2 className="text-lg md:text-xl font-serif font-semibold text-stone-800 mb-6">{q}</h2>
                    <div className="space-y-3">
                      {choices.map(choice => (
                        <label key={choice.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${answers[currentStep] === choice.value ? 'bg-nurture-sand/80 border-stone-400 shadow-sm ring-1 ring-stone-300 scale-[1.01]' : 'bg-white border-stone-200 hover:bg-nurture-sand/30 hover:shadow-sm hover:border-stone-300 hover:scale-[1.01]'}`}>
                          <input type="radio" name={`q-${phase}-${currentStep}`} value={choice.value} checked={answers[currentStep] === choice.value} onChange={() => handleSelect(choice.value)} className="hidden" />
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${answers[currentStep] === choice.value ? 'border-stone-600 bg-stone-600' : 'border-stone-300'}`}>
                            {answers[currentStep] === choice.value && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                          </span>
                          <span className="text-stone-700">{choice.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="flex justify-between mt-8 pt-4 border-t border-stone-100">
                  {currentStep > 0 ? (
                    <button onClick={goBack} className="px-4 py-2 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition">{lang === 'th' ? '← ย้อนกลับ' : '← Back'}</button>
                  ) : <div />}
                  {!isLastQ ? (
                    <button onClick={goNext} disabled={!canProceed} className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${canProceed ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>{lang === 'th' ? 'ถัดไป →' : 'Next →'}</button>
                  ) : isPart1 ? (
                    <button onClick={finishPart1} disabled={!allPart1Answered} className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart1Answered ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>{lang === 'th' ? 'ส่วนที่ 2 →' : 'Part 2 →'}</button>
                  ) : (
                    <button onClick={finishPart2} disabled={!allPart2Answered} className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart2Answered ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>{lang === 'th' ? 'ส่วนที่ 3 →' : 'Part 3 →'}</button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 pr-1">
                  {questions.map((question, idx) => (
                    <div key={idx}>
                      <h3 className="text-md font-serif font-semibold text-stone-800 mb-3">{idx + 1}. {question}</h3>
                      <div className="space-y-2">
                        {choices.map(choice => (
                          <label key={choice.value} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${answers[idx] === choice.value ? 'bg-nurture-sand/80 border-stone-400 shadow-sm ring-1 ring-stone-300 scale-[1.01]' : 'bg-white border-stone-200 hover:bg-nurture-sand/30 hover:shadow-sm hover:border-stone-300 hover:scale-[1.01]'}`}>
                            <input type="radio" name={`q-${phase}-${idx}`} value={choice.value} checked={answers[idx] === choice.value} onChange={() => handleSelect(choice.value, idx)} className="hidden" />
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${answers[idx] === choice.value ? 'border-stone-600 bg-stone-600' : 'border-stone-300'}`}>
                              {answers[idx] === choice.value && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
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
                    <button onClick={finishPart1} disabled={!allPart1Answered} className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart1Answered ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>{lang === 'th' ? 'ส่วนที่ 2 →' : 'Part 2 →'}</button>
                  ) : (
                    <button onClick={finishPart2} disabled={!allPart2Answered} className={`px-6 py-2.5 rounded-full font-medium text-sm shadow-md transition ${allPart2Answered ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>{lang === 'th' ? 'ส่วนที่ 3 →' : 'Part 3 →'}</button>
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