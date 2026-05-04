import React, { useState } from 'react'; // 1. ย้ายมาบรรทัดแรกสุด

const GAD7Screen = () => {
    // 2. สร้าง State ไว้ข้างในนี้
    const [gad7Answers, setGad7Answers] = useState(Array(7).fill(null));
    const [result, setResult] = useState(null);

    const questions = [
        "รู้สึกกระสับกระส่าย วิตกกังวล หรือว้าวุ่นใจ",
        "ไม่สามารถหยุดหรือควบคุมความวิตกกังวลได้",
        "กังวลมากเกินไปในเรื่องต่างๆ",
        "ผ่อนคลายได้ยาก",
        "รู้สึกกระสับกระส่ายจนนั่งไม่ติด",
        "กลายเป็นคนหงุดหงิดง่าย",
        "รู้สึกกลัวเหมือนว่าจะมีอะไรน่ากลัวเกิดขึ้น"
    ];

    const options = ["ไม่เลย", "หลายวัน", "เกินครึ่งวัน", "เกือบทุกวัน"];

    // 3. ฟังก์ชัน handleAssessment ต้องอยู่ข้างในนี้ เพื่อให้เรียกใช้ setResult ได้
    const handleAssessment = async () => {
        if (gad7Answers.includes(null)) {
            alert("กรุณาตอบคำถามให้ครบทุกข้อครับ");
            return;
        }
        try {
            const response = await fetch('[https://data-model-project-mental-wellness-liard.vercel.app/assess](https://data-model-project-mental-wellness-liard.vercel.app/assess)', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phq9_answers: Array(9).fill(0), 
                    gad7_answers: gad7Answers
                }),
            });
            const data = await response.json();
            setResult(data); 
            console.log("Results from Backend:", data);
        } catch (error) {
            console.error("Error sending assessment:", error);
        }
    };

    return (
        return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
            <h1 className="text-3xl font-bold mb-2 text-blue-700">แบบประเมินความวิตกกังวล (GAD-7)</h1>
            <p className="text-gray-600 mb-8">ในช่วง 2 สัปดาห์ที่ผ่านมา ท่านมีอาการเหล่านี้บ่อยแค่ไหน?</p>
            
            <div className="space-y-8">
                {questions.map((q, idx) => (
                    <div key={idx} className="border-b pb-6">
                        <p className="text-lg font-semibold mb-4">{idx + 1}. {q}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {options.map((opt, score) => (
                                <button
                                    key={score}
                                    onClick={() => {
                                        const newAns = [...gad7Answers];
                                        newAns[idx] = score;
                                        setGad7Answers(newAns);
                                    }}
                                    className={`py-2 px-4 rounded-lg border-2 transition-all ${
                                        gad7Answers[idx] === score 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={handleAssessment}
                className="w-full bg-green-600 text-white py-4 rounded-xl mt-10 text-xl font-bold hover:bg-green-700 transition-colors shadow-lg"
            >
                คำนวณผลการประเมิน
            </button>

            {/* ส่วนแสดงผลลัพธ์เมื่อคำนวณเสร็จ */}
            {result && (
                <div className="mt-10 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl animate-fade-in">
                    <h2 className="text-2xl font-bold text-blue-900 mb-2">สรุปผลการประเมิน</h2>
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                        <div>
                            <p className="text-gray-600">คะแนนรวมของคุณคือ:</p>
                            <p className="text-3xl font-black text-blue-700">{result.gad7_total} คะแนน</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-600">ระดับความรุนแรง:</p>
                            <p className={`text-2xl font-bold ${
                                result.gad7_total >= 15 ? 'text-red-600' : 
                                result.gad7_total >= 10 ? 'text-orange-500' : 'text-green-600'
                            }`}>
                                {result.gad7_severity}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
    );
};

export default GAD7Screen;
