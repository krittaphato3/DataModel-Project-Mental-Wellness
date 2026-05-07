import requests
from datetime import datetime

# URL ของ Web App ที่เรา Deploy มาจาก Google Apps Script (อัปเดตเป็นเวอร์ชัน 3 ล่าสุดแล้ว)
SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz2Pd3nhNgwj9_KlVp3kI867IsC4l2VllXWyuDtlaDEd2YI5fi8VHX3aui4CBlQ6vM/exec"

def save_to_google_sheet(user_data):
    """
    ฟังก์ชันสำหรับส่งข้อมูลเข้า Google Sheets
    รับค่าเป็น Dictionary แล้วส่งไปที่ Apps Script ทีเดียวจบ
    """
    try:
        current_date = datetime.now().strftime("%Y-%m-%d")
        current_time = datetime.now().strftime("%H:%M:%S")

        payload = {
            "name": user_data.get("name", "ไม่ระบุชื่อ"),
            "date": current_date,
            "time": current_time,
            "phq9_total": user_data.get("phq9_total", 0),
            "phq9_severity": user_data.get("phq9_severity", ""),
            "gad17_total": user_data.get("gad17_total", 0),
            "gad17_severity": user_data.get("gad17_severity", ""),
            "burnout_score": user_data.get("burnout_score", 0),
            "burnout_level": user_data.get("burnout_level", ""),
            "seeks_support": user_data.get("seeks_support", False),
            "job_change": user_data.get("job_change", False),
            "phq9_raw": str(user_data.get("phq9_raw", [])), # แปลงลิสต์เป็น string ก่อนลงชีท
            "gad17_raw": str(user_data.get("gad17_raw", []))
        }

        # ยิงข้อมูลไปที่ Google Sheets
        response = requests.post(SCRIPT_URL, json=payload)

        if response.status_code == 200:
            print("✅ บันทึกข้อมูลลง Google Sheets สำเร็จ!")
            return True
        else:
            print(f"❌ ส่งข้อมูลไม่สำเร็จ: Status Code {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets: {e}")
        return False

def update_feedback_in_sheet(rating, comment):
    """
    ฟังก์ชันสำหรับส่ง Rating และ Comment ไปอัปเดตที่แถวล่าสุดใน Sheet
    """
    try:
        # กำหนด action เป็น update_feedback เพื่อให้ Apps Script รู้ว่าเราแค่มาเติมคะแนน ไม่ได้สร้างแถวใหม่
        payload = {
            "action": "update_feedback",
            "rating": rating,
            "comment": comment
        }
        
        response = requests.post(SCRIPT_URL, json=payload)
        
        if response.status_code == 200:
            print("✅ บันทึก Feedback (ดาว + คอมเมนต์) ลงตารางสำเร็จ!")
            return True
        else:
            print(f"❌ บันทึก Feedback ไม่สำเร็จ: Status Code {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อส่ง Feedback: {e}")
        return False
