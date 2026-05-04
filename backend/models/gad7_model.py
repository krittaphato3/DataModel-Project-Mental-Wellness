class GAD7Model:
    def __init__(self):
        # คำถามทั้ง 7 ข้อของ GAD-7
        self.questions = [
            "Feeling nervous, anxious, or on edge",
            "Not being able to stop or control worrying",
            "Worrying too much about different things",
            "Trouble relaxing",
            "Being so restless that it is hard to sit still",
            "Becoming easily annoyed or irritable",
            "Feeling afraid, as if something awful might happen"
        ]

    def calculate_severity(self, scores):
        """
        คะแนนรวม (Total Score):
        0-4: Minimal anxiety
        5-9: Mild anxiety
        10-14: Moderate anxiety
        15-21: Severe anxiety
        """
        total_score = sum(scores)
        
        if total_score <= 4:
            severity = "Minimal anxiety"
        elif total_score <= 9:
            severity = "Mild anxiety"
        elif total_score <= 14:
            severity = "Moderate anxiety"
        else:
            severity = "Severe anxiety"
            
        return {
            "total_score": total_score,
            "severity": severity,
            "recommendation": self.get_recommendation(severity)
        }

    def get_recommendation(self, severity):
        recommendations = {
            "Minimal anxiety": "ผลประเมินอยู่ในเกณฑ์ปกติ ควรดูแลสุขภาพจิตอย่างต่อเนื่อง",
            "Mild anxiety": "ควรเฝ้าสังเกตอาการตนเอง หรือลองทำกิจกรรมผ่อนคลายความเครียด",
            "Moderate anxiety": "ควรปรึกษาผู้เชี่ยวชาญหรือนักจิตวิทยาเพื่อรับคำแนะนำ",
            "Severe anxiety": "แนะนำให้เข้าพบจิตแพทย์เพื่อรับการวินิจฉัยและรักษาอย่างเหมาะสม"
        }
        return recommendations.get(severity, "")
