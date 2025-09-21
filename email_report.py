import os
import sys
import smtplib
from email.message import EmailMessage
from datetime import datetime
from typing import List

import pandas as pd
from dotenv import load_dotenv

# ---------------- Utilities ----------------

def index_to_col(idx: int) -> str:
    # 0 -> A, 25 -> Z, 26 -> AA ...
    s = ""
    idx += 1
    while idx:
        idx, rem = divmod(idx - 1, 26)
        s = chr(65 + rem) + s
    return s


def col_to_index(col: str) -> int:
    col = col.strip().upper()
    n = 0
    for ch in col:
        n = n * 26 + (ord(ch) - 64)
    return n - 1  # 0-based


def ensure_excel_headers(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [index_to_col(i) for i in range(df.shape[1])]
    return df


def clean_str(x) -> str:
    if pd.isna(x):
        return ""
    return str(x).strip()


def pick_from_list(prompt: str, options: List[str]) -> List[str]:
    print(prompt)
    print(", ".join(options))
    while True:
        raw = input("Select cohort(s) (comma-separated if multiple): ").strip()
        selected = [s.strip() for s in raw.split(",") if s.strip()]
        invalid = [s for s in selected if s not in options]
        if not selected or invalid:
            print("❌ Invalid selection. Choose from:", ", ".join(options))
            continue
        return selected


# ---------------- Email content helpers ----------------

def style_table(df: pd.DataFrame) -> str:
    # Returns styled HTML table similar to the Next.js version
    html = [
        "<div style='overflow-x:auto;'>",
        "<table style='border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;'>",
        "<thead>",
        "<tr style='background-color: #004080; color: white; font-weight: bold;'>",
    ]
    for col in df.columns:
        html.append(f"<th style='padding: 8px; border: 1px solid #ddd; text-align:center;'>{col}</th>")
    html.append("</tr></thead><tbody>")

    for i, row in df.iterrows():
        bgcolor = "#f2f2f2" if (i % 2 == 0) else "#ffffff"
        html.append(f"<tr style='background-color:{bgcolor};'>")
        for col in df.columns:
            cell = row[col]
            cell_style = (
                "padding: 6px; border:1px solid #ddd; text-align:center; "
                "word-wrap: break-word; max-width:200px;"
            )
            if col == "Learner Type":
                cell_lower = str(cell).lower()
                if cell_lower == "international":
                    cell_style += "background-color:#cfe2f3;"
                elif cell_lower == "domestic":
                    cell_style += "background-color:#d9ead3;"
            if col == "Remarks" and pd.notna(cell) and str(cell).strip() != "":
                cell_style += "background-color:#f8cbad;"
            html.append(f"<td style='{cell_style}'>{cell}</td>")
        html.append("</tr>")
    html.append("</tbody></table></div>")
    return "".join(html)


def build_email_html_with_remarks(display_df: pd.DataFrame, cohort_word: str, cohorts_str: str) -> str:
    html_table = style_table(display_df)
    return f"""
    <html>
      <body>
        <p>Hi Manager,</p>
        <p>Based on the selected {cohort_word.lower()} {cohorts_str}, below is the <b>Calling Report with collected remarks</b> for learners who have <b>Not Submitted</b>:</p>
        {html_table}
        <p>Best regards,<br>UpGrad Team</p>
      </body>
    </html>
    """


def build_email_html_summary(df: pd.DataFrame, selected: List[str]) -> str:
    sections = []
    for cohort in selected:
        cdf = df[df["B"].astype(str).str.strip() == cohort]
        not_submitted_df = cdf[cdf["AM"].astype(str).str.strip().str.lower() == "not submitted"][
            ["I", "AO", "AN"]
        ].copy()
        count_not_submitted = len(not_submitted_df)
        if count_not_submitted > 0:
            not_submitted_df.columns = ["Email", "Submission Name", "Learner Type"]
            not_submitted_df["Cohort ID"] = cohort
            html_table = style_table(
                not_submitted_df[["Email", "Cohort ID", "Learner Type", "Submission Name"]]
            )
        else:
            html_table = "<p>No learners are in Not Submitted status for this cohort.</p>"
        sections.append(
            f"<h3>Cohort: {cohort}</h3><p>Total Not Submitted Count: {count_not_submitted}</p>{html_table}"
        )
    return f"""
    <html>
      <body>
        <p>Hi Manager,</p>
        <p>Based on the selected cohorts, here is the <b>No Submission Report</b> for learners:</p>
        {''.join(sections)}
        <p>Best regards,<br>UpGrad Team</p>
      </body>
    </html>
    """


def join_cohorts(selected: List[str]) -> str:
    if len(selected) == 1:
        return selected[0]
    if len(selected) == 2:
        return " & ".join(selected)
    return ", ".join(selected[:-1]) + " & " + selected[-1]


# ---------------- Main logic ----------------

def main():
    print("👋 Welcome! Let's process your learner CSV file.")
    file_path = input("Enter the full path to your CSV file: ").strip().strip('"')

    # Read CSV (attempt UTF-8 first, then Windows-1252)
    try:
        df = pd.read_csv(file_path, header=None, dtype=str)
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(file_path, header=None, dtype=str, encoding="cp1252")
        except Exception as e:
            print(f"❌ Error reading CSV: {e}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        sys.exit(1)

    df = ensure_excel_headers(df)
    print(f"✅ CSV loaded successfully with {df.shape[0]} rows and {df.shape[1]} columns.")

    required_cols = ["B", "I", "AM", "AN", "AO"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        print("❌ The CSV doesn't have required columns (by position):", ", ".join(missing))
        print("   Expected positions: B (Cohort), I (Email), AM (Submission Status), AN (Learner Type), AO (Submission Name)")
        sys.exit(1)

    # Unique cohorts
    cohorts = sorted({clean_str(x) for x in df["B"].unique() if clean_str(x)})
    if not cohorts:
        print("❌ No cohorts found in column B.")
        sys.exit(1)

    selected = pick_from_list("\nAvailable Cohort IDs:", cohorts)

    # Summary
    print("\n📊 Submission Summary:")
    for cohort in selected:
        cdf = df[df["B"].astype(str).str.strip() == cohort].copy()
        cdf["AM"] = cdf["AM"].astype(str).str.strip()
        cdf["AN"] = cdf["AN"].astype(str).str.strip()
        if not cdf.empty:
            summary = cdf.groupby(["AM", "AN"]).size().unstack(fill_value=0)
            print(f"\nCohort: {cohort}")
            print(summary)
        else:
            print(f"\nCohort: {cohort}\n(no rows)")

    # Collect remarks for Not Submitted
    action = input("\nDo you want to collect remarks for learners with 'Not Submitted'? (yes/no): ").strip().lower()
    remarks_rows = []
    if action == "yes":
        print("\n☎️ Collecting remarks (Not Submitted only)...")
        for cohort in selected:
            cdf = df[(df["B"].astype(str).str.strip() == cohort) &
                     (df["AM"].astype(str).str.strip().str.lower() == "not submitted")]
            for _, row in cdf.iterrows():
                email = clean_str(row["I"])  # Email
                learner_type = clean_str(row["AN"])  # Learner Type
                submission_name = clean_str(row["AO"])  # Submission Name
                cohort_id = clean_str(row["B"])  # Cohort ID

                print(f"\nLearner Email: {email}")
                print(f"Status: Not Submitted")
                print(f"Type: {learner_type}")
                print(f"Submission Name: {submission_name}")
                print(f"Cohort ID: {cohort_id}")

                remark = input("📝 Enter remarks for this learner: ").strip()
                remarks_rows.append({
                    "Email": email,
                    "Cohort ID": cohort_id,
                    "Learner Type": learner_type,
                    "Submission Name": submission_name,
                    "Remarks": remark,
                })
        if remarks_rows:
            remarks_df = pd.DataFrame(remarks_rows)
            remarks_df.to_csv("learner_remarks.csv", index=False)
            print("\n💾 Remarks saved to learner_remarks.csv")

    # Send Email
    send_email = input("\n📧 Do you want to email the report? (yes/no): ").strip().lower()
    if send_email == "yes":
        # Load env
        load_dotenv()
        sender_email = os.getenv("SENDER_EMAIL")
        app_password = os.getenv("APP_PASSWORD")
        if not sender_email or not app_password:
            print("❌ Missing SENDER_EMAIL or APP_PASSWORD environment variables.\n"
                  "   Create a .env file (copy from .env.example) and try again.")
            sys.exit(1)

        recipient_email = input("Enter the recipient email: ").strip()

        today = datetime.today().strftime("%d-%b-%Y")
        cohorts_str = join_cohorts(selected)
        cohort_word = "Cohort" if len(selected) == 1 else "Cohorts"

        if remarks_rows:
            subject = f"Calling Report with Remarks – {cohort_word} – {today}"
            display_df = pd.DataFrame(remarks_rows, columns=[
                "Email", "Cohort ID", "Learner Type", "Submission Name", "Remarks"
            ])
            html_content = build_email_html_with_remarks(display_df, cohort_word, cohorts_str)
        else:
            subject = f"No Submission Report – {cohort_word} – {today}"
            html_content = build_email_html_summary(df, selected)

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = recipient_email
        msg.add_alternative(html_content, subtype="html")

        try:
            with smtplib.SMTP("smtp.office365.com", 587) as smtp:
                smtp.starttls()
                smtp.login(sender_email, app_password)
                smtp.send_message(msg)
            print("✅ Email sent successfully!")
        except Exception as e:
            print(f"❌ Error sending email: {e}")
    else:
        print("\n✅ Report generation completed. No email sent.")


if __name__ == "__main__":
    main()
