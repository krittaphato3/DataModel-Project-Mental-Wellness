import os
import json
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

load_dotenv()

HEADERS = ["submission_id", "timestamp", "question", "answer", "rating", "comment"]


def get_sheet():
    """Connect to the Google Sheet and ensure the correct header row exists."""
    creds_json = os.getenv("GOOGLE_SHEETS_CREDENTIALS")
    if not creds_json:
        return None
    try:
        cred_dict = json.loads(creds_json)
        scope = ["https://spreadsheets.google.com/feeds",
                 "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_dict(cred_dict, scope)
        client = gspread.authorize(creds)
        sheet = client.open("TechWellnessFeedback").sheet1
        # Ensure header row
        ensure_headers(sheet)
        return sheet
    except Exception as e:
        print(f"[feedback] Could not connect to Google Sheets: {e}")
        return None


def ensure_headers(sheet):
    """Write the header row if the sheet is empty or has no headers."""
    try:
        first_row = sheet.row_values(1)
        if not first_row or first_row != HEADERS:
            # Clear the entire sheet and write headers
            sheet.clear()
            sheet.append_row(HEADERS)
            print("[feedback] Headers written.")
    except Exception as e:
        print(f"[feedback] Could not ensure headers: {e}")


def save_answers(submission_id, answers: list):
    """
    answers: list of dicts with keys "question", "answer", "timestamp"
    Appends one row per answer with empty rating/comment.
    """
    sheet = get_sheet()
    if not sheet:
        _save_csv(submission_id, answers)
        return

    timestamp = answers[0].get("timestamp", "")
    rows = []
    for ans in answers:
        rows.append([
            submission_id,
            timestamp,
            ans.get("question", ""),
            ans.get("answer", ""),
            "",   # rating
            "",   # comment
        ])
    sheet.append_rows(rows)
    print(f"[answers] Saved {len(rows)} rows to Google Sheets.")


def update_feedback(submission_id, rating, comment):
    """Find all rows with the submission_id and set their rating & comment."""
    sheet = get_sheet()
    if not sheet:
        return False

    try:
        records = sheet.get_all_records()
        rows_to_update = []
        for i, record in enumerate(records, start=2):  # header is row 1
            if str(record.get("submission_id", "")) == submission_id:
                rows_to_update.append(i)

        if not rows_to_update:
            print(f"[feedback] No rows found for submission_id={submission_id}")
            return False

        for row_num in rows_to_update:
            sheet.update(f'E{row_num}', rating)
            sheet.update(f'F{row_num}', comment)

        print(f"[feedback] Updated {len(rows_to_update)} rows.")
        return True
    except Exception as e:
        print(f"[feedback] Update failed: {e}")
        return False


def _save_csv(submission_id, answers):
    """Fallback CSV writer."""
    import csv
    file_exists = os.path.isfile("answers.csv")
    with open("answers.csv", "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        if not file_exists:
            writer.writeheader()
        timestamp = answers[0].get("timestamp", "")
        for ans in answers:
            writer.writerow({
                "submission_id": submission_id,
                "timestamp": timestamp,
                "question": ans.get("question", ""),
                "answer": ans.get("answer", ""),
                "rating": "",
                "comment": "",
            })


# -- keep old function for backward compat --
def save_feedback(record: dict):
    """Original feedback function (kept for existing code)."""
    sheet = get_sheet()
    if not sheet:
        import csv
        file_exists = os.path.isfile("feedback.csv")
        with open("feedback.csv", "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=record.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(record)
        return
    row = [record.get(k, "") for k in ("timestamp", "rating", "comment",
                                        "predicted_values", "user_input")]
    sheet.append_row(row)