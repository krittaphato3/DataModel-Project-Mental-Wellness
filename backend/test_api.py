import requests
import json

URL = "http://localhost:8000/predict"

payload = {
    "weekly_work_hours": 45,
    "work_location": "Remote",
    "sleep_hours": 6,
    "toxic_workplace_exposure": 5,
    "meeting_hours_per_week": 10,
    "manager_support": 7,
    "years_of_experience": 4,
    "age": 28,
    "job_role": "Software Engineer"
}

try:
    response = requests.post(URL, json=payload)
    response.raise_for_status()
    data = response.json()

    print("=== BACKEND PREDICTION ===")

    # Burnout
    burnout = data.get("burnout_level")
    if burnout is not None:
        print(f"Burnout Level: {burnout}/10")
    else:
        print("Burnout Level: burnout_model.pkl not found")

    # Seeks support
    support_score = data.get("seeks_mental_health_support_score")
    support_label = data.get("seeks_mental_health_support")
    if support_score is not None:
        print(f"Seeks Support: {support_score}/1  ({'Yes' if support_label else 'No'})")
    else:
        # Could be missing model or error
        warnings = data.get("warnings", [])
        support_warning = next((w for w in warnings if "mental_support" in w.lower()), None)
        if support_warning:
            print(f"Seeks Support: {support_warning}")
        else:
            print("Seeks Support: model not found")

    # Job change
    change_score = data.get("job_change_intention_score")
    change_label = data.get("job_change_intention")
    if change_score is not None:
        print(f"Job Change Intention: {change_score}/1  ({'Yes' if change_label else 'No'})")
    else:
        warnings = data.get("warnings", [])
        change_warning = next((w for w in warnings if "job_change" in w.lower()), None)
        if change_warning:
            print(f"Job Change Intention: {change_warning}")
        else:
            print("Job Change Intention: model not found")

    # Any other warnings
    warnings = data.get("warnings", [])
    if warnings:
        print("\n[Warnings]")
        for w in warnings:
            print(f"  - {w}")

    print("\nRaw JSON:")
    print(json.dumps(data, indent=2))

except requests.ConnectionError:
    print("Error: Could not connect to the backend. Is it running on http://localhost:8000 ?")
except Exception as e:
    print(f"Error: {e}")