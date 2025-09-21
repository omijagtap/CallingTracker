# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.


## Running without Node.js (Python email sender)

If you cannot use Node.js but still need to generate and email the report, use the included Python script.

1) Prerequisites
- Install Python 3.10+ on Windows
- Open PowerShell and install dependencies:
  - python -m pip install -r requirements.txt

2) Configure credentials (never commit secrets)
- Copy .env.example to .env and fill the values:
  - SENDER_EMAIL=<your_outlook_email>
  - APP_PASSWORD=<your_app_password>

3) Run the script
- python .\email_report.py
- Follow the prompts:
  - Provide the CSV path
  - Select cohort(s)
  - Optionally enter remarks for Not Submitted learners
  - Choose whether to send the email

Notes
- The script uses the same column positions as the app:
  - B = Cohort, I = Email, AM = Submission Status, AN = Learner Type, AO = Submission Name
- Email is sent via Outlook SMTP (smtp.office365.com:587, STARTTLS)
- The script does not expose your credentials; they must be in environment variables loaded from .env
