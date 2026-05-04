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
            const response = await fetch('http://localhost:8000/assess', {
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
        // ... (ส่วนของ JSX return เหมือนที่ผมส่งให้ก่อนหน้านี้)
    );
};

export default GAD7Screen;
