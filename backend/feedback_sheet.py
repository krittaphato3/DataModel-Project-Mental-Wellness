import os
import json
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

load_dotenv()

def save_feedback(record: dict):
    """Append feedback to Google Sheet. Falls back to CSV if not configured."""
    creds_json = os.getenv("GOOGLE_SHEETS_CREDENTIALS")
    if not creds_json:
        # Fallback to CSV
        import csv
        file_exists = os.path.isfile("feedback.csv")
        with open("feedback.csv", "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=record.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(record)
        return

    try:
        cred_dict = json.loads(creds_json)
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_dict(cred_dict, scope)
        client = gspread.authorize(creds)
        sheet = client.open("TechWellnessFeedback").sheet1   # ← your sheet name
        row = [record.get(k, "") for k in ("timestamp", "rating", "comment", "predicted_values", "user_input")]
        sheet.append_row(row)
        print("[feedback] Saved to Google Sheets.")
    except Exception as e:
        print(f"[feedback] Google Sheets save failed, falling back to CSV: {e}")
        import csv
        file_exists = os.path.isfile("feedback.csv")
        with open("feedback.csv", "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=record.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(record)