import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

interface EmailReport {
  cohorts: string[];
  learnerCount: number;
  reportType: 'calling-report' | 'no-submission-report';
  data: any[];
}

// Create transporter with SMTP configuration
function createTransporter() {
  // Get credentials from environment variables
  const senderEmail = process.env.SENDER_EMAIL;
  const appPassword = process.env.APP_PASSWORD;
  
  if (!senderEmail || !appPassword) {
    throw new Error('Missing email credentials. Please set SENDER_EMAIL and APP_PASSWORD in environment variables.');
  }
  
  // Simple Outlook/Office365 configuration
  const config = {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: senderEmail,
      pass: appPassword,
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  
  // Create and return the transporter
  return nodemailer.createTransport(config);
}

// Generate HTML table for email
function generateEmailTable(data: any[]): string {
  if (!data || data.length === 0) {
    return '<p>No data available</p>';
  }

  const headers = Object.keys(data[0]);
  
  let html = `
    <div style="overflow-x: auto;">
      <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; margin: 20px 0;">
        <thead>
          <tr style="background-color: #004080; color: white; font-weight: bold;">
  `;

  headers.forEach(header => {
    html += `<th style="padding: 12px; border: 1px solid #ddd; text-align: center;">${header}</th>`;
  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  data.forEach((row, index) => {
    const bgColor = index % 2 === 0 ? '#f2f2f2' : '#ffffff';
    html += `<tr style="background-color: ${bgColor};">`;
    
    headers.forEach(header => {
      let cellStyle = 'padding: 8px; border: 1px solid #ddd; text-align: center; word-wrap: break-word; max-width: 200px;';
      
      // Special styling for specific columns
      if (header === 'Learner Type') {
        const value = row[header]?.toString().toLowerCase();
        if (value === 'international') {
          cellStyle += ' background-color: #cfe2f3;';
        } else if (value === 'domestic') {
          cellStyle += ' background-color: #d9ead3;';
        }
      }
      
      if (header === 'Remarks' && row[header] && row[header].toString().trim() !== '') {
        cellStyle += ' background-color: #f8cbad;';
      }
      
      html += `<td style="${cellStyle}">${row[header] || ''}</td>`;
    });
    
    html += '</tr>';
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

// Generate email content
function generateEmailContent(report: EmailReport, recipientName: string = 'Manager'): string {
  const { cohorts, learnerCount, reportType, data } = report;
  const cohortText = cohorts.length === 1 ? 'Cohort' : 'Cohorts';
  const cohortList = cohorts.join(', ');
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const table = generateEmailTable(data);

  if (reportType === 'calling-report') {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">📞 Calling Report with Remarks</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${cohortText} • ${today}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 10px 0;"><strong>Hi ${recipientName},</strong></p>
              <p style="margin: 0;">Based on the selected ${cohortText.toLowerCase()} <strong>${cohortList}</strong>, below is the <strong>Calling Report with collected remarks</strong> for learners who have <strong>Not Submitted</strong>:</p>
            </div>
            
            <div style="padding: 20px; background: white;">
              <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">📊 Summary</h3>
                <p style="margin: 0;"><strong>Total Learners:</strong> ${learnerCount}</p>
                <p style="margin: 5px 0 0 0;"><strong>${cohortText}:</strong> ${cohortList}</p>
              </div>
              
              ${table}
            </div>
            
            <div style="background: #f1f3f4; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Best regards,</strong><br>
                UpGrad Team<br>
                <em>Calling Tracker System</em>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">📋 No Submission Report</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${cohortText} • ${today}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-left: 4px solid #ff6b6b;">
              <p style="margin: 0 0 10px 0;"><strong>Hi ${recipientName},</strong></p>
              <p style="margin: 0;">Based on the selected ${cohortText.toLowerCase()}, here is the <strong>No Submission Report</strong> for learners:</p>
            </div>
            
            <div style="padding: 20px; background: white;">
              <div style="background: #ffebee; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #c62828;">⚠️ Summary</h3>
                <p style="margin: 0;"><strong>Total Not Submitted:</strong> ${learnerCount}</p>
                <p style="margin: 5px 0 0 0;"><strong>${cohortText}:</strong> ${cohortList}</p>
              </div>
              
              ${table}
            </div>
            
            <div style="background: #f1f3f4; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Best regards,</strong><br>
                UpGrad Team<br>
                <em>Calling Tracker System</em>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Main email sending function
export async function sendEmailReport(options: {
  to: string;
  report: EmailReport;
  userInfo: {
    userId: string;
    userName: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { to, report, userInfo } = options;
    
    // SMTP configuration is hardcoded for Office 365
    console.log('Using Office 365 SMTP configuration');

    const transporter = createTransporter();
    
    // Generate subject
    const cohortText = report.cohorts.length === 1 ? 'Cohort' : 'Cohorts';
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    const subject = report.reportType === 'calling-report' 
      ? `Calling Report with Remarks – ${cohortText} – ${today}`
      : `No Submission Report – ${cohortText} – ${today}`;

    // Generate email content
    const html = generateEmailContent(report);

    // Send email
    const mailOptions: EmailOptions = {
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail({
      from: `"UpGrad Calling Tracker" <intlesgcidba@upgrad.com>`,
      ...mailOptions,
    });

    // Track the email report
    try {
      await fetch('/api/email-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInfo.userId,
          userName: userInfo.userName,
          recipientEmail: to,
          subject,
          reportType: report.reportType,
          cohorts: report.cohorts,
          learnerCount: report.learnerCount,
          status: 'sent'
        })
      });
    } catch (trackingError) {
      console.warn('Failed to track email report:', trackingError);
    }

    console.log('Email sent successfully:', info.messageId);
    return { success: true };

  } catch (error: any) {
    console.error('Email sending failed:', error);
    
    // Track failed email
    try {
      await fetch('/api/email-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: options.userInfo.userId,
          userName: options.userInfo.userName,
          recipientEmail: options.to,
          subject: 'Email Failed',
          reportType: options.report.reportType,
          cohorts: options.report.cohorts,
          learnerCount: options.report.learnerCount,
          status: 'failed'
        })
      });
    } catch (trackingError) {
      console.warn('Failed to track failed email:', trackingError);
    }

    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Testing Office 365 SMTP configuration...');
    
    // Try multiple Outlook configurations with app password
    const configs = [
      {
        name: 'Outlook Primary (Recommended)',
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: 'intlesgcidba@upgrad.com',
          pass: 'htmwlfsdhjjmxlls', // App password
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      },
      {
        name: 'Office365 Alternative',
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          user: 'intlesgcidba@upgrad.com',
          pass: 'htmwlfsdhjjmxlls', // App password
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    ];
    
    for (let i = 0; i < configs.length; i++) {
      try {
        console.log(`Trying ${configs[i].name}:`, {
          host: configs[i].host,
          port: configs[i].port,
          user: configs[i].auth.user
        });
        
        const transporter = nodemailer.createTransport(configs[i]);
        await transporter.verify();
        console.log(`Configuration ${i + 1} successful!`);
        return { success: true };
      } catch (configError: any) {
        console.log(`Configuration ${i + 1} failed:`, configError.message);
        if (i === configs.length - 1) {
          throw configError; // Throw the last error if all configs fail
        }
      }
    }
    
    return { success: false, error: 'All SMTP configurations failed' };
  } catch (error: any) {
    console.error('SMTP test failed:', error);
    return {
      success: false,
      error: `SMTP Error: ${error.message}. Please check email credentials and network connection.`
    };
  }
}
