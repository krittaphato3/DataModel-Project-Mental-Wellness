import React from 'react';

export default function Recommendations({ prediction, formData }) {
  const { burnout_score, stress_level, anxiety_score, depression_score } = prediction;
  const { sleep_hours, toxic_workplace_exposure, weekly_work_hours, manager_support } = formData;

  const tips = [];

  if (burnout_score > 7) tips.push("🔥 High burnout risk: consider reducing work hours or taking short breaks throughout the day.");
  if (burnout_score > 5) tips.push("⚠️ Moderate burnout: try to set clearer boundaries between work and personal time.");
  if (stress_level > 7) tips.push("😫 Elevated stress: practice 5-minute mindfulness or deep breathing exercises.");
  if (anxiety_score > 6) tips.push("😰 Anxiety signs detected: limit meeting overload and consider a digital detox.");
  if (depression_score > 6) tips.push("😔 Low mood indicators: talk to a trusted colleague or professional.");
  if (sleep_hours < 6) tips.push("😴 Poor sleep hygiene: aim for 7-8 hours, avoid screens before bed.");
  if (toxic_workplace_exposure > 7) tips.push("⚠️ Toxic environment exposure: speak with HR or a mentor about workplace culture.");
  if (weekly_work_hours > 50) tips.push("⏰ Long hours: schedule regular 15-min breaks every 2 hours.");
  if (manager_support < 4) tips.push("👥 Low manager support: consider requesting a 1:1 to discuss workload.");
  if (tips.length === 0) tips.push("✅ Your profile looks balanced. Keep up good habits and monitor changes.");

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h3 className="font-semibold text-gray-700 mb-3">📌 Personalized Recommendations</h3>
      <ul className="space-y-2">
        {tips.map((tip, idx) => (
          <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
            <span className="text-primary">•</span> {tip}
          </li>
        ))}
      </ul>
      <p className="text-xs text-secondary mt-4 italic">
        *These suggestions are based on data-driven patterns. Consult a professional for medical advice.
      </p>
    </div>
  );
}