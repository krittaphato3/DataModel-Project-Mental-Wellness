import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { predict } from '../api';

const fadeSlide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } }
};

const steps = [
  { field: 'weekly_work_hours', label: 'How many hours do you work per week?', type: 'number', min: 0, max: 120, placeholder: '40' },
  { field: 'work_location', label: 'What is your primary work location?', type: 'select', options: ['Remote', 'On-site', 'Hybrid'] },
  { field: 'sleep_hours', label: 'On average, how many hours do you sleep per night?', type: 'number', min: 0, max: 24, placeholder: '7', step: '0.5' },
  { field: 'meeting_hours_per_week', label: 'How many hours per week do you spend in meetings?', type: 'number', min: 0, max: 80, placeholder: '8' },
  { field: 'toxic_workplace_exposure', label: 'How often do you experience a toxic workplace? (0 = never, 10 = constantly)', type: 'range', min: 0, max: 10, step: 0.5, defaultValue: 4 },
  { field: 'manager_support', label: 'How supportive is your manager? (0 = not at all, 10 = extremely)', type: 'range', min: 0, max: 10, step: 0.5, defaultValue: 6 },
  { field: 'years_of_experience', label: 'How many years of professional experience do you have?', type: 'number', min: 0, max: 50, placeholder: '5' },
  { field: 'age', label: 'What is your age?', type: 'number', min: 18, max: 100, placeholder: '30' },
  { field: 'job_role', label: 'What is your current job role?', type: 'select', options: [
    'Software Engineer', 'Data Scientist', 'Product Manager',
    'DevOps Engineer', 'QA Engineer', 'Tech Lead', 'UX Designer', 'Other'
  ]},
  { field: 'review', label: 'Review your answers', type: 'review' }
];

export default function AssessmentForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    weekly_work_hours: '',
    work_location: 'Remote',
    sleep_hours: '',
    meeting_hours_per_week: '',
    toxic_workplace_exposure: 4,
    manager_support: 6,
    years_of_experience: '',
    age: '',
    job_role: 'Software Engineer'
  });
  const [customRole, setCustomRole] = useState(''); // for "Other" job role
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalInputSteps = steps.length - 1;
  const progress = ((currentStep) / totalInputSteps) * 100;
  const step = steps[currentStep];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'job_role' && value !== 'Other') {
      setCustomRole(''); // reset custom role when switching away
    }
  };

  const goNext = () => {
    if (step.type !== 'review' && currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  // Validation: returns array of missing field labels
  const getMissingFields = () => {
    const missing = [];
    steps.forEach(s => {
      if (s.type === 'review') return;
      const val = formData[s.field];
      if (s.type === 'number') {
        if (val === '' || val === null || val === undefined) {
          missing.push(s.label);
        }
      } else if (s.field === 'job_role') {
        if (val === 'Other') {
          if (!customRole.trim()) {
            missing.push('Job role (Other) – please specify');
          }
        }
      }
    });
    return missing;
  };

  const missingFields = currentStep === steps.length - 1 ? getMissingFields() : [];
  const canSubmit = missingFields.length === 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    const payload = {
      weekly_work_hours: Number(formData.weekly_work_hours) || 40,
      work_location: formData.work_location,
      sleep_hours: Number(formData.sleep_hours) || 7,
      toxic_workplace_exposure: Number(formData.toxic_workplace_exposure),
      meeting_hours_per_week: Number(formData.meeting_hours_per_week) || 0,
      manager_support: Number(formData.manager_support),
      years_of_experience: Number(formData.years_of_experience) || 0,
      age: Number(formData.age) || 30,
      job_role: formData.job_role === 'Other' ? customRole.trim() : formData.job_role
    };

    let prediction;
    try {
      prediction = await predict(payload);
    } catch (err) {
      console.error('Prediction failed:', err);
      prediction = {
        offline: true,
        burnout_score: null,
        stress_level: null,
        anxiety_score: null,
        depression_score: null,
        risk_category: null
      };
    } finally {
      setLoading(false);
      navigate('/results', { state: { prediction, formData: payload } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nurture-cream via-white to-nurture-sand py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Question {currentStep + 1} of {totalInputSteps}</span>
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
              {step.type === 'review' ? (
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-800 mb-4">Almost done!</h2>
                  <p className="text-sm text-stone-600 mb-4">Please review your answers below.</p>

                  {/* Missing fields warning */}
                  {missingFields.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700"
                    >
                      <p className="font-medium mb-2">Please complete all required fields:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {missingFields.map((field, i) => (
                          <li key={i}>{field}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  <div className="space-y-3 text-sm">
                    {steps.filter(s => s.type !== 'review').map(s => (
                      <div key={s.field} className="flex justify-between border-b border-stone-100 pb-2">
                        <span className="text-stone-600">{s.label}</span>
                        <span className="font-medium text-stone-800">
                          {s.field === 'job_role' && formData.job_role === 'Other'
                            ? customRole || '-'
                            : s.type === 'range'
                              ? formData[s.field]
                              : formData[s.field] || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-center text-xs text-stone-400 italic">
                    All responses are anonymous.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg md:text-xl font-serif font-semibold text-stone-800 mb-6">
                    {step.label}
                  </h2>
                  {step.type === 'number' && (
                    <input
                      type="number"
                      value={formData[step.field]}
                      onChange={e => handleChange(step.field, e.target.value)}
                      placeholder={step.placeholder}
                      min={step.min}
                      max={step.max}
                      step={step.step || 1}
                      className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-800 focus:ring-2 focus:ring-stone-500"
                      autoFocus
                    />
                  )}
                  {step.type === 'select' && (
                    <div>
                      <select
                        value={formData[step.field]}
                        onChange={e => handleChange(step.field, e.target.value)}
                        className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-800 bg-white focus:ring-2 focus:ring-stone-500"
                        autoFocus
                      >
                        {step.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      {/* Dynamic "Other" input */}
                      <AnimatePresence>
                        {step.field === 'job_role' && formData.job_role === 'Other' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <input
                              type="text"
                              value={customRole}
                              onChange={e => setCustomRole(e.target.value)}
                              placeholder="Please specify your job role"
                              className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-800 focus:ring-2 focus:ring-stone-500"
                              autoFocus
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {step.type === 'range' && (
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center gap-4">
                        <span className="text-xs text-stone-500">{step.min}</span>
                        <input
                          type="range"
                          min={step.min}
                          max={step.max}
                          step={step.step}
                          value={formData[step.field]}
                          onChange={e => handleChange(step.field, Number(e.target.value))}
                          className="flex-1 h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-stone-800"
                        />
                        <span className="text-xs text-stone-500">{step.max}</span>
                      </div>
                      <div className="mt-2 text-lg font-bold text-stone-800">
                        {formData[step.field]}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t border-stone-100">
            {currentStep > 0 && (
              <button
                onClick={goBack}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-full text-sm font-medium hover:bg-white/60 transition"
              >
                ← Back
              </button>
            )}
            <div className="flex-1" />
            {step.type === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="px-6 py-2.5 bg-stone-800 text-white rounded-full font-medium text-sm shadow-md hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Analyzing...' : 'Get My Results'}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="px-6 py-2.5 bg-stone-800 text-white rounded-full font-medium text-sm shadow-md hover:bg-stone-700 transition"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}