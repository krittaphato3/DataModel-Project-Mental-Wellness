import React from 'react';
import Recommendations from './Recommendations';

export default function ResultsDisplay({ prediction, formData }) {
  const { burnout_score, stress_level, anxiety_score, depression_score, risk_category } = prediction;

  const getRiskColor = (risk) => {
    if (risk === "High") return "text-red-700 bg-red-50 border-red-200";
    if (risk === "Medium") return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-green-700 bg-green-50 border-green-200";
  };

  const metrics = [
    { label: "Burnout", value: burnout_score, color: "bg-[#2b5f74]" },
    { label: "Stress", value: stress_level, color: "bg-[#4b6b7c]" },
    { label: "Anxiety", value: anxiety_score, color: "bg-[#628198]" },
    { label: "Depression", value: depression_score, color: "bg-[#859eae]" },
  ];

  return (
    <div className="border-t border-gray-100 p-6 md:p-8 bg-[#f9fbfd]">
      <h2 className="text-xl font-semibold text-[#1e3b4a] mb-4">📊 Your Assessment Results</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs uppercase text-secondary tracking-wide">{m.label}</div>
            <div className="text-2xl font-bold text-[#1f5068] mt-1">{m.value}<span className="text-sm">/10</span></div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
              <div className={`${m.color} h-1.5 rounded-full`} style={{ width: `${(m.value / 10) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getRiskColor(risk_category)} border mb-6`}>
        <span className="font-medium">Risk Category:</span>
        <span className="font-bold">{risk_category}</span>
      </div>

      <Recommendations prediction={prediction} formData={formData} />
    </div>
  );
}