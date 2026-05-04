const handleAssessment = async (phq9Scores, gad7Scores) => {
  try {
    const response = await fetch('http://localhost:8000/assess', { // เปลี่ยน URL ตามจริง
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phq9_answers: phq9Scores, // อาร์เรย์ตัวเลข 9 ตัว
        gad7_answers: gad7Scores  // อาร์เรย์ตัวเลข 7 ตัว
      }),
    });
    const result = await response.json();
    console.log("Results from Backend:", result);
    // แสดงผลคะแนน gad7_total และ gad7_severity ที่ได้จาก Backend
  } catch (error) {
    console.error("Error sending assessment:", error);
  }
};
