
"use server";

// Removed AI subject generation
import { ReportData } from "@/lib/types";
import { format } from 'date-fns';
import nodemailer from "nodemailer";

interface EmailPayload {
  recipientEmail: string;
  cohortDetails: string;
  reportType: string;
  reportData: ReportData[];
  hasRemarks: boolean;
}

export async function sendEmailReport(payload: EmailPayload) {
  const { recipientEmail, cohortDetails, reportType, reportData, hasRemarks } = payload;
  
  // Date format: 09-Sep-2025
  const today = format(new Date(), "dd-MMM-yyyy");
  
  const cohortWord = payload.cohortDetails.includes(',') ? "Cohorts" : "Cohort";

  // Use a static subject line instead of AI-generated
  const subject = `${reportType} – ${cohortWord} – ${today}`;

  const htmlBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; word-wrap: break-word; max-width: 200px;}
          th { background-color: #004080; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          tr:nth-child(odd) { background-color: #ffffff; }
        </style>
      </head>
      <body>
        <p>Hi Manager,</p>
        <p>Based on the ${cohortWord} ${cohortDetails}, below is the <b>${reportType}</b> for learners who have <b>Not Submitted</b>:</p>
        <div style='overflow-x:auto;'>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Cohort ID</th>
                <th>Learner Type</th>
                <th>Submission Name</th>
                ${hasRemarks ? '<th>Remarks</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${reportData
                .map(
                  (learner) => {
                    const learnerTypeStyle = learner["Learner Type"]?.toLowerCase() === 'international' ? 'background-color:#cfe2f3;' : (learner["Learner Type"]?.toLowerCase() === 'domestic' ? 'background-color:#d9ead3;' : '');
                    const remarkStyle = learner.remarks ? 'background-color:#f8cbad;' : '';
                    return `
                      <tr>
                        <td>${learner.Email}</td>
                        <td>${learner.Cohort}</td>
                        <td style="${learnerTypeStyle}">${learner["Learner Type"]}</td>
                        <td>${learner["Submission Name"]}</td>
                        ${hasRemarks ? `<td style="${remarkStyle}">${learner.remarks || "N/A"}</td>` : ''}
                      </tr>
                    `
                  }
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <p>Best regards,<br>UpGrad Team</p>
      </body>
    </html>
  `;
  
  // Get email credentials from environment variables
  const SENDER_EMAIL = process.env.SENDER_EMAIL || "intlesgcidba@upgrad.com";
  const APP_PASSWORD = process.env.APP_PASSWORD || "htmwlfsdhjjmxlls";
  
  // Try multiple SMTP configurations for better compatibility
  const transporter = nodemailer.createTransport({
    service: 'outlook', // Use outlook service directly
    auth: {
      user: SENDER_EMAIL,
      pass: APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Verify connection first
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    await transporter.sendMail({
      from: SENDER_EMAIL,
      to: recipientEmail,
      subject: subject,
      html: htmlBody,
    });

    return {
      success: true,
      message: `Email report sent successfully to ${recipientEmail}.`,
    };
  } catch (error: any) {
    console.error("Failed to send email report:", error);
    const errorMessage = error.code === 'EAUTH' 
      ? 'Email authentication failed. Please check email credentials.'
      : error.code === 'ECONNECTION'
      ? 'Unable to connect to email server. Please try again later.'
      : `Email failed: ${error.message || 'Unknown error'}`;
    
    return {
      success: false,
      message: errorMessage,
    };
  }
}
