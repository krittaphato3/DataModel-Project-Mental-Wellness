import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const questions = [
  "รู้สึกกระสับกระส่าย วิตกกังวล หรือวุ่นวายใจ",
  "ไม่สามารถหยุดหรือควบคุมความวิตกกังวลได้",
  "วิตกกังวลมากเกินไปในหลายๆ เรื่อง",
  "ผ่อนคลายได้ยาก",
  "รู้สึกกระวนกระวายจนนั่งไม่ติด",
  "กลายเป็นคนหงุดหงิดง่าย",
  "รู้สึกกลัวเหมือนว่าจะมีอะไรร้ายแรงเกิดขึ้น"
];

const options = [
  { label: "ไม่มีเลย", value: 0 },
  { label: "มีบางวัน", value: 1 },
  { label: "มีมากกว่าครึ่งของจำนวนวัน", value: 2 },
  { label: "มีเกือบทุกวัน", value: 3 }
];

export default function GAD7Screen() {
  const [answers, setAnswers] = useState(Array(7).fill(null));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (qIdx, val) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = val;
    setAnswers(newAnswers);
  };

  const calculateScore = async () => {
    if (answers.includes(null)) {
      alert("กรุณาตอบคำถามให้ครบทุกข้อครับ");
      return;
    }

    setLoading(true);
    const totalScore = answers.reduce((a, b) => a + b, 0);
    
    // จำลองการเรียก API (ถ้าคุณมี Backend สามารถเปลี่ยน fetch ตรงนี้ได้)
    setTimeout(() => {
      let level = "";
      let advice = "";

      if (totalScore <= 4) {
        level = "Minimal Anxiety (ปกติ)";
        advice = "สุขภาพจิตของคุณอยู่ในเกณฑ์ปกติ รักษาไลฟ์สไตล์ที่ดีนี้ไว้ครับ";
      } else if (totalScore <= 9) {
        level = "Mild Anxiety (เล็กน้อย)";
        advice = "คุณมีความวิตกกังวลเล็กน้อย ลองหาเวลาพักผ่อนหรือทำกิจกรรมที่ผ่อนคลายดูนะครับ";
      } else if (totalScore <= 14) {
        level = "Moderate Anxiety (ปานกลาง)";
        advice = "ควรเฝ้าระวังและหาโอกาสปรึกษาคนใกล้ชิด หรือผู้เชี่ยวชาญหากรู้สึกไม่สบายใจ";
      } else {
        level = "Severe Anxiety (รุนแรง)";
        advice = "แนะนำให้ปรึกษาจิตแพทย์หรือผู้เชี่ยวชาญเพื่อรับคำแนะนำที่ถูกต้องครับ";
      }

      setResult({ score: totalScore, level, advice });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-nurture-cream/30 py-12 px-4">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={fadeUp}
        className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-stone-100 p-8 md:p-12"
      >
        <button 
          onClick={() => navigate('/')}
          className="text-stone-400 hover:text-stone-600 mb-8 flex items-center transition-colors"
        >
          ← กลับหน้าหลัก
        </button>

        <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">GAD-7 Assessment</h1>
        <p className="text-stone-500 mb-10">ในช่วง 2 สัปดาห์ที่ผ่านมา คุณมีอาการเหล่านี้บ่อยแค่ไหน?</p>

        <div className="space-y-12">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="space-y-4">
              <h3 className="text-lg font-medium text-stone-700">{qIdx + 1}. {q}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(qIdx, opt.value)}
                    className={`px-4 py-3 rounded-xl text-sm border transition-all duration-200 ${
                      answers[qIdx] === opt.value
                        ? 'bg-stone-800 text-white border-stone-800 shadow-md'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-stone-100 text-center">
          {!result ? (
            <button
              onClick={calculateScore}
              disabled={loading}
              className={`px-12 py-4 bg-stone-800 text-white rounded-full font-bold shadow-lg hover:bg-stone-700 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'กำลังคำนวณ...' : 'คำนวณผลการประเมิน'}
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-stone-50 rounded-2xl p-8 border border-stone-200"
            >
              <h2 className="text-xl font-bold text-stone-800 mb-2">ผลการประเมินของคุณ</h2>
              <div className="text-5xl font-serif font-bold text-stone-800 mb-4">{result.score} <span className="text-lg font-sans font-normal text-stone-400">/ 21</span></div>
              <p className="inline-block px-4 py-1 bg-white rounded-full text-sm font-bold text-stone-600 border border-stone-200 mb-4">{result.level}</p>
              <p className="text-stone-600 leading-relaxed">{result.advice}</p>
              <button 
                onClick={() => setResult(null)} 
                className="mt-6 text-sm text-stone-400 hover:text-stone-600 underline"
              >
                ทำแบบประเมินอีกครั้ง
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
