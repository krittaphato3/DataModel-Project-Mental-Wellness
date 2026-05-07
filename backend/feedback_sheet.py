import requests
from datetime import datetime

# =========================
# Google Apps Script Web App URL
# =========================
SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWDrYszL8OcPRl2fk6dnM-9iVqpy605oSJeWqmrByrrppOMiSbLoO3yx22xeYGYdk/exec"


# =========================
# บันทึกผลประเมินลง Google Sheets
# =========================
def save_to_google_sheet(user_data):
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

            # แปลง list เป็น string
            "phq9_raw": str(user_data.get("phq9_raw", [])),
            "gad17_raw": str(user_data.get("gad17_raw", []))
        }

        print("📤 กำลังส่งผลประเมินไป Google Sheets...")
        print(payload)

        response = requests.post(
            SCRIPT_URL,
            json=payload,
            timeout=10
        )

        print("📥 Response:", response.status_code)
        print("📥 Response Text:", response.text)

        if response.status_code == 200:
            print("✅ บันทึกผลประเมินลง Google Sheets สำเร็จ")
            return True

        print("❌ ส่งข้อมูลไม่สำเร็จ")
        return False

    except Exception as e:
        print(f"❌ ERROR save_to_google_sheet: {e}")
        return False


# =========================
# อัปเดต Rating + Comment
# =========================
def update_feedback_in_sheet(rating, comment):
    try:

        payload = {
            "action": "update_feedback",
            "rating": rating,
            "comment": comment
        }

        print("📤 กำลังส่ง Feedback...")
        print(payload)

        response = requests.post(
            SCRIPT_URL,
            json=payload,
            timeout=10
        )

        print("📥 Response:", response.status_code)
        print("📥 Response Text:", response.text)

        if response.status_code == 200:
            print("✅ บันทึก Feedback สำเร็จ")
            return True

        print("❌ บันทึก Feedback ไม่สำเร็จ")
        return False

    except Exception as e:
        print(f"❌ ERROR update_feedback_in_sheet: {e}")
        return False
